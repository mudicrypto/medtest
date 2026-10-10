import { describe, expect, it } from "vitest";
import { newCard, schedule, isDue } from "../../src/lib/srs";
import { dailyStats, openMistakes, overallAccuracy, streakDays, topicStats } from "../../src/lib/analytics";
import type { Attempt } from "../../src/lib/types";
import { readFileSync } from "node:fs";
import { topics } from "../../src/demo/topics";
import { terms } from "../../src/demo/terms";
import { parseQuestionsCsv, recordToCsv, toCsv, CSV_COLUMNS, type CsvRecord } from "../../src/lib/content/csv";
import { validateRecord } from "../../src/lib/content/model";
import { demoBank } from "../../content/demo-bank";

const DAY = 86_400_000;
const NOW = new Date("2026-10-10T12:00:00").getTime();

describe("spaced repetition", () => {
  it("new cards are due immediately", () => {
    expect(isDue(newCard(NOW), NOW)).toBe(true);
  });

  it("good answers grow the interval: 1 → 6 → ~15 days", () => {
    let c = schedule(newCard(NOW), "good", NOW);
    expect(c.intervalDays).toBe(1);
    c = schedule(c, "good", c.due);
    expect(c.intervalDays).toBe(6);
    c = schedule(c, "good", c.due);
    expect(c.intervalDays).toBe(15);
  });

  it("'again' resets reps, counts a lapse and returns in 10 minutes", () => {
    const learned = schedule(schedule(newCard(NOW), "good", NOW), "good", NOW);
    const lapsed = schedule(learned, "again", NOW);
    expect(lapsed.reps).toBe(0);
    expect(lapsed.lapses).toBe(1);
    expect(lapsed.due - NOW).toBe(10 * 60 * 1000);
    expect(lapsed.ease).toBeLessThan(learned.ease);
  });

  it("ease never drops below 1.3", () => {
    let c = newCard(NOW);
    for (let i = 0; i < 20; i++) c = schedule(c, "again", NOW);
    expect(c.ease).toBe(1.3);
  });
});

describe("analytics", () => {
  const topicOf = (id: string) =>
    ({ card: "cardiology", pulm: "pulmonology", gi: "gastroenterology" })[id.split("-")[1] as "card" | "pulm" | "gi"];
  const a = (questionId: string, correct: boolean, at: number): Attempt => ({
    questionId,
    specialty: topicOf(questionId),
    correct,
    at,
    selected: "A",
    mode: "practice",
  });

  it("computes overall and per-topic accuracy", () => {
    const attempts = [a("q-card-01", true, NOW), a("q-card-02", false, NOW), a("q-pulm-01", true, NOW)];
    expect(overallAccuracy(attempts)).toBe(67);
    expect(overallAccuracy([])).toBeNull();
    const stats = topicStats(attempts, topics);
    expect(stats.find((s) => s.slug === "cardiology")).toMatchObject({ answered: 2, correct: 1, accuracy: 50 });
    expect(stats.find((s) => s.slug === "surgery")?.accuracy).toBeNull();
  });

  it("a question leaves the mistakes list once answered correctly", () => {
    const attempts = [a("q-gi-01", false, NOW - 2 * DAY), a("q-gi-01", true, NOW - DAY), a("q-gi-02", false, NOW)];
    expect(openMistakes(attempts)).toEqual(["q-gi-02"]);
  });

  it("counts a streak ending today, and tolerates not having practised yet today", () => {
    const attempts = [a("q-gi-01", true, NOW - DAY), a("q-gi-01", true, NOW - 2 * DAY), a("q-gi-01", true, NOW - 4 * DAY)];
    expect(streakDays(attempts, NOW)).toBe(2);
    expect(streakDays([...attempts, a("q-gi-01", true, NOW)], NOW)).toBe(3);
  });

  it("returns one entry per day with null accuracy for empty days", () => {
    const days = dailyStats([a("q-gi-01", true, NOW)], 14, NOW);
    expect(days).toHaveLength(14);
    expect(days[13]).toMatchObject({ answered: 1, accuracy: 100 });
    expect(days[0].accuracy).toBeNull();
  });
});

const SPECIALTIES = [...topics.map((t) => t.slug), "emergency-medicine"];
const demoCsv = readFileSync("content/demo-questions.csv", "utf8");

