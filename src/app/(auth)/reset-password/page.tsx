"use client";

import { useActionState } from "react";
import { updatePassword, type FormState } from "../actions";
import { Alert, Field, SubmitButton } from "@/components/form";
import { Card } from "@/components/ui";

// Reached from the password-reset email: /auth/callback signs the user in,
// then sends them here. The proxy requires a session for this page.
export default function ResetPasswordPage() {
  const [state, action] = useActionState<FormState, FormData>(updatePassword, { status: "idle" });

  return (
    <Card className="p-6 sm:p-8">
      <title>Choose a new password · MedPrep</title>
      <h1 className="text-xl font-semibold text-ink">Choose a new password</h1>
      <form action={action} className="mt-6 space-y-4" noValidate>
        {state.message && <Alert tone="error">{state.message}</Alert>}
        <Field
          label="New password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          hint="At least 8 characters, with letters and numbers."
          error={state.fields?.password}
        />
        <Field
          label="Repeat new password"
          name="confirm"
          type="password"
          autoComplete="new-password"
          required
          error={state.fields?.confirm}
        />
        <SubmitButton pendingText="Saving…">Save password</SubmitButton>
      </form>
    </Card>
  );
}
