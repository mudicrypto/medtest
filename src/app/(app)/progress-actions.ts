"use server";

// Server functions for the student's own progress. Each re-checks the
// signed-in user; row level security restricts every query to their rows.

import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { gradeCardFor, loadSnapshot, type ProgressSnapshot } from "@/lib/progress/server";
import type { SrsCard } from "@/lib/srs";

const slug = z.string().regex(/^[a-z0-9][a-z0-9-]{1,79}$/);

export async function loadProgress(): Promise<ProgressSnapshot> {
  const user = await getCurrentUser();
  return loadSnapshot(await createClient(), user.id);
}

export async function setBookmark(questionId: string, on: boolean): Promise<void> {
  const user = await getCurrentUser();
  const supabase = await createClient();
  // Look the question up through RLS, so only questions the student can see can be bookmarked.
  const { data: q } = await supabase.from("questions").select("id").eq("slug", slug.parse(questionId)).maybeSingle();
  if (!q) throw new Error("Question not available");
  const { error } = on
    ? await supabase.from("bookmarks").upsert({ user_id: user.id, question_id: q.id }, { ignoreDuplicates: true })
    : await supabase.from("bookmarks").delete().eq("user_id", user.id).eq("question_id", q.id);
  if (error) throw new Error("Couldn't save the bookmark");
}

export async function gradeTermCard(termId: string, grade: "again" | "hard" | "good" | "easy"): Promise<SrsCard> {
  const user = await getCurrentUser();
  const id = z.string().regex(/^[a-z0-9][a-z0-9-]{0,79}$/).parse(termId);
  const g = z.enum(["again", "hard", "good", "easy"]).parse(grade);
  return gradeCardFor(await createClient(), user.id, "term", id, g);
}

export async function setShowRussian(on: boolean): Promise<void> {
  const user = await getCurrentUser();
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ show_russian: z.boolean().parse(on) }).eq("id", user.id);
  if (error) throw new Error("Couldn't save the setting");
}
