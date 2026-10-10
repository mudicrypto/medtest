"use client";

import { useActionState, useEffect } from "react";
import { useProgress } from "@/lib/progress-store";
import type { CurrentUser } from "@/lib/auth";
import type { FormState } from "@/app/(auth)/actions";
import { Alert, Field, SubmitButton } from "@/components/form";
import { updateProfile } from "./actions";

export function ProfileForm({ user }: { user: Omit<CurrentUser, "id" | "role"> }) {
  const [state, action] = useActionState<FormState, FormData>(updateProfile, { status: "idle" });
  // Reload progress after saving so the Russian-text preference applies everywhere.
  const { retry } = useProgress();
  useEffect(() => {
    if (state.status === "success") retry();
  }, [state, retry]);

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
          <span className="block text-xs text-ink-muted">You can also switch it on any question with the RU button.</span>
        </span>
      </label>
      <div className="sm:w-48">
        <SubmitButton pendingText="Saving…">Save changes</SubmitButton>
      </div>
    </form>
  );
}
