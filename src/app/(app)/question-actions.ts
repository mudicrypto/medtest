"use server";

// Server functions the student screens call. Each one re-checks the signed-in
// user; row level security and the database grading functions enforce the
// rest. Answer keys only ever come back from grading calls.

import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getQuestions, listQuestionRefs, type QuestionRef } from "@/lib/content/queries";
import { gradeCardFor, type MockSummary } from "@/lib/progress/server";
import { gradeFromAnswer, type SrsCard } from "@/lib/srs";
import { blueprints } from "@/demo/blueprints";
import type { GradeResult, Question, QuestionOption } from "@/lib/types";

const slug = z.string().regex(/^[a-z0-9][a-z0-9-]{1,79}$/);
const slugList = z.array(slug).max(300);
const position = z.enum(["A", "B", "C", "D"]);
const mode = z.enum(["practice", "review", "mock"]);

export async function fetchQuestions(slugs: string[]): Promise<Question[]> {
  await getCurrentUser();
  return getQuestions(slugList.parse(slugs));
}

export async function fetchQuestionRefs(filter: { specialties?: string[]; topics?: string[] } = {}): Promise<QuestionRef[]> {
  await getCurrentUser();
  const list = z.array(z.string().max(120)).max(50);
  return listQuestionRefs({ specialties: list.parse(filter.specialties ?? []), topics: list.parse(filter.topics ?? []) });
}

/**
 * Grades one answer on the server. `submissionId` is a random ID chosen once
 * per submission: sending the same one again (double click, network retry)
 * returns the original result without recording a second attempt.
 */
export async function submitAnswer(
  questionId: string,
  selected: QuestionOption["id"],
  attemptMode: "practice" | "review" = "practice",
  submissionId?: string,
): Promise<GradeResult & { card: SrsCard; duplicate: boolean }> {
  const user = await getCurrentUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .rpc("submit_answer", {
      p_slug: slug.parse(questionId),
      p_selected: position.parse(selected),
      p_mode: mode.parse(attemptMode),
      p_client_id: submissionId ? z.uuid().parse(submissionId) : undefined,
    })
    .single();
  if (error || !data) throw new Error("We couldn't check that answer. Please try again.");
  // Reschedule this question in the student's review queue (once per submission).
  const card = data.duplicate
    ? await gradeCardFor(supabase, user.id, "question", questionId, null)
    : await gradeCardFor(supabase, user.id, "question", questionId, gradeFromAnswer(data.is_correct));
  return {
    card,
    duplicate: data.duplicate,
    correct: data.is_correct,
    specialty: data.topic,
    key: {
      correct: data.correct as QuestionOption["id"],
      explanationEn: data.explanation_en,
      explanationRu: data.explanation_ru,
      optionExplanations: (data.option_explanations ?? {}) as Partial<Record<QuestionOption["id"], string>>,
      examPearl: data.exam_pearl,
      tutorHint: data.tutor_hint ?? "",
    },
  };
}

/** Picks `count` random available questions for a mock exam. */
export async function startMock(count: number): Promise<Question[]> {
  await getCurrentUser();
  const n = z.number().int().min(1).max(300).parse(count);
  const refs = await listQuestionRefs();
  const ids = refs.map((r) => r.id);
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  return getQuestions(ids.slice(0, n));
}

export interface MockGrade {
  questionId: string;
  specialty: string;
  selected: QuestionOption["id"] | null;
  correct: QuestionOption["id"];
  isCorrect: boolean;
  explanationEn: string;
}

export interface MockSubmission {
  grades: MockGrade[];
  summary: MockSummary;
  /** Updated review cards for answered questions, keyed by slug. */
  cards: Record<string, SrsCard>;
}

export async function submitMock(
  blueprintId: string,
  questionIds: string[],
  answers: Record<string, string>,
  durationSec: number,
): Promise<MockSubmission> {
  const user = await getCurrentUser();
  const blueprint = blueprints.find((b) => b.id === blueprintId);
  if (!blueprint) throw new Error("Unknown exam format");
  const ids = slugList.min(1).parse(questionIds);
  const clean = Object.fromEntries(
    Object.entries(z.record(slug, position).parse(answers)).filter(([k]) => ids.includes(k)),
  );
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("grade_mock", { p_slugs: ids, p_answers: clean });
  if (error || !data) throw new Error("We couldn't submit your exam. Please try again.");
  const bySlug = new Map(data.map((r) => [r.slug, r]));
  const grades: MockGrade[] = ids
    .map((id) => bySlug.get(id))
    .filter((r) => !!r)
    .map((r) => ({
      questionId: r.slug,
      specialty: r.topic,
      selected: (r.selected as QuestionOption["id"] | null) ?? null,
      correct: r.correct as QuestionOption["id"],
      isCorrect: r.is_correct,
      explanationEn: r.explanation_en,
    }));

  // The score comes from the server's grading, never from the browser.
  const score = grades.filter((g) => g.isCorrect).length;
  const total = grades.length;
  const summary: MockSummary = {
    blueprintId: blueprint.id,
    questionIds: grades.map((g) => g.questionId),
    answers: clean,
    score,
    total,
    passed: total > 0 && (score / total) * 100 >= blueprint.passThresholdPct,
    submittedAt: Date.now(),
    durationSec: Math.max(0, Math.min(24 * 3600, Math.round(z.number().parse(durationSec)))),
  };
  if (total > 0) {
    const { error: saveError } = await supabase.from("mock_attempts").insert({
      user_id: user.id,
      blueprint_id: summary.blueprintId,
      question_slugs: summary.questionIds,
      answers: summary.answers,
      score,
      total,
      passed: summary.passed,
      duration_sec: summary.durationSec,
    });
    if (saveError) throw new Error("Your exam was graded but the result couldn't be saved. Please try again.");
  }

  const cards: Record<string, SrsCard> = {};
  for (const g of grades.filter((g) => g.selected)) {
    cards[g.questionId] = await gradeCardFor(supabase, user.id, "question", g.questionId, gradeFromAnswer(g.isCorrect));
  }
  return { grades, summary, cards };
}
