// The complete question model, as authored and stored.
//
// Students never receive a QuestionRecord. Before answering they get the
// `Question` view (src/lib/types.ts, no answer or explanations); after
// submitting, the server returns the `QuestionKey` part.

import type { ContentOrigin, ReviewStatus, RightsStatus, TermRef } from "@/lib/types";

export type OptionId = "A" | "B" | "C" | "D";
export const OPTION_IDS: readonly OptionId[] = ["A", "B", "C", "D"];

export interface QuestionRecord {
  /** Unique, permanent ID, e.g. "q-card-01". */
  id: string;

  // Classification, broad → narrow.
  /** Specialty slug, e.g. "cardiology". */
  specialty: string;
  /** e.g. "Ischaemic heart disease" */
  subject: string;
  /** e.g. "Acute coronary syndrome" */
  topic: string;
  /** e.g. "ECG localisation" */
  subtopic: string | null;
  difficulty: 1 | 2 | 3;

  stemEn: string;
  /** Russian source text, when available. */
  stemRu: string | null;
  /** Exactly four options, A–D. */
  options: { id: OptionId; textEn: string; textRu: string | null }[];

  correct: OptionId;
  explanationEn: string;
  /** Russian explanation, when available. */
  explanationRu: string | null;
  /** Why each incorrect option is wrong (and optionally why the correct one is right). */
  optionExplanations: Partial<Record<OptionId, string>>;
  /** One memorable, high-yield takeaway. */
  examPearl: string | null;
  tutorHint: string | null;
  /** Russian terminology used in the question. */
  keyTerms: TermRef[];

  origin: ContentOrigin;
  sourceRef: string | null;
  rightsStatus: RightsStatus;
  reviewStatus: ReviewStatus;
  reviewNote: string | null;
}

/** Problems that make a record unusable; empty when valid. */
export function validateRecord(q: QuestionRecord): string[] {
  const problems: string[] = [];
  const ids = q.options.map((o) => o.id).join("");
  if (ids !== "ABCD") problems.push(`options must be A, B, C, D in order (got ${ids})`);
  if (!OPTION_IDS.includes(q.correct)) problems.push("correct must be A–D");
  for (const o of q.options) if (!o.textEn.trim()) problems.push(`option ${o.id} has no text`);
  if (new Set(q.options.map((o) => o.textEn.trim().toLowerCase())).size !== 4) problems.push("options must be different");
  for (const id of OPTION_IDS) {
    if (id !== q.correct && !q.optionExplanations[id]?.trim()) problems.push(`missing explanation for incorrect option ${id}`);
  }
  return problems;
}
