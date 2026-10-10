"use client";

import { useActionState } from "react";
import Link from "next/link";
import { requestPasswordReset, type FormState } from "../actions";
import { Alert, Field, SubmitButton } from "@/components/form";
import { Card } from "@/components/ui";

export default function ForgotPasswordPage() {
  const [state, action] = useActionState<FormState, FormData>(requestPasswordReset, { status: "idle" });

  return (
    <Card className="p-6 sm:p-8">
      <title>Reset password · MedPrep</title>
      <h1 className="text-xl font-semibold text-ink">Reset your password</h1>
      {state.status === "success" ? (
        <div className="mt-4 space-y-4">
          <Alert tone="success">
            If an account exists for <strong>{state.message}</strong>, we&apos;ve emailed a link to choose a new
            password. Open it on this device.
          </Alert>
          <Link href="/login" className="inline-block text-sm text-accent hover:underline">
            Back to sign in
          </Link>
        </div>
      ) : (
        <form action={action} className="mt-6 space-y-4" noValidate>
          <p className="text-sm text-ink-muted">Enter your email and we&apos;ll send you a link to choose a new password.</p>
          {state.message && <Alert tone="error">{state.message}</Alert>}
          <Field
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            required
            defaultValue={state.values?.email}
            error={state.fields?.email}
          />
          <SubmitButton pendingText="Sending…">Send reset link</SubmitButton>
          <p className="text-center text-sm">
            <Link href="/login" className="text-accent hover:underline">
              Back to sign in
            </Link>
          </p>
        </form>
      )}
    </Card>
  );
}
