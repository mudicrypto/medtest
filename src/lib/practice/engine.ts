// Practice-session engine: pure state transitions, no UI and no network.
// The React hook (use-practice-session.ts) feeds it events and performs the
// server calls; everything here is deterministic and unit-tested.

import type { GradeResult, QuestionOption } from "@/lib/types";

export type OptionId = QuestionOption["id"];

export type QuestionState =
  | {
      status: "unanswered";
      selected: OptionId | null;
      /** Set after a failed submission, so a retry of the same answer reuses its ID. */
      retry?: { selected: OptionId; submissionId: string };
    }
  | { status: "submitting"; selected: OptionId; submissionId: string }
  | { status: "answered"; selected: OptionId; result: GradeResult };

export interface SessionState {
  ids: string[];
  index: number;
  finished: boolean;
  questions: Record<string, QuestionState>;
}

export type SessionAction =
  | { type: "select"; id: string; option: OptionId }
  | { type: "submit"; id: string; submissionId: string }
  | { type: "graded"; id: string; submissionId: string; result: GradeResult }
  | { type: "submitFailed"; id: string; submissionId: string }
  | { type: "next" }
  | { type: "previous" }
  | { type: "goTo"; index: number }
  | { type: "finish" }
  | { type: "restartQuestion"; id: string }
  | { type: "restartSession" };

const blank: QuestionState = { status: "unanswered", selected: null };

export function createSession(ids: string[]): SessionState {
  const unique = [...new Set(ids)];
  return { ids: unique, index: 0, finished: false, questions: Object.fromEntries(unique.map((id) => [id, blank])) };
}

export function questionState(state: SessionState, id: string): QuestionState {
  return state.questions[id] ?? blank;
}

/** True only when the question has a selected answer and isn't already submitted or being submitted. */
export function canSubmit(state: SessionState, id: string): boolean {
  const q = questionState(state, id);
  return q.status === "unanswered" && q.selected !== null;
}

/**
 * The ID to send with a submission. Retrying the same answer after a failure
 * reuses the earlier ID, so if the first request actually reached the server
 * it isn't recorded twice.
 */
export function submissionIdFor(state: SessionState, id: string, freshId: string): string {
  const q = questionState(state, id);
  if (q.status === "unanswered" && q.retry && q.retry.selected === q.selected) return q.retry.submissionId;
  return freshId;
}

function setQuestion(state: SessionState, id: string, q: QuestionState): SessionState {
  return { ...state, questions: { ...state.questions, [id]: q } };
}

export function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case "select": {
      const q = questionState(state, action.id);
      // Answers are locked once submitted.
      if (q.status !== "unanswered" || !state.ids.includes(action.id)) return state;
      return setQuestion(state, action.id, { ...q, selected: action.option });
    }
    case "submit": {
      // Ignore duplicates: only an unanswered question with a selection can be submitted.
      if (!canSubmit(state, action.id)) return state;
      const q = questionState(state, action.id) as Extract<QuestionState, { status: "unanswered" }>;
      return setQuestion(state, action.id, { status: "submitting", selected: q.selected!, submissionId: action.submissionId });
    }
    case "graded": {
      const q = questionState(state, action.id);
      // Ignore late or stale responses (e.g. the question was restarted meanwhile).
      if (q.status !== "submitting" || q.submissionId !== action.submissionId) return state;
      return setQuestion(state, action.id, { status: "answered", selected: q.selected, result: action.result });
    }
    case "submitFailed": {
      const q = questionState(state, action.id);
      if (q.status !== "submitting" || q.submissionId !== action.submissionId) return state;
      return setQuestion(state, action.id, {
        status: "unanswered",
        selected: q.selected,
        retry: { selected: q.selected, submissionId: q.submissionId },
      });
    }
    case "next":
      if (state.finished) return state;
      if (state.index >= state.ids.length - 1) return { ...state, finished: true };
      return { ...state, index: state.index + 1 };
    case "previous":
      if (state.finished) return { ...state, finished: false };
      return { ...state, index: Math.max(0, state.index - 1) };
    case "goTo":
      if (action.index < 0 || action.index >= state.ids.length) return state;
      return { ...state, index: action.index, finished: false };
    case "finish":
      return { ...state, finished: true };
    case "restartQuestion": {
      if (!state.ids.includes(action.id)) return state;
      // A request still in flight for the old attempt will be ignored when it returns.
      return setQuestion({ ...state, finished: false }, action.id, blank);
    }
    case "restartSession":
      return createSession(state.ids);
  }
}

export interface SessionScore {
  total: number;
  answered: number;
  correct: number;
  incorrect: number;
  /** Not answered (skipped, still open, or awaiting the server). Never counted as incorrect. */
  unanswered: number;
  /** Percentage of ANSWERED questions that were correct; null until something is answered. */
  accuracy: number | null;
}

export function sessionScore(state: SessionState): SessionScore {
  let correct = 0;
  let incorrect = 0;
  for (const id of state.ids) {
    const q = questionState(state, id);
    if (q.status !== "answered") continue;
    if (q.result.correct) correct++;
    else incorrect++;
  }
  const answered = correct + incorrect;
  return {
    total: state.ids.length,
    answered,
    correct,
    incorrect,
    unanswered: state.ids.length - answered,
    accuracy: answered ? Math.round((correct / answered) * 100) : null,
  };
}

/** IDs answered incorrectly in this session, in session order. */
export function sessionMistakes(state: SessionState): string[] {
  return state.ids.filter((id) => {
    const q = questionState(state, id);
    return q.status === "answered" && !q.result.correct;
  });
}

export function currentId(state: SessionState): string | undefined {
  return state.ids[state.index];
}
