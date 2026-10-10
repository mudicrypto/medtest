import "server-only";

import type { Question, QuestionOption, TopicWithCount, TermRef } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";

// Student-facing reads. Row level security limits students to PUBLISHED
// questions, and these queries never touch question_keys.

const QUESTION_FIELDS =
  "slug, topic, stem_en, stem_ru, difficulty, key_terms, origin, rights_status, review_status, source_ref, topics(name_en), question_options(position, text_en, text_ru)";

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
    options: [...r.question_options]
      .sort((a, b) => a.position.localeCompare(b.position))
      .map((o) => ({
        id: o.position as QuestionOption["id"],
        textEn: o.text_en,
        textRu: showRu ? (o.text_ru ?? undefined) : undefined,
      })),
  };
}

export async function listTopicsWithCounts(): Promise<TopicWithCount[]> {
  const supabase = await createClient();
  const [{ data: topics }, { data: refs }] = await Promise.all([
    supabase.from("topics").select("slug, name_en, name_ru").order("sort_order"),
    supabase.from("questions").select("topic"),
  ]);
  const counts = new Map<string, number>();
  for (const r of refs ?? []) counts.set(r.topic, (counts.get(r.topic) ?? 0) + 1);
  return (topics ?? []).map((t) => ({
    slug: t.slug,
    nameEn: t.name_en,
    nameRu: t.name_ru,
    questionCount: counts.get(t.slug) ?? 0,
  }));
}

/** Lightweight list of available questions, for building sessions. */
export async function listQuestionRefs(topics?: string[]): Promise<{ id: string; topic: string }[]> {
  const supabase = await createClient();
  let q = supabase.from("questions").select("slug, topic").order("slug");
  if (topics?.length) q = q.in("topic", topics);
  const { data } = await q;
  return (data ?? []).map((r) => ({ id: r.slug, topic: r.topic }));
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
