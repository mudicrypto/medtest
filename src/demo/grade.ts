// Stand-in for the server-side grading function (`submit_attempt`).
// PROTOTYPE ONLY: here the key ships to the browser. In Milestone 3 this moves
// behind a server action and the browser never sees keys before answering.
import type { QuestionKey, QuestionOption } from "@/lib/types";
import { keyByQuestionId } from "./keys";

export interface GradeResult {
  correct: boolean;
  key: QuestionKey;
}

export function gradeDemoAnswer(questionId: string, selected: QuestionOption["id"]): GradeResult {
  const key = keyByQuestionId[questionId];
  if (!key) throw new Error(`No demo key for ${questionId}`);
  return { correct: key.correct === selected, key };
}
