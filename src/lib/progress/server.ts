import "server-only";

import type { Attempt } from "@/lib/types";
import { newCard, schedule, type Grade, type SrsCard } from "@/lib/srs";
import type { createClient } from "@/lib/supabase/server";

type Client = Awaited<ReturnType<typeof createClient>>;
export type CardType = "question" | "term";

/** What the browser keeps in memory for the signed-in student. */
export interface MockSummary {
  blueprintId: string;
  questionIds: string[];
  answers: Record<string, string | undefined>;
  score: number;
  total: number;
  passed: boolean;
  submittedAt: number;
  durationSec: number;
}

export interface ProgressSnapshot {
  attempts: Attempt[];
  bookmarks: string[];
  /** Keyed "q:<slug>" or "t:<termId>". */
  cards: Record<string, SrsCard>;
  mocks: MockSummary[];
  showRussian: boolean;
}

const MAX_ATTEMPTS = 5000;

export const cardKey = (type: CardType, id: string) => `${type === "question" ? "q" : "t"}:${id}`;

type CardRow = { item_type: CardType; item_id: string; due: string; interval_days: number; ease: number; reps: number; lapses: number };

function toCard(r: CardRow): SrsCard {
  return { due: Date.parse(r.due), intervalDays: r.interval_days, ease: r.ease, reps: r.reps, lapses: r.lapses };
}

/** Loads everything the student screens need, in parallel. RLS limits each query to the user's own rows. */
export async function loadSnapshot(supabase: Client, userId: string): Promise<ProgressSnapshot> {
  const [attempts, bookmarks, cards, mocks, profile] = await Promise.all([
    supabase
      .from("attempts")
      .select("selected, is_correct, mode, answered_at, questions(slug, topic)")
      .eq("user_id", userId)
      .order("answered_at", { ascending: false })
      .limit(MAX_ATTEMPTS),
    supabase.from("bookmarks").select("created_at, questions(slug)").eq("user_id", userId).order("created_at"),
    supabase.from("srs_cards").select("item_type, item_id, due, interval_days, ease, reps, lapses").eq("user_id", userId),
    supabase
      .from("mock_attempts")
      .select("blueprint_id, question_slugs, answers, score, total, passed, duration_sec, submitted_at")
      .eq("user_id", userId)
      .order("submitted_at", { ascending: false })
      .limit(50),
    supabase.from("profiles").select("show_russian").eq("id", userId).single(),
  ]);
  for (const r of [attempts, bookmarks, cards, mocks]) if (r.error) throw new Error(r.error.message);

  return {
    attempts: (attempts.data ?? [])
      .filter((a) => a.questions)
      .reverse()
      .map((a) => ({
        questionId: a.questions!.slug,
        topic: a.questions!.topic,
        selected: (a.selected ?? "A") as Attempt["selected"],
        correct: a.is_correct,
        at: Date.parse(a.answered_at),
        mode: a.mode,
      })),
    bookmarks: (bookmarks.data ?? []).flatMap((b) => (b.questions ? [b.questions.slug] : [])),
    cards: Object.fromEntries((cards.data ?? []).map((c) => [cardKey(c.item_type, c.item_id), toCard(c)])),
    mocks: (mocks.data ?? []).map((m) => ({
      blueprintId: m.blueprint_id,
      questionIds: m.question_slugs,
      answers: (m.answers ?? {}) as Record<string, string>,
      score: m.score,
      total: m.total,
      passed: m.passed,
      submittedAt: Date.parse(m.submitted_at),
      durationSec: m.duration_sec,
    })),
    showRussian: profile.data?.show_russian ?? true,
  };
}

/** Applies a grade to one card (creating it if new) and saves it. Returns the new card. */
export async function gradeCardFor(supabase: Client, userId: string, type: CardType, itemId: string, grade: Grade): Promise<SrsCard> {
  const { data: existing } = await supabase
    .from("srs_cards")
    .select("item_type, item_id, due, interval_days, ease, reps, lapses")
    .eq("user_id", userId)
    .eq("item_type", type)
    .eq("item_id", itemId)
    .maybeSingle();
  const now = Date.now();
  const next = schedule(existing ? toCard(existing) : newCard(now), grade, now);
  const { error } = await supabase.from("srs_cards").upsert({
    user_id: userId,
    item_type: type,
    item_id: itemId,
    due: new Date(next.due).toISOString(),
    interval_days: next.intervalDays,
    ease: next.ease,
    reps: next.reps,
    lapses: next.lapses,
    updated_at: new Date(now).toISOString(),
  });
  if (error) throw new Error(error.message);
  return next;
}
