"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/auth";
import {
  fieldErrors,
  newPasswordSchema,
  resetRequestSchema,
  signInSchema,
  signUpSchema,
} from "@/lib/validation/auth";

export type FormState = {
  status: "idle" | "error" | "success";
  message?: string;
  fields?: Record<string, string>;
  /** Values to keep in the form after an error (never passwords). */
  values?: Record<string, string>;
};

/** The site's own origin, used to build links in emails. */
async function siteOrigin() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  const h = await headers();
  const origin = h.get("origin");
  if (origin) return origin;
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

// Supabase error codes → plain-English messages.
function friendly(code: string | undefined, fallback: string) {
  switch (code) {
    case "invalid_credentials":
      return "That email and password don't match. Check them and try again.";
    case "email_not_confirmed":
      return "Please confirm your email first — check your inbox for the link we sent.";
    case "over_request_rate_limit":
    case "over_email_send_rate_limit":
      return "Too many attempts. Please wait a few minutes and try again.";
    case "weak_password":
      return "That password is too weak. Use at least 8 characters with letters and numbers.";
    case "same_password":
      return "Your new password must be different from the old one.";
    default:
      return fallback;
  }
}

export async function signUp(_prev: FormState, formData: FormData): Promise<FormState> {
  const raw = {
    displayName: String(formData.get("displayName") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  };
  const values = { displayName: raw.displayName, email: raw.email };
  const parsed = signUpSchema.safeParse(raw);
  if (!parsed.success) return { status: "error", fields: fieldErrors(parsed.error), values };

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { display_name: parsed.data.displayName },
      emailRedirectTo: `${await siteOrigin()}/auth/callback?next=/dashboard`,
    },
  });
  if (error) {
    return { status: "error", message: friendly(error.code, "We couldn't create your account. Please try again."), values };
  }
  // Supabase deliberately answers the same way for new and existing emails,
  // so nobody can use this form to find out who has an account.
  return {
    status: "success",
    message: parsed.data.email,
  };
}

export async function signIn(_prev: FormState, formData: FormData): Promise<FormState> {
  const raw = { email: String(formData.get("email") ?? ""), password: String(formData.get("password") ?? "") };
  const values = { email: raw.email };
  const parsed = signInSchema.safeParse(raw);
  if (!parsed.success) return { status: "error", fields: fieldErrors(parsed.error), values };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    return { status: "error", message: friendly(error.code, "We couldn't sign you in. Please try again."), values };
  }
  redirect(safeNext(formData.get("next")));
}

export async function resendConfirmation(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = resetRequestSchema.safeParse({ email: String(formData.get("email") ?? "") });
  if (!parsed.success) return { status: "error", message: "Missing email address." };
  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email: parsed.data.email,
    options: { emailRedirectTo: `${await siteOrigin()}/auth/callback?next=/dashboard` },
  });
  if (error) return { status: "error", message: friendly(error.code, "We couldn't resend the email. Please try again later.") };
  return { status: "success", message: "Sent — check your inbox (and spam folder)." };
}

export async function requestPasswordReset(_prev: FormState, formData: FormData): Promise<FormState> {
  const raw = { email: String(formData.get("email") ?? "") };
  const parsed = resetRequestSchema.safeParse(raw);
  if (!parsed.success) return { status: "error", fields: fieldErrors(parsed.error), values: raw };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${await siteOrigin()}/auth/callback?next=/reset-password`,
  });
  if (error && error.code?.startsWith("over_")) {
    return { status: "error", message: friendly(error.code, ""), values: raw };
  }
  // Same answer whether or not the account exists.
  return { status: "success", message: parsed.data.email };
}

export async function updatePassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = newPasswordSchema.safeParse({
    password: String(formData.get("password") ?? ""),
    confirm: String(formData.get("confirm") ?? ""),
  });
  if (!parsed.success) return { status: "error", fields: fieldErrors(parsed.error) };

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/login");

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { status: "error", message: friendly(error.code, "We couldn't update your password. Please try again.") };
  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login?notice=signed-out");
}
