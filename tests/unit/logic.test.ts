import { describe, expect, it } from "vitest";
import { newCard, schedule, isDue } from "../../src/lib/srs";
import { dailyStats, openMistakes, overallAccuracy, streakDays, topicStats } from "../../src/lib/analytics";
import type { Attempt } from "../../src/lib/types";
import { questions, questionById } from "../../src/demo/questions";
import { keyByQuestionId } from "../../src/demo/keys";
import { topics } from "../../src/demo/topics";
import { terms } from "../../src/demo/terms";
import { seedHistory } from "../../src/demo/history";

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
  const a = (questionId: string, correct: boolean, at: number): Attempt => ({
    questionId,
    correct,
    at,
    selected: "A",
    mode: "practice",
  });

  it("computes overall and per-topic accuracy", () => {
    const attempts = [a("q-card-01", true, NOW), a("q-card-02", false, NOW), a("q-pulm-01", true, NOW)];
    expect(overallAccuracy(attempts)).toBe(67);
    expect(overallAccuracy([])).toBeNull();
    const stats = topicStats(attempts, topics, questionById);
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

describe("demo content integrity", () => {
  it("every question is labelled demo and has exactly four options A–D", () => {
    for (const q of questions) {
      expect(q.origin, q.id).toBe("demo");
      expect(q.options.map((o) => o.id), q.id).toEqual(["A", "B", "C", "D"]);
      expect(topics.some((t) => t.slug === q.topic), q.id).toBe(true);
    }
  });

  it("every question has exactly one answer key pointing at a real option", () => {
    expect(Object.keys(keyByQuestionId).sort()).toEqual(questions.map((q) => q.id).sort());
    for (const q of questions) {
      const key = keyByQuestionId[q.id];
      expect(q.options.some((o) => o.id === key.correct), q.id).toBe(true);
      expect(key.explanationEn.length, q.id).toBeGreaterThan(40);
    }
  });

  it("question ids and term ids are unique", () => {
    expect(new Set(questions.map((q) => q.id)).size).toBe(questions.length);
    expect(new Set(terms.map((t) => t.id)).size).toBe(terms.length);
  });

  it("Russian text, where present, contains no Latin letters mixed into Cyrillic words", () => {
    const mixed = /[а-яё][a-z]|[a-z][а-яё]/i;
    for (const q of questions) {
      for (const text of [q.stemRu ?? "", ...q.options.map((o) => o.textRu ?? "")]) {
        expect(mixed.test(text), `${q.id}: ${text}`).toBe(false);
      }
    }
  });

  it("seeded history is deterministic and only references real questions", () => {
    const h1 = seedHistory(NOW);
    const h2 = seedHistory(NOW);
    expect(h1).toEqual(h2);
    expect(h1.length).toBeGreaterThan(30);
    for (const at of h1) {
      expect(questionById[at.questionId]).toBeDefined();
      expect(at.correct).toBe(at.selected === keyByQuestionId[at.questionId].correct);
    }
  });
});
