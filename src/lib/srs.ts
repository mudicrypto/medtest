// Prototype spaced-repetition scheduler (a simplified SM-2).
// Milestone 5 replaces this with FSRS; the card shape is kept small on purpose
// so the switch only touches this file.

export type Grade = "again" | "hard" | "good" | "easy";

export interface SrsCard {
  due: number; // epoch ms
  intervalDays: number;
  ease: number;
  reps: number;
  lapses: number;
}

const DAY = 24 * 60 * 60 * 1000;
const MIN_EASE = 1.3;

export function newCard(now: number): SrsCard {
  return { due: now, intervalDays: 0, ease: 2.5, reps: 0, lapses: 0 };
}

export function schedule(card: SrsCard, grade: Grade, now: number): SrsCard {
  if (grade === "again") {
    return {
      ...card,
      // Relearn in ten minutes.
      due: now + 10 * 60 * 1000,
      intervalDays: 0,
      ease: Math.max(MIN_EASE, card.ease - 0.2),
      reps: 0,
      lapses: card.lapses + 1,
    };
  }

  const easeDelta = grade === "hard" ? -0.15 : grade === "easy" ? 0.15 : 0;
  const ease = Math.max(MIN_EASE, card.ease + easeDelta);

  let intervalDays: number;
  if (card.reps === 0) intervalDays = grade === "easy" ? 4 : 1;
  else if (card.reps === 1) intervalDays = grade === "hard" ? 3 : 6;
  else {
    const factor = grade === "hard" ? 1.2 : grade === "easy" ? ease * 1.3 : ease;
    intervalDays = Math.max(card.intervalDays + 1, Math.round(card.intervalDays * factor));
  }

  return {
    ...card,
    due: now + intervalDays * DAY,
    intervalDays,
    ease,
    reps: card.reps + 1,
  };
}

/** A multiple-choice answer maps to a grade: wrong = again, right = good. */
export function gradeFromAnswer(correct: boolean): Grade {
  return correct ? "good" : "again";
}

export function isDue(card: SrsCard, now: number): boolean {
  return card.due <= now;
}

/** Human-friendly label for the next interval, shown on grade buttons. */
export function intervalLabel(card: SrsCard, grade: Grade, now: number): string {
  const next = schedule(card, grade, now);
  const ms = next.due - now;
  if (ms < DAY) return `${Math.round(ms / 60000)} min`;
  const days = Math.round(ms / DAY);
  return days === 1 ? "1 day" : `${days} days`;
}
