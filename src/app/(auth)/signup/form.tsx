"use client";

import { useActionState } from "react";
import Link from "next/link";
import { MailCheck } from "lucide-react";
import { resendConfirmation, signUp, type FormState } from "../actions";
import { Alert, Field, SubmitButton } from "@/components/form";

export function SignUpForm() {
  const [state, action] = useActionState<FormState, FormData>(signUp, { status: "idle" });

  if (state.status === "success") return <CheckEmail email={state.message ?? ""} />;

  return (
    <>
      <h1 className="text-xl font-semibold text-ink">Create your account</h1>
      <p className="mt-1 text-sm text-ink-muted">Free while MedPrep is in development.</p>
      <form action={action} className="mt-6 space-y-4" noValidate>
        {state.message && <Alert tone="error">{state.message}</Alert>}
        <Field
          label="Your name"
          name="displayName"
          autoComplete="name"
          required
          maxLength={80}
          defaultValue={state.values?.displayName}
          error={state.fields?.displayName}
        />
        <Field
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={state.values?.email}
          error={state.fields?.email}
        />
        <Field
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          hint="At least 8 characters, with letters and numbers."
          error={state.fields?.password}
        />
        <SubmitButton pendingText="Creating account…">Create account</SubmitButton>
        <p className="text-center text-sm text-ink-muted">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-accent hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </>
  );
}

function CheckEmail({ email }: { email: string }) {
  const [resent, resend] = useActionState<FormState, FormData>(resendConfirmation, { status: "idle" });
  return (
    <div className="text-center">
      <span className="mx-auto grid size-12 place-items-center rounded-full bg-accent-soft text-accent">
        <MailCheck className="size-6" aria-hidden />
      </span>
      <h1 className="mt-4 text-xl font-semibold text-ink">Check your email</h1>
      <p className="mt-2 text-sm leading-relaxed text-ink-muted">
        We sent a confirmation link to <strong className="text-ink">{email}</strong>. Open it on this device to
        activate your account.
      </p>
      <form action={resend} className="mt-6 space-y-3">
        <input type="hidden" name="email" value={email} />
        {resent.message && <Alert tone={resent.status === "error" ? "error" : "success"}>{resent.message}</Alert>}
        <SubmitButton pendingText="Sending…" variant="secondary">
          Resend email
        </SubmitButton>
      </form>
      <Link href="/login" className="mt-4 inline-block text-sm text-accent hover:underline">
        Back to sign in
      </Link>
    </div>
  );
}
