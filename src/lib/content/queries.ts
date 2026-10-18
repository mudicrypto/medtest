import "server-only";

import type { Question, Term, TopicWithCount, TermRef } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";

// Student-facing reads. Row level security limits students to PUBLISHED
// questions, and these queries never touch question_keys.

const QUESTION_FIELDS =
  "slug, topic, stem_en, stem_ru, difficulty, key_terms, origin, rights_status, review_status, source_ref, scored, practice_release, source_flags, topics(name_en), question_options(position, text_en, text_ru)";

type Row = {
  slug: string;
  topic: string;
  stem_en: string;
  stem_ru: string | null;
  difficulty: number;
  key_terms: unknown;
  origin: Question["origin"];
  rights_status: Question["rightsStatus"];
  review_status: Question["reviewStatus"];
  source_ref: string | null;
  scored: boolean;
  practice_release: boolean;
  source_flags: string[];
  topics: { name_en: string } | null;
  question_options: { position: string; text_en: string; text_ru: string | null }[];
};

function toQuestion(r: Row): Question {
  const showRu = r.rights_status !== "not_cleared";
  return {
    id: r.slug,
    topic: r.topic,
    topicName: r.topics?.name_en ?? r.topic,
    stemEn: r.stem_en,
    stemRu: showRu ? (r.stem_ru ?? undefined) : undefined,
    difficulty: (r.difficulty as 1 | 2 | 3) ?? 2,
    origin: r.origin,
    rightsStatus: r.rights_status,
    reviewStatus: r.review_status,
    sourceRef: r.source_ref ?? undefined,
    keyTerms: Array.isArray(r.key_terms) ? (r.key_terms as TermRef[]) : [],
    scored: r.scored,
    practiceRelease: r.practice_release,
    sourceFlags: r.source_flags ?? [],
    options: [...r.question_options]
      .sort((a, b) => a.position.localeCompare(b.position))
      .map((o) => ({
        id: o.position,
        textEn: o.text_en,
        textRu: showRu ? (o.text_ru ?? undefined) : undefined,
      })),
  };
}

export async function listTopicsWithCounts(): Promise<TopicWithCount[]> {
  const supabase = await createClient();
  // Counts come from a database view: the API returns at most 1,000 rows per
  // request, so counting rows here would silently undercount large banks.
  const [{ data: topics, error: topicsError }, { data: counts, error: countsError }] = await Promise.all([
    supabase.from("topics").select("slug, name_en, name_ru, parent_slug, category_en").order("sort_order"),
    supabase.from("topic_question_counts").select("topic, question_count"),
  ]);
  // A failed request must not look like "no questions yet".
  const error = topicsError ?? countsError;
  if (error) throw new Error(`Could not load topics: ${error.message}`);
  const countOf = new Map((counts ?? []).map((c) => [c.topic, c.question_count ?? 0]));
  const bySlug = new Map((topics ?? []).map((t) => [t.slug, t]));
  // "Primary Accreditation › General Medicine (31.05.01) › Cardiology", walking up the hierarchy.
  const pathOf = (slug: string) => {
    const parts: string[] = [];
    let t = bySlug.get(slug);
    for (let guard = 0; t?.parent_slug && guard < 10; guard++) {
      if (t.category_en) parts.unshift(t.category_en);
      t = bySlug.get(t.parent_slug);
      if (t) parts.unshift(t.name_en);
    }
    return parts.length ? parts.join(" › ") : null;
  };
  return (topics ?? []).map((t) => ({
    slug: t.slug,
    nameEn: t.name_en,
    nameRu: t.name_ru,
    questionCount: countOf.get(t.slug) ?? 0,
    path: pathOf(t.slug),
    parentSlug: t.parent_slug,
  }));
}

/** A topic and every topic below it, e.g. a whole bank or discipline. */
export async function listTopicsUnder(root: string): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("topics").select("slug, parent_slug");
  if (error) throw new Error(`Could not load topics: ${error.message}`);
  const out = new Set([root]);
  for (let grew = true; grew; ) {
    grew = false;
    for (const t of data) {
      if (t.parent_slug && out.has(t.parent_slug) && !out.has(t.slug)) {
        out.add(t.slug);
        grew = true;
      }
    }
  }
  return [...out];
}

const PAGE = 1000;

/** Lightweight list of available questions, for building sessions. Reads every page. */
export async function listQuestionRefs(topics?: string[], options: { scoredOnly?: boolean } = {}): Promise<{ id: string; topic: string }[]> {
  const supabase = await createClient();
  const out: { id: string; topic: string }[] = [];
  for (let from = 0; ; from += PAGE) {
    let q = supabase.from("questions").select("slug, topic").order("slug").range(from, from + PAGE - 1);
    if (topics?.length) q = q.in("topic", topics);
    if (options.scoredOnly) q = q.eq("scored", true);
    const { data, error } = await q;
    if (error) throw new Error(`Could not load questions: ${error.message}`);
    out.push(...data.map((r) => ({ id: r.slug, topic: r.topic })));
    if (data.length < PAGE) return out;
  }
}

/** Full questions (without keys), returned in the order requested. */
export async function getQuestions(slugs: string[]): Promise<Question[]> {
  if (!slugs.length) return [];
  const supabase = await createClient();
  const { data, error } = await supabase.from("questions").select(QUESTION_FIELDS).in("slug", slugs);
  if (error) throw new Error(`Could not load questions: ${error.message}`);
  const bySlug = new Map((data as unknown as Row[]).map((r) => [r.slug, toQuestion(r)]));
  return slugs.map((s) => bySlug.get(s)).filter((q): q is Question => !!q);
}

export async function getQuestion(slug: string): Promise<Question | null> {
  const [q] = await getQuestions([slug]);
  return q ?? null;
}

/** Terminology cards, in ID order. Students receive only published terms (row level security). */
export async function listTerms(): Promise<Term[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("terms")
    .select("id, ru, translit, en, topic, example_ru, example_en, origin, topics(name_en)")
    .order("id");
  if (error) throw new Error(`Could not load terms: ${error.message}`);
  return (data ?? []).map((t) => ({
    id: t.id,
    ru: t.ru,
    translit: t.translit,
    en: t.en,
    topic: t.topic ?? "general",
    topicName: t.topics?.name_en ?? "General",
    exampleRu: t.example_ru ?? "",
    exampleEn: t.example_en ?? "",
    origin: t.origin,
  }));
}
