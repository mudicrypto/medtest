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
  /** Public identifier (the database slug), e.g. "q-card-01". */
  id: string;
  topic: string; // Topic slug
  topicName: string;
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
 * Answer keys are a separate type on purpose: they live in a server-only table
 * (`question_keys`) and reach the browser only in the response to a submitted
 * answer.
 */
export interface QuestionKey {
  correct: QuestionOption["id"];
  explanationEn: string;
  explanationRu: string | null;
  /** Short reply used by the demo tutor. */
  tutorHint: string;
}

/** What the server returns after grading one answer. */
export interface GradeResult {
  correct: boolean;
  key: QuestionKey;
  topic: string;
}

export interface TopicWithCount extends Topic {
  questionCount: number;
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
  /** Topic slug, stored with the attempt so analytics needn't look questions up. */
  topic: string;
  selected: QuestionOption["id"];
  correct: boolean;
  at: number; // epoch ms
  mode: "practice" | "review" | "mock";
}
