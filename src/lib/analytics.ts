import type { Attempt, Question, Topic } from "@/lib/types";

export interface TopicStat {
  slug: string;
  name: string;
  answered: number;
  correct: number;
  /** 0–100, or null when nothing has been answered yet. */
  accuracy: number | null;
}

export function topicStats(
  attempts: Attempt[],
  topics: Topic[],
  questionById: Record<string, Question>,
): TopicStat[] {
  return topics.map((t) => {
    const mine = attempts.filter((a) => questionById[a.questionId]?.topic === t.slug);
    const correct = mine.filter((a) => a.correct).length;
    return {
      slug: t.slug,
      name: t.nameEn,
      answered: mine.length,
      correct,
      accuracy: mine.length ? Math.round((correct / mine.length) * 100) : null,
    };
  });
}

export interface DayStat {
  /** Local date, YYYY-MM-DD. */
  date: string;
  answered: number;
  accuracy: number | null;
}

function localDate(ms: number): string {
  const d = new Date(ms);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

/** One entry per calendar day for the last `days` days, oldest first. */
export function dailyStats(attempts: Attempt[], days: number, now: number): DayStat[] {
  const out: DayStat[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = localDate(now - i * 86_400_000);
    const mine = attempts.filter((a) => localDate(a.at) === date);
    const correct = mine.filter((a) => a.correct).length;
    out.push({
      date,
      answered: mine.length,
      accuracy: mine.length ? Math.round((correct / mine.length) * 100) : null,
    });
  }
  return out;
}

export function overallAccuracy(attempts: Attempt[]): number | null {
  if (!attempts.length) return null;
  return Math.round((attempts.filter((a) => a.correct).length / attempts.length) * 100);
}

/** Consecutive days (ending today or yesterday) with at least one answer. */
export function streakDays(attempts: Attempt[], now: number): number {
  const active = new Set(attempts.map((a) => localDate(a.at)));
  let streak = 0;
  let i = active.has(localDate(now)) ? 0 : 1;
  while (active.has(localDate(now - i * 86_400_000))) {
    streak++;
    i++;
  }
  return streak;
}

/**
 * Latest answer per question that is still wrong — the "mistakes" list.
 * A question leaves the list once it's answered correctly.
 */
export function openMistakes(attempts: Attempt[]): string[] {
  const latest = new Map<string, Attempt>();
  for (const a of [...attempts].sort((x, y) => x.at - y.at)) latest.set(a.questionId, a);
  return [...latest.values()].filter((a) => !a.correct).map((a) => a.questionId);
}
