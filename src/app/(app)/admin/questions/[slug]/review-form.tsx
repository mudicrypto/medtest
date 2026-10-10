"use client";

import { useActionState } from "react";
import type { ReviewStatus } from "@/lib/content/admin";
import { Alert, SubmitButton } from "@/components/form";
import { setReviewStatus, type ActionState } from "../../actions";

const choices: { value: ReviewStatus; label: string; hint: string }[] = [
  { value: "approved", label: "Approve", hint: "Medically reviewed; students can see it (if rights are cleared)." },
  { value: "in_review", label: "In review", hint: "Waiting for a reviewer." },
  { value: "draft", label: "Draft", hint: "Needs more work." },
  { value: "retired", label: "Retire", hint: "Withdraw from students permanently." },
];

export function ReviewForm({ slug, current }: { slug: string; current: ReviewStatus }) {
  const [state, action] = useActionState<ActionState, FormData>(setReviewStatus, { status: "idle" });
  return (
    <form action={action} className="mt-3 space-y-3">
      <input type="hidden" name="slug" value={slug} />
      {state.message && <Alert tone={state.status === "error" ? "error" : "success"}>{state.message}</Alert>}
      <fieldset className="space-y-1.5">
        <legend className="sr-only">New status</legend>
        {choices.map((c) => (
          <label key={c.value} className="flex cursor-pointer gap-2.5 rounded-lg p-2 hover:bg-sunken">
            <input type="radio" name="status" value={c.value} defaultChecked={c.value === current} className="mt-1 accent-[var(--color-accent)]" />
            <span>
              <span className="block text-sm font-medium text-ink">{c.label}</span>
              <span className="block text-xs text-ink-muted">{c.hint}</span>
            </span>
          </label>
        ))}
      </fieldset>
      <label className="block">
        <span className="text-xs font-medium text-ink-soft">Note (optional)</span>
        <textarea
          name="note"
          rows={2}
          maxLength={1000}
          placeholder="e.g. Checked against 2026 clinical guidelines"
          className="mt-1 w-full rounded-lg border border-line bg-surface p-2.5 text-sm outline-none focus:border-accent"
        />
      </label>
      <SubmitButton pendingText="Saving…" className="h-10">
        Save status
      </SubmitButton>
    </form>
  );
}
