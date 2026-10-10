// Question bank spreadsheet format (CSV, UTF-8) — parsing and validation.
// Used by the admin import page and by scripts. No server-only imports here so
// scripts and tests can use it too.

import Papa from "papaparse";
import { z } from "zod";

export const CSV_COLUMNS = [
  "slug",
  "topic",
  "difficulty",
  "stem_en",
  "stem_ru",
  "option_a_en",
  "option_a_ru",
  "option_b_en",
  "option_b_ru",
  "option_c_en",
  "option_c_ru",
  "option_d_en",
  "option_d_ru",
  "correct",
  "explanation_en",
  "explanation_ru",
  "tutor_hint",
  "key_terms",
  "origin",
  "rights_status",
  "review_status",
  "source_ref",
  "review_note",
] as const;

export type CsvRecord = Record<(typeof CSV_COLUMNS)[number], string>;

const ORIGINS = ["original_practice", "official_verified", "adapted", "demo"] as const;
const RIGHTS = ["owned", "licensed", "public_domain", "permission_pending", "not_cleared"] as const;
const REVIEW = ["draft", "in_review", "approved", "retired"] as const;
const POSITIONS = ["A", "B", "C", "D"] as const;

/** The shape the database's import_questions() function expects. */
export interface ImportRow {
  slug: string;
  topic: string;
  difficulty: 1 | 2 | 3;
  stem_en: string;
  stem_ru: string | null;
  key_terms: { ru: string; en: string }[];
  origin: (typeof ORIGINS)[number];
  rights_status: (typeof RIGHTS)[number];
  review_status: (typeof REVIEW)[number];
  source_ref: string | null;
  review_note: string | null;
  options: { position: (typeof POSITIONS)[number]; text_en: string; text_ru: string | null }[];
  key: { correct: (typeof POSITIONS)[number]; explanation_en: string; explanation_ru: string | null; tutor_hint: string | null };
}

const text = (min: number, max: number, label: string) =>
  z
    .string()
    .trim()
    .min(min, { error: min === 1 ? `${label} is required` : `${label} must be at least ${min} characters` })
    .max(max, { error: `${label} must be at most ${max} characters` });

const optional = (max: number, label: string) =>
  z
    .string()
    .trim()
    .max(max, { error: `${label} must be at most ${max} characters` })
    .transform((v) => (v === "" ? null : v));

const oneOf = <T extends readonly [string, ...string[]]>(values: T, label: string, fallback?: T[number]) =>
  z
    .string()
    .trim()
    .transform((v) => (v === "" && fallback ? fallback : v.toLowerCase()))
    .pipe(z.enum(values, { error: `${label} must be one of: ${values.join(", ")}` }));

/** "ru = en; ru = en" → [{ru, en}] */
function parseTerms(raw: string, ctx: z.RefinementCtx) {
  const out: { ru: string; en: string }[] = [];
  for (const part of raw.split(";").map((p) => p.trim()).filter(Boolean)) {
    const [ru, en, ...rest] = part.split("=").map((p) => p.trim());
    if (!ru || !en || rest.length) {
      ctx.addIssue({ code: "custom", message: `key_terms: "${part}" should look like "русский = English"` });
      return z.NEVER;
    }
    out.push({ ru, en });
  }
  return out;
}

