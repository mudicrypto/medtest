"use client";

// The signed-in student's progress, loaded from their account once per visit
// and kept in memory so screens update instantly. Every change is saved on the
// server; answers and their review scheduling are saved by the grading call
// itself, before the result reaches the browser.

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { Attempt } from "@/lib/types";
import { newCard, schedule, type Grade, type SrsCard } from "@/lib/srs";
import type { MockSummary, ProgressSnapshot } from "@/lib/progress/server";
import { gradeTermCard, loadProgress, setBookmark, setShowRussian as saveShowRussian } from "@/app/(app)/progress-actions";

export type { MockSummary };

interface Progress extends ProgressSnapshot {
  ready: boolean;
  /** Set when progress couldn't be loaded or a change couldn't be saved. */
  error: string | null;
  /** Time the progress was loaded, used for "due today" calculations. */
  now: number;
  /** Adds an answer the server has graded and saved, with its new review card. */
  recordAttempt: (attempt: Omit<Attempt, "at">, card: SrsCard) => void;
  toggleBookmark: (questionId: string) => void;
  /** Grades a terminology flashcard ("t:<termId>"). */
  gradeCard: (cardId: string, grade: Grade) => void;
  /** Adds a graded mock exam and the review cards it updated. */
  addMock: (summary: MockSummary, cards: Record<string, SrsCard>) => void;
  setShowRussian: (v: boolean) => void;
  retry: () => void;
}

const EMPTY: ProgressSnapshot = { attempts: [], bookmarks: [], cards: {}, mocks: [], showRussian: true };
const SAVE_FAILED = "A change couldn't be saved. Check your connection — it will be lost if you reload.";

const Ctx = createContext<Progress | null>(null);

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<ProgressSnapshot | null>(null);
  const [now, setNow] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  // Latest data, for event handlers that need to read it.
  const dataRef = useRef(data);
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  useEffect(() => {
    let cancelled = false;
    loadProgress().then(
      (snapshot) => {
        if (cancelled) return;
        setNow(Date.now());
        setData(snapshot);
        setError(null);
      },
      () => !cancelled && setError("We couldn't load your progress. Check your connection and try again."),
    );
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const recordAttempt = useCallback<Progress["recordAttempt"]>((a, card) => {
    setData((d) => d && { ...d, attempts: [...d.attempts, { ...a, at: Date.now() }], cards: { ...d.cards, [`q:${a.questionId}`]: card } });
  }, []);

  const toggleBookmark = useCallback((questionId: string) => {
    if (!dataRef.current) return;
    const on = !dataRef.current.bookmarks.includes(questionId);
    const apply = (add: boolean) =>
      setData((d) => {
        if (!d) return d;
        const without = d.bookmarks.filter((b) => b !== questionId);
        return { ...d, bookmarks: add ? [...without, questionId] : without };
      });
    apply(on);
    // Save, and undo the change on screen if saving fails.
    setBookmark(questionId, on).catch(() => {
      apply(!on);
      setError(SAVE_FAILED);
    });
  }, []);

  const gradeCard = useCallback((cardId: string, grade: Grade) => {
    const at = Date.now();
    setData((d) => d && { ...d, cards: { ...d.cards, [cardId]: schedule(d.cards[cardId] ?? newCard(at), grade, at) } });
    if (!cardId.startsWith("t:")) return;
    gradeTermCard(cardId.slice(2), grade).then(
      (card) => setData((d) => d && { ...d, cards: { ...d.cards, [cardId]: card } }),
      () => setError(SAVE_FAILED),
    );
  }, []);

  const addMock = useCallback<Progress["addMock"]>((summary, cards) => {
    setData((d) => {
      if (!d) return d;
      const nextCards = { ...d.cards };
      for (const [slug, card] of Object.entries(cards)) nextCards[`q:${slug}`] = card;
      return { ...d, mocks: [summary, ...d.mocks], cards: nextCards };
    });
  }, []);

  const setShowRussian = useCallback((v: boolean) => {
    setData((d) => d && { ...d, showRussian: v });
    saveShowRussian(v).catch(() => setError(SAVE_FAILED));
  }, []);

  const retry = useCallback(() => {
    setError(null);
    setAttempt((n) => n + 1);
  }, []);

  const value = useMemo<Progress>(
    () => ({
      ...(data ?? EMPTY),
      ready: data !== null,
      error,
      now,
      recordAttempt,
      toggleBookmark,
      gradeCard,
      addMock,
      setShowRussian,
      retry,
    }),
    [data, error, now, recordAttempt, toggleBookmark, gradeCard, addMock, setShowRussian, retry],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useProgress(): Progress {
  const v = useContext(Ctx);
  if (!v) throw new Error("useProgress must be used inside ProgressProvider");
  return v;
}
