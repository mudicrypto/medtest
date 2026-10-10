"use client";

import { useActionState } from "react";
import type { CurrentUser } from "@/lib/auth";
import type { FormState } from "@/app/(auth)/actions";
import { Alert, Field, SubmitButton } from "@/components/form";
import { updateProfile } from "./actions";

export function ProfileForm({ user }: { user: Omit<CurrentUser, "id" | "role"> }) {
  const [state, action] = useActionState<FormState, FormData>(updateProfile, { status: "idle" });

  return (
    <form action={action} className="space-y-5" noValidate>
      {state.message && <Alert tone={state.status === "error" ? "error" : "success"}>{state.message}</Alert>}
      <Field
        label="Name"
        name="displayName"
        autoComplete="name"
        maxLength={80}
        defaultValue={state.values?.displayName ?? user.displayName}
        error={state.fields?.displayName}
      />
      <Field label="Email" name="email" type="email" value={user.email} disabled readOnly hint="Email changes come in a later milestone." />
      <Field
        label="Target exam date"
        name="targetExamDate"
        type="date"
        defaultValue={state.values?.targetExamDate ?? user.targetExamDate ?? ""}
        hint="Optional. Your dashboard shows a countdown."
        error={state.fields?.targetExamDate}
      />
      <label className="flex items-start gap-3 rounded-xl border border-line p-3.5">
        <input
          type="checkbox"
          name="showRussian"
          defaultChecked={user.showRussian}
          className="mt-0.5 size-4 accent-[var(--color-accent)]"
        />
        <span>
          <span className="block text-sm font-medium text-ink">Show Russian text by default</span>
          <span className="block text-xs text-ink-muted">Saved to your account. Practice screens start using it in the next milestone.</span>
        </span>
      </label>
      <div className="sm:w-48">
        <SubmitButton pendingText="Saving…">Save changes</SubmitButton>
      </div>
    </form>
  );
}
