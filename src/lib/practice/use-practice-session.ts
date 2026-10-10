"use client";

import { useCallback, useEffect, useReducer, useRef } from "react";
import { useProgress } from "@/lib/progress-store";
import { submitAnswer } from "@/app/(app)/question-actions";
import { canSubmit, createSession, questionState, sessionReducer, submissionIdFor, type SessionState } from "./engine";

/**
 * Connects the pure session engine to the server. Answers are graded on the
 * server; the engine plus an in-flight guard make sure each answer is
 * submitted once, even if the button is pressed twice.
 */
export function usePracticeSession(ids: string[], mode: "practice" | "review") {
  const [state, dispatch] = useReducer(sessionReducer, ids, createSession);
  const { recordAttempt } = useProgress();
  const stateRef = useRef<SessionState>(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);
  // Two clicks in the same instant both see the old state; this set catches that.
  const inFlight = useRef(new Set<string>());

  const submit = useCallback(
    async (id: string): Promise<boolean> => {
      const current = stateRef.current;
      if (!canSubmit(current, id) || inFlight.current.has(id)) return false;
      const q = questionState(current, id);
      if (q.status !== "unanswered" || !q.selected) return false;
      const selected = q.selected;
      const submissionId = submissionIdFor(current, id, crypto.randomUUID());

      inFlight.current.add(id);
      dispatch({ type: "submit", id, submissionId });
      try {
        const result = await submitAnswer(id, selected, mode, submissionId);
        if (!result.duplicate) {
          recordAttempt({ questionId: id, specialty: result.specialty, selected, correct: result.correct, mode }, result.card);
        }
        dispatch({ type: "graded", id, submissionId, result });
        return true;
      } catch {
        dispatch({ type: "submitFailed", id, submissionId });
        return false;
      } finally {
        inFlight.current.delete(id);
      }
    },
    [mode, recordAttempt],
  );

  return { state, dispatch, submit };
}
