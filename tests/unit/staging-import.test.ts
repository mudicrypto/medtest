import { describe, expect, it } from "vitest";
import { planImport, recordIssues, type StagingFile, type StagingRecord } from "../../src/lib/content/staging-import";

// Synthetic records only; the real (licensed) bank isn't needed for these rules.

const PARENT = { slug: "cardiology", nameEn: "Cardiology" };
const ATTEST = "Owner attestation (test).";

function rec(n: number, extra: Partial<StagingRecord> = {}): StagingRecord {
  return {
    id: `cardio-test-01-q${String(n).padStart(4, "0")}`,
    batch_id: "cardio-test-01",
    specialty: "Cardiology",
    category: "Medications",
    topic_en: "Test topic",
    topic_ru: "Тестовая тема",
    source_filename: "Test_RU-EN.docx",
    source_question_number: n,
    question_ru: `ВОПРОС НОМЕР ${n} О ПРЕПАРАТЕ`,
    question_en: `QUESTION NUMBER ${n} ABOUT A DRUG`,
    options_ru: ["первый", "второй", "третий", "четвёртый"],
    options_en: ["first", "second", "third", "fourth"],
    source_correct_option_index: 2,
    english_correct_option_index: 2,
    explanation_en: null,
    review_status: "pending_clinical_review",
    publication_status: "unpublished",
    rights_status: "unverified",
    quality_flags: [],
    clinician_reviewed: false,
    ...extra,
  };
}

const file = (questions: StagingRecord[], expected = questions.length): StagingFile => ({
  schema_version: "medprep-staging-1",
  batches: [{ batch: "cardio-test-01", expected, extracted: questions.length }],
  questions,
});

describe("a complete record", () => {
  const plan = planImport(file([rec(25)]), PARENT, ATTEST);
  const q = plan.questions[0];

  it("keeps its source number in a stable ID and reference", () => {
    expect(plan.errors).toEqual([]);
    expect(q.slug).toBe("cardio-test-01-q0025");
    expect(q.sourceRef).toBe("Test_RU-EN.docx · question 25");
  });

  it("copies both languages exactly and maps options 0–3 to A–D", () => {
    expect(q.stemEn).toBe("QUESTION NUMBER 25 ABOUT A DRUG");
    expect(q.stemRu).toBe("ВОПРОС НОМЕР 25 О ПРЕПАРАТЕ");
    expect(q.options).toEqual([
      { position: "A", textEn: "first", textRu: "первый" },
      { position: "B", textEn: "second", textRu: "второй" },
      { position: "C", textEn: "third", textRu: "третий" },
      { position: "D", textEn: "fourth", textRu: "четвёртый" },
    ]);
    expect(q.correct).toBe("C");
  });

  it("records the attestation and the file's own status, without a reviewer", () => {
    expect(q.reviewNote).toContain(ATTEST);
    expect(q.reviewNote).toContain("No individual reviewer or review date is recorded.");
    expect(q.reviewNote).toContain("review_status=pending_clinical_review");
    expect(q.reviewNote).toContain("clinician_reviewed=false");
    expect(q).not.toHaveProperty("explanation");
  });

  it("puts the topic under its parent and category", () => {
    expect(plan.topics).toEqual([
      { slug: "cardio-test-01", nameEn: "Test topic", nameRu: "Тестовая тема", parentSlug: "cardiology", categoryEn: "Medications" },
    ]);
  });
});

describe("incomplete records go to the correction list, unchanged", () => {
  it.each([
    ["three options", { options_ru: ["a", "б", "в"], options_en: ["a", "b", "c"] }, "nonstandard_option_count"],
    ["five options", { options_ru: ["а", "б", "в", "г", "д"], options_en: ["a", "b", "c", "d", "e"] }, "nonstandard_option_count"],
    ["4 Russian vs 7 English options", { options_en: ["a", "b", "c", "d", "e", "f", "g"] }, "translation_option_count_mismatch"],
    ["answer keys that disagree", { english_correct_option_index: 1 }, "answer_key_invalid"],
    ["an answer key out of range", { source_correct_option_index: 4, english_correct_option_index: 4 }, "answer_key_invalid"],
    ["an empty option", { options_en: ["first", "", "third", "fourth"] }, "missing_text"],
    ["English text in the Russian field", { question_ru: "ENGLISH ONLY QUESTION" }, "language_mismatch"],
    ["a source flag", { quality_flags: ["source_truncated"], review_status: "needs_source_correction" }, "source_truncated"],
  ] as const)("%s", (_name, extra, issue) => {
    const r = rec(7, extra as Partial<StagingRecord>);
    expect(recordIssues(r)).toContain(issue);
    const plan = planImport(file([r]), PARENT, ATTEST);
    expect(plan.questions).toEqual([]);
    expect(plan.issues).toHaveLength(1);
    expect(plan.issues[0].record).toBe(r); // nothing invented or dropped
  });
});

describe("whole-file checks", () => {
  it("rejects duplicate IDs and duplicate source numbers", () => {
    const plan = planImport(file([rec(1), rec(1)]), PARENT, ATTEST);
    expect(plan.errors.join(" ")).toMatch(/Duplicate question ID/);
    expect(plan.errors.join(" ")).toMatch(/Duplicate source number 1/);
  });

  it("allows the same stem with different options, but not a full duplicate", () => {
    const sameStem = rec(2, { question_ru: rec(1).question_ru, question_en: rec(1).question_en, options_ru: ["х", "у", "з", "ж"] });
    expect(planImport(file([rec(1), sameStem]), PARENT, ATTEST).errors).toEqual([]);
    const full = rec(3, { question_ru: rec(1).question_ru, question_en: rec(1).question_en });
    expect(planImport(file([rec(1), full]), PARENT, ATTEST).errors.join(" ")).toMatch(/duplicates/);
  });

  it("reports when the source expected more questions than the file has", () => {
    const plan = planImport(file([rec(1)], 2), PARENT, ATTEST);
    expect(plan.notices).toEqual(["cardio-test-01: the source expected 2 questions; the file contains 1."]);
  });

  it("rejects a bank from another specialty or schema", () => {
    expect(planImport(file([rec(1, { specialty: "Neurology" })]), PARENT, ATTEST).errors.join(" ")).toMatch(/specialty/);
    expect(planImport({ ...file([rec(1)]), schema_version: "other" }, PARENT, ATTEST).errors.join(" ")).toMatch(/Unsupported schema/);
  });
});
