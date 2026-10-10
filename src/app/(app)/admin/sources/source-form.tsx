"use client";

import { useActionState, useEffect, useRef } from "react";
import { Alert, Field, SubmitButton } from "@/components/form";
import { createSource, type SourceFormState } from "../actions";

const rights = [
  ["licensed", "Licensed / permission granted"],
  ["owned", "Owned by MedPrep"],
  ["public_domain", "Public domain"],
  ["permission_pending", "Permission pending"],
  ["not_cleared", "Not cleared"],
] as const;

export function SourceForm() {
  const [state, action] = useActionState<SourceFormState, FormData>(createSource, { status: "idle" });
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.status === "success") form.current?.reset();
  }, [state]);

  return (
    <form ref={form} action={action} className="mt-4 space-y-4" noValidate>
      {state.message && <Alert tone={state.status === "error" ? "error" : "success"}>{state.message}</Alert>}
      <Field label="Title" name="title" placeholder="e.g. Sechenov University question bank" error={state.fields?.title} />
      <Field label="Publisher / owner" name="publisher" error={state.fields?.publisher} />
      <div>
        <label htmlFor="f-rights" className="text-sm font-medium text-ink">
          Rights status
        </label>
        <select id="f-rights" name="rights_status" defaultValue="licensed" className="mt-1.5 h-11 w-full rounded-xl border border-line bg-surface px-3 text-sm">
          {rights.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </div>
      <Field label="Granted by" name="granted_by" placeholder="Person and department" error={state.fields?.granted_by} />
      <Field label="Date granted" name="granted_on" type="date" error={state.fields?.granted_on} />
      <div>
        <label htmlFor="f-evidence" className="text-sm font-medium text-ink">
          Permission evidence
        </label>
        <textarea
          id="f-evidence"
          name="permission_evidence"
          rows={3}
          maxLength={2000}
          placeholder="What permission exists and where the document is kept (e.g. signed letter, ref. no., stored in shared drive)"
          className="mt-1.5 w-full rounded-xl border border-line bg-surface p-3 text-sm outline-none focus:border-accent"
        />
      </div>
      <Field label="Web link (optional)" name="url" type="url" error={state.fields?.url} />
      <div>
        <label htmlFor="f-notes" className="text-sm font-medium text-ink">
          Licence notes (optional)
        </label>
        <textarea id="f-notes" name="license_notes" rows={2} maxLength={2000} className="mt-1.5 w-full rounded-xl border border-line bg-surface p-3 text-sm outline-none focus:border-accent" />
      </div>
      <SubmitButton pendingText="Saving…">Save source</SubmitButton>
    </form>
  );
}
