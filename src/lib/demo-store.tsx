"use client";

// Prototype state, kept in this browser's localStorage. Milestone 2+ replaces
// this with Supabase tables (attempts, bookmarks, srs_cards, mock_attempts).

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Attempt, QuestionOption } from "@/lib/types";
import { gradeFromAnswer, newCard, schedule, type Grade, type SrsCard } from "@/lib/srs";
import { seedHistory } from "@/demo/history";
import { terms } from "@/demo/terms";
import { gradeDemoAnswer, type GradeResult } from "@/demo/grade";

export interface MockResult {
  blueprintId: string;
  questionIds: string[];
  answers: Record<string, QuestionOption["id"] | undefined>;
  score: number;
  total: number;
  passed: boolean;
  submittedAt: number;
  durationSec: number;
}

interface DemoState {
  attempts: Attempt[];
  bookmarks: string[];
  /** Keyed "q:<questionId>" or "t:<termId>". */
  cards: Record<string, SrsCard>;
  mocks: MockResult[];
  showRussian: boolean;
}

interface DemoStore extends DemoState {
  ready: boolean;
  now: number;
  answer: (questionId: string, selected: QuestionOption["id"], mode: Attempt["mode"]) => GradeResult;
  toggleBookmark: (questionId: string) => void;
  gradeCard: (cardId: string, grade: Grade) => void;
  saveMock: (result: MockResult) => void;
  setShowRussian: (v: boolean) => void;
  reset: () => void;
}

const STORAGE_KEY = "medprep-demo-v1";

function buildInitial(now: number): DemoState {
  const attempts = seedHistory(now);
  const cards: Record<string, SrsCard> = {};
  for (const a of attempts) {
    const id = `q:${a.questionId}`;
    cards[id] = schedule(cards[id] ?? newCard(a.at), gradeFromAnswer(a.correct), a.at);
  }
  // The first few terms start as new cards, due today.
  for (const t of terms.slice(0, 6)) cards[`t:${t.id}`] = newCard(now);
  return {
    attempts,
    bookmarks: ["q-gi-01", "q-neuro-02", "q-surg-01"],
    cards,
    mocks: [],
    showRussian: true,
  };
}

function load(now: number): DemoState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as DemoState;
  } catch {
    // Storage blocked or corrupt — fall back to fresh demo data.
  }
  return buildInitial(now);
}

function save(state: DemoState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Private mode etc. — the demo still works for this visit.
  }
}

const Ctx = createContext<DemoStore | null>(null);

export function DemoStoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<DemoState | null>(null);
  const [now, setNow] = useState(0);

  // Load after mount so server and browser render the same first frame.
  useEffect(() => {
    const t = Date.now();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration from localStorage
    setNow(t);
    setState(load(t));
  }, []);

  useEffect(() => {
    if (state) save(state);
  }, [state]);

  const answer = useCallback<DemoStore["answer"]>((questionId, selected, mode) => {
    const result = gradeDemoAnswer(questionId, selected);
    const at = Date.now();
    setState((s) => {
      if (!s) return s;
      const id = `q:${questionId}`;
      return {
        ...s,
        attempts: [...s.attempts, { questionId, selected, correct: result.correct, at, mode }],
        cards: {
          ...s.cards,
          [id]: schedule(s.cards[id] ?? newCard(at), gradeFromAnswer(result.correct), at),
        },
      };
    });
    return result;
  }, []);

  const toggleBookmark = useCallback((questionId: string) => {
    setState((s) =>
      s && {
        ...s,
        bookmarks: s.bookmarks.includes(questionId)
          ? s.bookmarks.filter((b) => b !== questionId)
          : [...s.bookmarks, questionId],
      },
    );
  }, []);

  const gradeCard = useCallback((cardId: string, grade: Grade) => {
    const at = Date.now();
    setState((s) =>
      s && { ...s, cards: { ...s.cards, [cardId]: schedule(s.cards[cardId] ?? newCard(at), grade, at) } },
    );
  }, []);

  const saveMock = useCallback((result: MockResult) => {
    setState((s) => s && { ...s, mocks: [result, ...s.mocks] });
  }, []);

  const setShowRussian = useCallback((v: boolean) => {
    setState((s) => s && { ...s, showRussian: v });
  }, []);

  const reset = useCallback(() => {
    const t = Date.now();
    setNow(t);
    setState(buildInitial(t));
  }, []);

  const value = useMemo<DemoStore>(
    () => ({
      ...(state ?? { attempts: [], bookmarks: [], cards: {}, mocks: [], showRussian: true }),
      ready: state !== null,
      now,
      answer,
      toggleBookmark,
      gradeCard,
      saveMock,
      setShowRussian,
      reset,
    }),
    [state, now, answer, toggleBookmark, gradeCard, saveMock, setShowRussian, reset],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useDemoStore(): DemoStore {
  const v = useContext(Ctx);
  if (!v) throw new Error("useDemoStore must be used inside DemoStoreProvider");
  return v;
}