function rowSchema(topics: string[]) {
  return z
    .object({
      slug: z
        .string()
        .trim()
        .toLowerCase()
        .regex(/^[a-z0-9][a-z0-9-]{1,79}$/, { error: "slug must be 2–80 characters: lowercase letters, numbers and hyphens" }),
      topic: z
        .string()
        .trim()
        .toLowerCase()
        .refine((t) => topics.includes(t), { error: `topic must be one of: ${topics.join(", ")}` }),
      difficulty: z
        .string()
        .trim()
        .transform((v) => (v === "" ? "2" : v))
        .pipe(z.enum(["1", "2", "3"], { error: "difficulty must be 1, 2 or 3" }))
        .transform((v) => Number(v) as 1 | 2 | 3),
      stem_en: text(10, 4000, "stem_en"),
      stem_ru: optional(4000, "stem_ru"),
      option_a_en: text(1, 1000, "option_a_en"),
      option_a_ru: optional(1000, "option_a_ru"),
      option_b_en: text(1, 1000, "option_b_en"),
      option_b_ru: optional(1000, "option_b_ru"),
      option_c_en: text(1, 1000, "option_c_en"),
      option_c_ru: optional(1000, "option_c_ru"),
      option_d_en: text(1, 1000, "option_d_en"),
      option_d_ru: optional(1000, "option_d_ru"),
      correct: z
        .string()
        .trim()
        .toUpperCase()
        .pipe(z.enum(POSITIONS, { error: "correct must be A, B, C or D" })),
      explanation_en: text(1, 8000, "explanation_en"),
      explanation_ru: optional(8000, "explanation_ru"),
      tutor_hint: optional(2000, "tutor_hint"),
      key_terms: z.string().transform(parseTerms),
      origin: oneOf(ORIGINS, "origin"),
      rights_status: oneOf(RIGHTS, "rights_status"),
      review_status: oneOf(REVIEW, "review_status", "in_review"),
      source_ref: optional(300, "source_ref"),
      review_note: optional(1000, "review_note"),
    })
    .transform(
      (r): ImportRow => ({
        slug: r.slug,
        topic: r.topic,
        difficulty: r.difficulty,
        stem_en: r.stem_en,
        stem_ru: r.stem_ru,
        key_terms: r.key_terms,
        origin: r.origin,
        rights_status: r.rights_status,
        review_status: r.review_status,
        source_ref: r.source_ref,
        review_note: r.review_note,
        options: POSITIONS.map((p) => {
          const k = p.toLowerCase() as "a" | "b" | "c" | "d";
          return { position: p, text_en: r[`option_${k}_en`], text_ru: r[`option_${k}_ru`] };
        }),
        key: { correct: r.correct, explanation_en: r.explanation_en, explanation_ru: r.explanation_ru, tutor_hint: r.tutor_hint },
      }),
    );
}

export interface RowError {
  /** Spreadsheet line number (header is line 1). */
  line: number;
  slug: string;
  messages: string[];
}

export interface ParseResult {
  rows: ImportRow[];
  errors: RowError[];
  /** File-level problems, e.g. missing columns. */
  fileErrors: string[];
}

export function parseQuestionsCsv(csv: string, topics: string[]): ParseResult {
  const parsed = Papa.parse<Record<string, string>>(csv.replace(/^﻿/, ""), {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (h) => h.trim().toLowerCase(),
  });

  const fileErrors: string[] = [];
  const headers = parsed.meta.fields ?? [];
  const missing = CSV_COLUMNS.filter((c) => !headers.includes(c));
  if (missing.length) fileErrors.push(`Missing columns: ${missing.join(", ")}. Download the template to see the expected format.`);
  for (const e of parsed.errors.slice(0, 5)) fileErrors.push(`Line ${(e.row ?? 0) + 2}: ${e.message}`);
  if (!parsed.data.length) fileErrors.push("The file has no question rows.");
  if (fileErrors.length) return { rows: [], errors: [], fileErrors };

  const schema = rowSchema(topics);
  const rows: ImportRow[] = [];
  const errors: RowError[] = [];
  const seen = new Map<string, number>();

  parsed.data.forEach((record, i) => {
    const line = i + 2;
    const filled = Object.fromEntries(CSV_COLUMNS.map((c) => [c, record[c] ?? ""])) as CsvRecord;
    const result = schema.safeParse(filled);
    const slug = (record.slug ?? "").trim().toLowerCase();
    const messages = result.success ? [] : result.error.issues.map((iss) => iss.message);

    if (slug && seen.has(slug)) messages.push(`slug "${slug}" is also used on line ${seen.get(slug)}`);
    else if (slug) seen.set(slug, line);

    if (messages.length || !result.success) errors.push({ line, slug, messages });
    else rows.push(result.data);
  });

  return { rows, errors, fileErrors };
}

/** Rows → CSV text (for the template and exports). */
export function toCsv(records: Partial<CsvRecord>[]): string {
  return Papa.unparse(
    records.map((r) => Object.fromEntries(CSV_COLUMNS.map((c) => [c, r[c] ?? ""]))),
    { columns: [...CSV_COLUMNS], newline: "\n" },
  );
}
