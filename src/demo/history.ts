// Seeded DEMO progress so the dashboard and analytics aren't empty on first
// visit. Generated deterministically so every visitor sees the same picture.
import type { Attempt } from "@/lib/types";
import { questions } from "./questions";
import { keyByQuestionId } from "./keys";

// Per-topic chance of a correct answer, to make the charts tell a story.
const skill: Record<string, number> = {
  cardiology: 0.82,
  pulmonology: 0.7,
  gastroenterology: 0.55,
  endocrinology: 0.75,
  "infectious-diseases": 0.62,
  neurology: 0.48,
  obstetrics: 0.8,
  pediatrics: 0.68,
  surgery: 0.58,
};

// Small deterministic PRNG (mulberry32).
function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seedHistory(now: number): Attempt[] {
  const rand = rng(42);
  const out: Attempt[] = [];
  // 13 past days; skip a couple to make the activity look human.
  for (let day = 13; day >= 1; day--) {
    if (day === 9 || day === 5) continue;
    const count = 4 + Math.floor(rand() * 7);
    for (let i = 0; i < count; i++) {
      const q = questions[Math.floor(rand() * questions.length)];
      // Accuracy improves slightly over time.
      const p = Math.min(0.95, skill[q.topic] + (13 - day) * 0.012);
      const correct = rand() < p;
      const key = keyByQuestionId[q.id];
      const wrong = q.options.find((o) => o.id !== key.correct)!;
      out.push({
        questionId: q.id,
        selected: correct ? key.correct : wrong.id,
        correct,
        at: now - day * 86_400_000 + i * 90_000,
        mode: "practice",
      });
    }
  }
  return out;
}
