import "server-only";

import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

export type UserRole = Database["public"]["Enums"]["user_role"];

export interface CurrentUser {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  showRussian: boolean;
  /** YYYY-MM-DD or null. */
  targetExamDate: string | null;
}

/**
 * The data access layer's single entry point for "who is signed in?".
 * Verifies the session on the server (getClaims checks the token signature),
 * then loads the profile through row level security. Redirects to /login when
 * signed out. Cached per request, so calling it from several components costs
 * one lookup.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) redirect("/login");

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("display_name, role, show_russian, target_exam_date")
    .eq("id", claims.sub)
    .maybeSingle();
  // A missing profile falls back to defaults below; a failed request is an
  // error (otherwise an admin would briefly look like a student, for example).
  if (error) throw new Error(`Could not load profile: ${error.message}`);

  return {
    id: claims.sub,
    email: typeof claims.email === "string" ? claims.email : "",
    displayName: profile?.display_name || "Student",
    role: profile?.role ?? "student",
    showRussian: profile?.show_russian ?? true,
    targetExamDate: profile?.target_exam_date ?? null,
  };
});

/** Allow only same-site relative paths as post-login destinations. */
export function safeNext(next: unknown, fallback = "/dashboard"): string {
  if (typeof next !== "string" || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) {
    return fallback;
  }
  return next;
}

/** For reviewer/admin pages: anyone else gets a plain "not found". */
export async function requireStaff(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (user.role !== "admin" && user.role !== "reviewer") notFound();
  return user;
}

/** For actions that change content. */
export async function requireAdmin(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (user.role !== "admin") notFound();
  return user;
}
