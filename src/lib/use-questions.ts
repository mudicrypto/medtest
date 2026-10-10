"use client";

import { useEffect, useState } from "react";
import type { Question } from "@/lib/types";
import { fetchQuestions } from "@/app/(app)/question-actions";

type State = { status: "loading" } | { status: "ready"; questions: Question[] } | { status: "error"; message: string };

/**
 * Loads questions (without answer keys) from the server, in the given order.
 * Pass null to wait (e.g. until local progress has loaded). Questions that are
 * no longer published are simply left out.
 */
export function useQuestions(ids: string[] | null): State {
  const key = ids ? ids.join(",") : null;
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    if (key === null) return;
    let cancelled = false;
    const list = key ? key.split(",") : [];
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset while a new list loads
    setState({ status: "loading" });
    fetchQuestions(list).then(
      (questions) => !cancelled && setState({ status: "ready", questions }),
      () => !cancelled && setState({ status: "error", message: "We couldn't load the questions. Check your connection and try again." }),
    );
    return () => {
      cancelled = true;
    };
  }, [key]);

  return state;
}
