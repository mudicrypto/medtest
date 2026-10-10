import { describe, expect, it } from "vitest";
import { newCard, schedule, isDue } from "../../src/lib/srs";
import { dailyStats, openMistakes, overallAccuracy, streakDays, topicStats } from "../../src/lib/analytics";
import type { Attempt } from "../../src/lib/types";
import { readFileSync } from "node:fs";
import { topics } from "../../src/demo/topics";
import { parseQuestionsCsv, toCsv, CSV_COLUMNS, type CsvRecord } from "../../src/lib/content/csv";

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
    topic: topicOf(questionId),
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

const TOPIC_SLUGS = topics.map((t) => t.slug);
const demoCsv = readFileSync("content/demo-questions.csv", "utf8");

describe("demo question bank (content/demo-questions.csv)", () => {
  const { rows, errors, fileErrors } = parseQuestionsCsv(demoCsv, TOPIC_SLUGS);

  it("parses with no errors", () => {
    expect(fileErrors).toEqual([]);
    expect(errors).toEqual([]);
    expect(rows).toHaveLength(18);
  });

  it("every question is labelled demo, not reviewed, with four options and a valid key", () => {
    for (const r of rows) {
      expect(r.origin, r.slug).toBe("demo");
      expect(r.review_status, r.slug).toBe("draft");
      expect(r.options.map((o) => o.position)).toEqual(["A", "B", "C", "D"]);
      expect(["A", "B", "C", "D"]).toContain(r.key.correct);
      expect(r.key.explanation_en.length, r.slug).toBeGreaterThan(40);
    }
  });

  it("Russian text contains no Latin letters mixed into Cyrillic words", () => {
    const mixed = /[а-яё][a-z]|[a-z][а-яё]/i;
    for (const r of rows) {
      for (const text of [r.stem_ru ?? "", ...r.options.map((o) => o.text_ru ?? "")]) {
        expect(mixed.test(text), `${r.slug}: ${text}`).toBe(false);
      }
    }
  });
});

describe("CSV import validation", () => {
  const good: Partial<CsvRecord> = {
    slug: "test-01",
    topic: "cardiology",
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
  };

  it("accepts a valid row and fills sensible defaults", () => {
    const { rows, errors } = parseQuestionsCsv(toCsv([good]), TOPIC_SLUGS);
    expect(errors).toEqual([]);
    expect(rows[0]).toMatchObject({
      slug: "test-01",
      difficulty: 2,
      review_status: "in_review",
      stem_ru: null,
      key: { correct: "B" },
      key_terms: [
        { ru: "тахикардия", en: "tachycardia" },
        { ru: "одышка", en: "dyspnoea" },
      ],
    });
  });

  it("reports every problem in a bad row, with its spreadsheet line number", () => {
    const bad = { ...good, slug: "Bad Slug!", topic: "astrology", correct: "E", origin: "official", key_terms: "no equals sign" };
    const { rows, errors } = parseQuestionsCsv(toCsv([good, bad]), TOPIC_SLUGS);
    expect(rows).toHaveLength(1);
    expect(errors).toHaveLength(1);
    expect(errors[0].line).toBe(3);
    const text = errors[0].messages.join(" | ");
    expect(text).toMatch(/slug must be/);
    expect(text).toMatch(/topic must be one of/);
    expect(text).toMatch(/correct must be A, B, C or D/);
    expect(text).toMatch(/origin must be one of/);
    expect(text).toMatch(/key_terms/);
  });

  it("flags duplicate slugs within one file", () => {
    const { errors } = parseQuestionsCsv(toCsv([good, good]), TOPIC_SLUGS);
    expect(errors[0].messages.join()).toMatch(/also used on line 2/);
  });

  it("rejects files with missing columns", () => {
    const { fileErrors } = parseQuestionsCsv("slug,topic\na,b\n", TOPIC_SLUGS);
    expect(fileErrors[0]).toMatch(/Missing columns/);
  });

  it("handles a UTF-8 byte-order mark (Excel's 'CSV UTF-8' export)", () => {
    const { rows } = parseQuestionsCsv("\uFEFF" + toCsv([good]), TOPIC_SLUGS);
    expect(rows).toHaveLength(1);
  });

  it("the template columns are stable", () => {
    expect(CSV_COLUMNS).toHaveLength(23);
  });
});
