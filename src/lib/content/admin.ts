import "server-only";

import { createClient } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/auth";
import type { Database } from "@/lib/supabase/database.types";

// Staff-only reads. requireStaff() turns everyone else away; row level
// security independently limits what these queries can return.

type Enums = Database["public"]["Enums"];
export type ReviewStatus = Enums["review_status"];
export type ContentOrigin = Enums["content_origin"];
export type RightsStatus = Enums["rights_status"];

export const REVIEW_STATUSES: ReviewStatus[] = ["draft", "in_review", "approved", "retired"];
export const ORIGINS: ContentOrigin[] = ["original_practice", "official_verified", "adapted", "demo"];
export const RIGHTS: RightsStatus[] = ["owned", "licensed", "public_domain", "permission_pending", "not_cleared"];

/** Mirrors public.is_published() in the database. */
export function isPublished(q: { rights_status: RightsStatus; review_status: ReviewStatus; origin: ContentOrigin }) {
  return (
    ["owned", "licensed", "public_domain"].includes(q.rights_status) &&
    q.review_status !== "retired" &&
    (q.review_status === "approved" || q.origin === "demo")
  );
}

export async function contentStats() {
  await requireStaff();
  const supabase = await createClient();
  const { data, error } = await supabase.from("questions").select("review_status, origin, rights_status");
  if (error) throw new Error(`Could not load content stats: ${error.message}`);
  const rows = data;
  const byStatus = Object.fromEntries(REVIEW_STATUSES.map((s) => [s, rows.filter((r) => r.review_status === s).length]));
  const byOrigin = Object.fromEntries(ORIGINS.map((o) => [o, rows.filter((r) => r.origin === o).length]));
  return { total: rows.length, published: rows.filter(isPublished).length, byStatus, byOrigin } as {
    total: number;
    published: number;
    byStatus: Record<ReviewStatus, number>;
    byOrigin: Record<ContentOrigin, number>;
  };
}

export interface AdminQuestionFilters {
  status?: string;
  origin?: string;
  topic?: string;
  search?: string;
}

export async function listQuestionsForStaff(f: AdminQuestionFilters) {
  await requireStaff();
  const supabase = await createClient();
  let q = supabase
    .from("questions")
    .select("slug, topic, stem_en, origin, rights_status, review_status, updated_at, topics(name_en)")
    .order("updated_at", { ascending: false })
    .limit(200);
  if (f.status && REVIEW_STATUSES.includes(f.status as ReviewStatus)) q = q.eq("review_status", f.status as ReviewStatus);
  if (f.origin && ORIGINS.includes(f.origin as ContentOrigin)) q = q.eq("origin", f.origin as ContentOrigin);
  if (f.topic && /^[a-z0-9-]+$/.test(f.topic)) q = q.eq("topic", f.topic);
  if (f.search) {
    const term = f.search.replace(/[%_,()]/g, " ").trim().slice(0, 80);
    if (term) q = q.or(`slug.ilike.%${term}%,stem_en.ilike.%${term}%`);
  }
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return data;
}

export async function getQuestionForStaff(slug: string) {
  await requireStaff();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("questions")
    .select(
      "*, topics(name_en), question_options(position, text_en, text_ru), question_keys(correct, explanation_en, explanation_ru, tutor_hint), content_sources(title, publisher, rights_status, permission_evidence), reviewer:profiles!questions_reviewed_by_fkey(display_name)",
    )
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(`Could not load question: ${error.message}`);
  return data;
}

export async function listSources() {
  await requireStaff();
  const supabase = await createClient();
  const { data, error } = await supabase.from("content_sources").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(`Could not load sources: ${error.message}`);
  return data;
}

export async function listTopicSlugs(): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("topics").select("slug").order("sort_order");
  if (error) throw new Error(`Could not load topics: ${error.message}`);
  return data.map((t) => t.slug);
}

/** Imported records that need correcting before they can become questions. Never shown to students. */
export async function listImportIssues() {
  await requireStaff();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("question_import_issues")
    .select("slug, batch, source_ref, issues, updated_at, topics(name_en)")
    .order("slug");
  if (error) throw new Error(`Could not load import issues: ${error.message}`);
  return data;
}
