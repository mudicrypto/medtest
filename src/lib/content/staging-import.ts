// Validation and mapping for bilingual question banks delivered in the
// "medprep-staging-1" JSON format (first used for Cardiology → Medications).
// Pure functions: used by scripts/import-question-bank.ts and unit tests.
//
// Rules:
// - Texts, options and answer keys are copied exactly, never rewritten.
// - Nothing is invented: no explanations, no extra options, no reviewers or
//   review dates.
// - A record that isn't a complete four-option question in both languages is
//   kept unchanged in a "needs correction" list instead of the question bank.

export const STAGING_SCHEMA = "medprep-staging-1";
const POSITIONS = ["A", "B", "C", "D"] as const;
const CYRILLIC = /[А-Яа-яЁё]/;
const SLUG = /^[a-z0-9][a-z0-9-]{1,79}$/;

export interface StagingRecord {
  id: string;
  batch_id: string;
  specialty: string;
  category: string;
  topic_en: string;
  topic_ru: string;
  source_filename: string;
  source_question_number: number;
  question_ru: string;
  question_en: string;
  options_ru: string[];
  options_en: string[];
  source_correct_option_index: number | null;
  english_correct_option_index: number | null;
  explanation_en: string | null;
  review_status: string;
  publication_status: string;
  rights_status: string;
  quality_flags: string[];
  clinician_reviewed: boolean;
}

export interface StagingFile {
  schema_version: string;
  note?: string;
  batches: { batch: string; expected: number; extracted: number; flags?: Record<string, number> }[];
  questions: StagingRecord[];
}

export interface PlannedTopic {
  slug: string;
  nameEn: string;
  nameRu: string;
  parentSlug: string;
  categoryEn: string;
}

export interface PlannedQuestion {
  slug: string;
  topic: string;
  stemEn: string;
  stemRu: string;
  sourceRef: string;
  reviewNote: string;
  options: { position: (typeof POSITIONS)[number]; textEn: string; textRu: string }[];
  correct: (typeof POSITIONS)[number];
}

export interface PlannedIssue {
  slug: string;
  batch: string;
  topic: string;
  sourceRef: string;
  issues: string[];
  record: StagingRecord;
}

export interface ImportPlan {
  topics: PlannedTopic[];
  questions: PlannedQuestion[];
  issues: PlannedIssue[];
  /** Problems that stop the whole import (nothing is written). */
  errors: string[];
  /** Facts worth reporting that don't stop the import. */
  notices: string[];
}

const sourceRef = (r: StagingRecord) => `${r.source_filename} · question ${r.source_question_number}`;

/** Why a record can't be a complete question (empty list = complete). */
export function recordIssues(r: StagingRecord): string[] {
  const issues = new Set(r.quality_flags ?? []);
  if (r.review_status === "needs_source_correction" && issues.size === 0) issues.add("needs_source_correction");
  if (r.options_ru.length !== 4 || r.options_en.length !== 4) issues.add("nonstandard_option_count");
  if (r.options_ru.length !== r.options_en.length) issues.add("translation_option_count_mismatch");
  const ru = r.source_correct_option_index;
  const en = r.english_correct_option_index;
  if (ru === null || en === null || ru !== en || ru < 0 || ru >= Math.min(r.options_ru.length, 4)) issues.add("answer_key_invalid");
  const texts = [r.question_ru, r.question_en, ...r.options_ru, ...r.options_en];
  if (texts.some((t) => typeof t !== "string" || !t.trim())) issues.add("missing_text");
  if (!CYRILLIC.test(r.question_ru ?? "") || CYRILLIC.test(r.question_en ?? "") || r.options_en.some((o) => CYRILLIC.test(o ?? ""))) {
    issues.add("language_mismatch");
  }
  if ((r.question_en ?? "").length < 10 || (r.question_en ?? "").length > 4000 || (r.question_ru ?? "").length > 4000) issues.add("question_length");
  if (texts.slice(2).some((t) => (t ?? "").length > 1000)) issues.add("option_too_long");
  return [...issues];
}

