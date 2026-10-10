// Shared domain types. These mirror the planned Supabase schema in
// docs/PROPOSAL.md §7 so the prototype screens map 1:1 onto real data later.

/** Where a question came from. Shown to students as a badge on every question. */
export type ContentOrigin =
  | "original_practice"
  | "official_verified"
  | "adapted"
  | "demo";

export type RightsStatus =
  | "owned"
  | "licensed"
  | "public_domain"
  | "permission_pending"
  | "not_cleared";

export type ReviewStatus = "draft" | "in_review" | "approved" | "retired";

export interface Topic {
  slug: string;
  nameEn: string;
  nameRu: string;
}

export interface TermRef {
  ru: string;
  en: string;
}

export interface QuestionOption {
  id: "A" | "B" | "C" | "D";
  textEn: string;
  textRu?: string;
}

export interface Question {
  id: string;
  topic: string; // Topic slug
  stemEn: string;
  /** Russian text is only shown when rights are cleared for it. */
  stemRu?: string;
  options: QuestionOption[];
  difficulty: 1 | 2 | 3;
  origin: ContentOrigin;
  rightsStatus: RightsStatus;
  reviewStatus: ReviewStatus;
  sourceRef?: string;
  keyTerms: TermRef[];
}

/**
 * Answer keys are a separate type on purpose: in the real app they live in a
 * server-only table (`question_keys`) and never reach the browser before the
 * student answers.
 */
export interface QuestionKey {
  questionId: string;
  correct: QuestionOption["id"];
  explanationEn: string;
  /** Short, scripted reply used by the demo tutor. */
  tutorHint: string;
}

export interface Term {
  id: string;
  ru: string;
  /** Latin-script pronunciation guide, stressed syllable in capitals. */
  translit: string;
  en: string;
  topic: string;
  exampleRu: string;
  exampleEn: string;
}

export interface ExamBlueprint {
  id: string;
  name: string;
  questionCount: number;
  timeLimitMinutes: number;
  passThresholdPct: number;
  isDemo: boolean;
  note: string;
}

export interface Attempt {
  questionId: string;
  selected: QuestionOption["id"];
  correct: boolean;
  at: number; // epoch ms
  mode: "practice" | "review" | "mock";
}
