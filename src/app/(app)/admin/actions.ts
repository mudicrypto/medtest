"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { requireAdmin, requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { listTopicSlugs, REVIEW_STATUSES, RIGHTS } from "@/lib/content/admin";
import { parseQuestionsCsv, type ImportRow, type RowError } from "@/lib/content/csv";
import type { Json } from "@/lib/supabase/database.types";

// ─── Review status ───────────────────────────────────────────────────────

export type ActionState = { status: "idle" | "error" | "success"; message?: string };

export async function setReviewStatus(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireStaff();
  const parsed = z
    .object({
      slug: z.string().regex(/^[a-z0-9][a-z0-9-]{1,79}$/),
      status: z.enum(REVIEW_STATUSES as [string, ...string[]]),
      note: z.string().trim().max(1000),
    })
    .safeParse({ slug: formData.get("slug"), status: formData.get("status"), note: formData.get("note") ?? "" });
  if (!parsed.success) return { status: "error", message: "Invalid request." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("set_review_status", {
    p_slug: parsed.data.slug,
    p_status: parsed.data.status as (typeof REVIEW_STATUSES)[number],
    p_note: parsed.data.note || undefined,
  });
  if (error) return { status: "error", message: "Couldn't update the status. Please try again." };
  refresh();
  return { status: "success", message: "Status updated." };
}

// ─── Sources ─────────────────────────────────────────────────────────────

export type SourceFormState = ActionState & { fields?: Record<string, string> };

const sourceSchema = z.object({
  title: z.string().trim().min(1, { error: "Enter a title." }).max(200),
  publisher: z.string().trim().max(200),
  url: z.union([z.literal(""), z.url({ error: "Enter a full web address, or leave it empty." })]),
  rights_status: z.enum(RIGHTS as [string, ...string[]], { error: "Choose a rights status." }),
  permission_evidence: z.string().trim().max(2000),
  granted_by: z.string().trim().max(200),
  granted_on: z.union([z.literal(""), z.iso.date({ error: "Enter a valid date." })]),
  license_notes: z.string().trim().max(2000),
});

export async function createSource(_prev: SourceFormState, formData: FormData): Promise<SourceFormState> {
  await requireAdmin();
  const raw = Object.fromEntries(Object.keys(sourceSchema.shape).map((k) => [k, String(formData.get(k) ?? "")]));
  const parsed = sourceSchema.safeParse(raw);
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const i of parsed.error.issues) fields[String(i.path[0])] ??= i.message;
    return { status: "error", fields };
  }
  const d = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.from("content_sources").insert({
    title: d.title,
    publisher: d.publisher || null,
    url: d.url || null,
    rights_status: d.rights_status as (typeof RIGHTS)[number],
    permission_evidence: d.permission_evidence || null,
    granted_by: d.granted_by || null,
    granted_on: d.granted_on || null,
    license_notes: d.license_notes || null,
  });
  if (error) return { status: "error", message: "Couldn't save the source. Please try again." };
  refresh();
  return { status: "success", message: "Source saved." };
}

// ─── CSV import ──────────────────────────────────────────────────────────

export interface ImportState {
  status: "idle" | "error" | "preview" | "done";
  message?: string;
  fileErrors?: string[];
  rowErrors?: RowError[];
  totalRows?: number;
  validRows?: number;
  toCreate?: number;
  toUpdate?: number;
  sample?: Pick<ImportRow, "slug" | "topic" | "origin" | "rights_status" | "review_status">[];
  created?: number;
  updated?: number;
}

const MAX_BYTES = 5 * 1024 * 1024;

export async function importQuestions(_prev: ImportState, formData: FormData): Promise<ImportState> {
  await requireAdmin();
  const intent = formData.get("intent") === "import" ? "import" : "preview";
  const file = formData.get("file");
  const sourceId = String(formData.get("sourceId") ?? "");

  if (!(file instanceof File) || file.size === 0) return { status: "error", message: "Choose a CSV file first." };
  if (file.size > MAX_BYTES) return { status: "error", message: "That file is larger than 5 MB. Split it into smaller files." };
  if (sourceId && !z.uuid().safeParse(sourceId).success) return { status: "error", message: "Invalid source." };

  const text = await file.text();
  const result = parseQuestionsCsv(text, await listTopicSlugs());
  if (result.fileErrors.length) return { status: "error", fileErrors: result.fileErrors };

  // Official or adapted material must be linked to a registered source.
  if (!sourceId) {
    for (const r of result.rows.filter((r) => r.origin === "official_verified" || r.origin === "adapted")) {
      result.errors.push({ line: 0, slug: r.slug, messages: [`origin "${r.origin}" needs a source — choose one above`] });
    }
    result.rows = result.rows.filter((r) => r.origin !== "official_verified" && r.origin !== "adapted");
  }

  const supabase = await createClient();
  const slugs = result.rows.map((r) => r.slug);
  const existing = new Set<string>();
  for (let i = 0; i < slugs.length; i += 500) {
    const { data } = await supabase.from("questions").select("slug").in("slug", slugs.slice(i, i + 500));
    for (const r of data ?? []) existing.add(r.slug);
  }

  const summary: ImportState = {
    status: "preview",
    rowErrors: result.errors.slice(0, 100),
    totalRows: result.rows.length + result.errors.length,
    validRows: result.rows.length,
    toCreate: slugs.filter((s) => !existing.has(s)).length,
    toUpdate: slugs.filter((s) => existing.has(s)).length,
    sample: result.rows.slice(0, 8).map(({ slug, topic, origin, rights_status, review_status }) => ({
      slug,
      topic,
      origin,
      rights_status,
      review_status,
    })),
  };

  if (intent === "preview") return summary;

  // Import only a fully clean file, so a spreadsheet is never half-imported.
  if (result.errors.length) {
    return { ...summary, status: "error", message: "Fix the problems listed below, then check the file again." };
  }
  const { data, error } = await supabase.rpc("import_questions", {
    p_rows: result.rows as unknown as Json,
    p_source: sourceId || undefined,
  });
  if (error) return { ...summary, status: "error", message: `The import was cancelled and nothing was saved: ${error.message}` };
  refresh();
  return {
    status: "done",
    created: data.filter((r) => r.action === "created").length,
    updated: data.filter((r) => r.action === "updated").length,
  };
}