const normalise = (s: string) => s.trim().replace(/\s+/g, " ").toLowerCase();

/**
 * Plans an import. `parentSlug` is the existing topic the bank belongs under
 * (e.g. "cardiology"); `parentName` must match the records' specialty.
 */
export function planImport(file: StagingFile, parent: { slug: string; nameEn: string }, attestation: string): ImportPlan {
  const errors: string[] = [];
  const notices: string[] = [];
  if (file.schema_version !== STAGING_SCHEMA) errors.push(`Unsupported schema "${file.schema_version}" (expected ${STAGING_SCHEMA}).`);
  const records = Array.isArray(file.questions) ? file.questions : [];
  if (!records.length) errors.push("The file has no questions.");

  // Identity: unique, well-formed IDs and source numbers.
  const seenIds = new Set<string>();
  const seenNumbers = new Set<string>();
  for (const r of records) {
    if (!SLUG.test(r.id)) errors.push(`Invalid question ID "${r.id}".`);
    if (seenIds.has(r.id)) errors.push(`Duplicate question ID "${r.id}".`);
    seenIds.add(r.id);
    const n = `${r.batch_id}#${r.source_question_number}`;
    if (seenNumbers.has(n)) errors.push(`Duplicate source number ${r.source_question_number} in ${r.batch_id}.`);
    seenNumbers.add(n);
    if (r.specialty !== parent.nameEn) errors.push(`${r.id}: specialty "${r.specialty}" isn't "${parent.nameEn}".`);
  }

  // Each batch is one topic, with one official name in each language.
  const topics: PlannedTopic[] = [];
  const batches = [...new Set(records.map((r) => r.batch_id))];
  for (const b of batches) {
    const inBatch = records.filter((r) => r.batch_id === b);
    const names = new Set(inBatch.map((r) => `${r.category}|${r.topic_en}|${r.topic_ru}`));
    if (names.size !== 1) errors.push(`Batch ${b} has ${names.size} different topic names; expected one.`);
    if (!/^[a-z0-9-]+$/.test(b)) errors.push(`Batch ID "${b}" can't be used as a topic ID.`);
    const r = inBatch[0];
    topics.push({ slug: b, nameEn: r.topic_en, nameRu: r.topic_ru, parentSlug: parent.slug, categoryEn: r.category });
    const declared = file.batches?.find((x) => x.batch === b);
    if (declared && declared.expected !== inBatch.length) {
      notices.push(`${b}: the source expected ${declared.expected} questions; the file contains ${inBatch.length}.`);
    }
  }

  // Same stem twice is allowed (different options = different question);
  // identical stem + options + key is a true duplicate.
  const fingerprints = new Map<string, string>();
  for (const r of records) {
    const fp = [r.question_ru, ...r.options_ru, String(r.source_correct_option_index)].map(normalise).join("|");
    const prev = fingerprints.get(fp);
    if (prev) errors.push(`${r.id} duplicates ${prev} (same question, options and answer).`);
    fingerprints.set(fp, r.id);
  }

  const questions: PlannedQuestion[] = [];
  const issues: PlannedIssue[] = [];
  for (const r of records) {
    const problems = recordIssues(r);
    if (problems.length) {
      issues.push({ slug: r.id, batch: r.batch_id, topic: r.batch_id, sourceRef: sourceRef(r), issues: problems, record: r });
      continue;
    }
    questions.push({
      slug: r.id,
      topic: r.batch_id,
      stemEn: r.question_en,
      stemRu: r.question_ru,
      sourceRef: sourceRef(r),
      reviewNote:
        `${attestation} No individual reviewer or review date is recorded. ` +
        `Source file status: review_status=${r.review_status}, clinician_reviewed=${r.clinician_reviewed}, ` +
        `rights_status=${r.rights_status}, publication_status=${r.publication_status}.`,
      options: POSITIONS.map((position, i) => ({ position, textEn: r.options_en[i], textRu: r.options_ru[i] })),
      correct: POSITIONS[r.source_correct_option_index!],
    });
  }
  return { topics, questions, issues, errors, notices };
}
