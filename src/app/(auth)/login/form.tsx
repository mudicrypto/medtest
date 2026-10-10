"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signIn, type FormState } from "../actions";
import { Alert, Field, SubmitButton } from "@/components/form";

const notices: Record<string, { tone: "info" | "error"; text: string }> = {
  "signed-out": { tone: "info", text: "You've been signed out." },
  "link-invalid": { tone: "error", text: "That link is invalid or has expired. Please request a new one." },
};

export function LoginForm() {
  const params = useSearchParams();
  const [state, action] = useActionState<FormState, FormData>(signIn, { status: "idle" });
  const notice = notices[params.get("notice") ?? ""];

  return (
    <form action={action} className="mt-6 space-y-4" noValidate>
      {state.message ? <Alert tone="error">{state.message}</Alert> : notice && <Alert tone={notice.tone}>{notice.text}</Alert>}
      <input type="hidden" name="next" value={params.get("next") ?? ""} />
      <Field
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        required
        defaultValue={state.values?.email}
        error={state.fields?.email}
      />
      <div>
        <Field
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          error={state.fields?.password}
        />
        <Link href="/forgot-password" className="mt-2 inline-block text-sm text-accent hover:underline">
          Forgot your password?
        </Link>
      </div>
      <SubmitButton pendingText="Signing in…">Sign in</SubmitButton>
      <p className="text-center text-sm text-ink-muted">
        New to MedPrep?{" "}
        <Link href="/signup" className="font-medium text-accent hover:underline">
          Create an account
        </Link>
      </p>
    </form>
  );
}
