"use server";

// Server functions the student screens call. Each one re-checks the signed-in
// user; row level security and the database grading functions enforce the
// rest. Answer keys only ever come back from grading calls.

import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getQuestions, listQuestionRefs } from "@/lib/content/queries";
import type { GradeResult, Question, QuestionOption } from "@/lib/types";

const slug = z.string().regex(/^[a-z0-9][a-z0-9-]{1,79}$/);
const slugList = z.array(slug).max(300);
const position = z.enum(["A", "B", "C", "D"]);
const mode = z.enum(["practice", "review", "mock"]);

export async function fetchQuestions(slugs: string[]): Promise<Question[]> {
  await getCurrentUser();
  return getQuestions(slugList.parse(slugs));
}

export async function fetchQuestionRefs(topics: string[] = []): Promise<{ id: string; topic: string }[]> {
  await getCurrentUser();
  return listQuestionRefs(z.array(z.string().max(60)).max(50).parse(topics));
}

export async function submitAnswer(
  questionId: string,
  selected: QuestionOption["id"],
  attemptMode: "practice" | "review" = "practice",
): Promise<GradeResult> {
  await getCurrentUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .rpc("submit_answer", {
      p_slug: slug.parse(questionId),
      p_selected: position.parse(selected),
      p_mode: mode.parse(attemptMode),
    })
    .single();
  if (error || !data) throw new Error("We couldn't check that answer. Please try again.");
  return {
    correct: data.is_correct,
    topic: data.topic,
    key: {
      correct: data.correct as QuestionOption["id"],
      explanationEn: data.explanation_en,
      explanationRu: data.explanation_ru,
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
  topic: string;
  selected: QuestionOption["id"] | null;
  correct: QuestionOption["id"];
  isCorrect: boolean;
  explanationEn: string;
}

export async function submitMock(questionIds: string[], answers: Record<string, string>): Promise<MockGrade[]> {
  await getCurrentUser();
  const ids = slugList.min(1).parse(questionIds);
  const clean = Object.fromEntries(
    Object.entries(z.record(slug, position).parse(answers)).filter(([k]) => ids.includes(k)),
  );
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("grade_mock", { p_slugs: ids, p_answers: clean });
  if (error || !data) throw new Error("We couldn't submit your exam. Please try again.");
  const bySlug = new Map(data.map((r) => [r.slug, r]));
  return ids
    .map((id) => bySlug.get(id))
    .filter((r) => !!r)
    .map((r) => ({
      questionId: r.slug,
      topic: r.topic,
      selected: (r.selected as QuestionOption["id"] | null) ?? null,
      correct: r.correct as QuestionOption["id"],
      isCorrect: r.is_correct,
      explanationEn: r.explanation_en,
    }));
}
