import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
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

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, role, show_russian, target_exam_date")
    .eq("id", claims.sub)
    .single();

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