describe("illustrative demo bank", () => {
  const { rows, errors, fileErrors } = parseQuestionsCsv(demoCsv, SPECIALTIES);

  it("has 20 valid questions, 4 in each required specialty", () => {
    expect(demoBank).toHaveLength(20);
    for (const q of demoBank) expect(validateRecord(q), q.id).toEqual([]);
    const per = Object.fromEntries(["cardiology", "pulmonology", "neurology", "endocrinology", "emergency-medicine"].map((sp) => [sp, demoBank.filter((q) => q.specialty === sp).length]));
    expect(per).toEqual({ cardiology: 4, pulmonology: 4, neurology: 4, endocrinology: 4, "emergency-medicine": 4 });
    expect(new Set(demoBank.map((q) => q.id)).size).toBe(20);
  });

  it("every question is labelled illustrative and unreviewed", () => {
    for (const q of demoBank) {
      expect(q.origin, q.id).toBe("demo");
      expect(q.reviewStatus, q.id).toBe("draft");
      expect(q.reviewNote, q.id).toMatch(/not yet validated by a qualified medical reviewer/i);
    }
  });

  it("every question has full teaching content", () => {
    for (const q of demoBank) {
      expect(q.subject && q.topic && q.subtopic, q.id).toBeTruthy();
      expect(q.stemRu, q.id).toBeTruthy();
      expect(q.examPearl, q.id).toBeTruthy();
      expect(q.keyTerms.length, q.id).toBeGreaterThan(0);
      expect(q.explanationEn.length, q.id).toBeGreaterThan(40);
    }
  });

  it("uses a spread of correct-answer positions", () => {
    const counts = Object.fromEntries(["A", "B", "C", "D"].map((p) => [p, demoBank.filter((q) => q.correct === p).length]));
    for (const p of ["A", "B", "C", "D"]) expect(counts[p], p).toBeGreaterThanOrEqual(2);
  });

  it("the CSV file is up to date with content/demo-bank.ts (run pnpm content:build)", () => {
    expect(fileErrors).toEqual([]);
    expect(errors).toEqual([]);
    expect(demoCsv).toBe(toCsv(demoBank.map(recordToCsv)) + "\n");
    expect(rows.map((r) => r.slug)).toEqual(demoBank.map((q) => q.id));
    expect(rows[0].key.option_explanations).toEqual(demoBank[0].optionExplanations);
  });

  it("Russian text contains no Latin letters mixed into Cyrillic words", () => {
    const mixed = /[а-яё][a-z]|[a-z][а-яё]/i;
    for (const q of demoBank) {
      for (const text of [q.stemRu ?? "", q.explanationRu ?? "", ...q.options.map((o) => o.textRu ?? ""), ...q.keyTerms.map((t) => t.ru)]) {
        expect(mixed.test(text), `${q.id}: ${text}`).toBe(false);
      }
    }
  });
});

describe("CSV import validation", () => {
  const good: Partial<CsvRecord> = {
    slug: "test-01",
    specialty: "cardiology",
    subject: "Arrhythmias",
    topic: "Atrial fibrillation",
    stem_en: "Which drug is first-line for this stable patient?",
    option_a_en: "One",
    option_b_en: "Two",
    option_c_en: "Three",
    option_d_en: "Four",
    correct: "b",
    explanation_en: "Because two.",
    key_terms: "тахикардия = tachycardia; одышка = dyspnoea",
    origin: "original_practice",
    rights_status: "owned",
    why_a: "Because not one.",
    exam_pearl: "Remember two.",
  };

  it("accepts a valid row and fills sensible defaults", () => {
    const { rows, errors } = parseQuestionsCsv(toCsv([good]), SPECIALTIES);
    expect(errors).toEqual([]);
    expect(rows[0]).toMatchObject({
      slug: "test-01",
      specialty: "cardiology",
      subject: "Arrhythmias",
      topic: "Atrial fibrillation",
      subtopic: null,
      difficulty: 2,
      review_status: "in_review",
      stem_ru: null,
      key: { correct: "B", option_explanations: { A: "Because not one." }, exam_pearl: "Remember two." },
      key_terms: [
        { ru: "тахикардия", en: "tachycardia" },
        { ru: "одышка", en: "dyspnoea" },
      ],
    });
  });

  it("reports every problem in a bad row, with its spreadsheet line number", () => {
    const bad = { ...good, slug: "Bad Slug!", specialty: "astrology", topic: "", correct: "E", origin: "official", key_terms: "no equals sign" };
    const { rows, errors } = parseQuestionsCsv(toCsv([good, bad]), SPECIALTIES);
    expect(rows).toHaveLength(1);
    expect(errors).toHaveLength(1);
    expect(errors[0].line).toBe(3);
    const text = errors[0].messages.join(" | ");
    expect(text).toMatch(/slug must be/);
    expect(text).toMatch(/specialty must be one of/);
    expect(text).toMatch(/topic is required/);
    expect(text).toMatch(/correct must be A, B, C or D/);
    expect(text).toMatch(/origin must be one of/);
    expect(text).toMatch(/key_terms/);
  });

  it("flags duplicate slugs within one file", () => {
    const { errors } = parseQuestionsCsv(toCsv([good, good]), SPECIALTIES);
    expect(errors[0].messages.join()).toMatch(/also used on line 2/);
  });

  it("rejects files with missing columns", () => {
    const { fileErrors } = parseQuestionsCsv("slug,topic\na,b\n", SPECIALTIES);
    expect(fileErrors[0]).toMatch(/Missing columns/);
  });

  it("handles a UTF-8 byte-order mark (Excel's 'CSV UTF-8' export)", () => {
    const { rows } = parseQuestionsCsv("\uFEFF" + toCsv([good]), SPECIALTIES);
    expect(rows).toHaveLength(1);
  });

  it("the template columns are stable", () => {
    expect(CSV_COLUMNS).toHaveLength(31);
  });
});

describe("demo terms", () => {
  it("term ids are unique and valid card ids", () => {
    expect(new Set(terms.map((t) => t.id)).size).toBe(terms.length);
    for (const t of terms) expect(t.id).toMatch(/^[a-z0-9][a-z0-9-]{0,79}$/);
  });
});
