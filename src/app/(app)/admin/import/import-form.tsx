"use client";

import { startTransition, useActionState } from "react";
import Link from "next/link";
import { CircleAlert, CircleCheck, FileCheck, LoaderCircle, Upload } from "lucide-react";
import { Alert } from "@/components/form";
import { Button, Card } from "@/components/ui";
import { importQuestions, type ImportState } from "../actions";

function Buttons({ canImport, count, pending }: { canImport: boolean; count: number; pending: boolean }) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button type="submit" name="intent" value="preview" variant="secondary" disabled={pending}>
        {pending ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : <FileCheck className="size-4" aria-hidden />}
        Check file
      </Button>
      {canImport && (
        <Button type="submit" name="intent" value="import" disabled={pending}>
          <Upload className="size-4" aria-hidden /> Import {count} {count === 1 ? "question" : "questions"}
        </Button>
      )}
    </div>
  );
}

export function ImportForm({ sources }: { sources: { id: string; title: string }[] }) {
  const [state, action, pending] = useActionState<ImportState, FormData>(importQuestions, { status: "idle" });
  const clean = state.status === "preview" && !state.rowErrors?.length && (state.validRows ?? 0) > 0;

  return (
    <div className="space-y-4">
      <Card className="p-5 sm:p-6">
        {/* Submitted by hand rather than via the form's action prop: React clears
            a form after an action, which would drop the chosen file between
            "Check file" and "Import". */}
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            const data = new FormData(e.currentTarget, (e.nativeEvent as SubmitEvent).submitter);
            startTransition(() => action(data));
          }}
        >
          <div>
            <label htmlFor="file" className="text-sm font-medium text-ink">
              CSV file
            </label>
            <input
              id="file"
              name="file"
              type="file"
              accept=".csv,text/csv"
              required
              className="mt-1.5 block w-full text-sm text-ink-soft file:mr-3 file:h-10 file:rounded-lg file:border-0 file:bg-accent-soft file:px-4 file:text-sm file:font-medium file:text-accent-strong"
            />
          </div>
          <div>
            <label htmlFor="sourceId" className="text-sm font-medium text-ink">
              Source for this file
            </label>
            <select id="sourceId" name="sourceId" defaultValue="" className="mt-1.5 h-11 w-full rounded-xl border border-line bg-surface px-3 text-sm sm:w-96">
              <option value="">None (MedPrep original content)</option>
              {sources.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
            <p className="mt-1.5 text-xs text-ink-muted">
              Not listed? <Link href="/admin/sources" className="text-accent hover:underline">Add the source first</Link>.
            </p>
          </div>
          <Buttons canImport={clean} count={state.validRows ?? 0} pending={pending} />
        </form>
      </Card>

      {state.status === "done" && (
        <Alert tone="success">
          Import complete: {state.created} created, {state.updated} updated.{" "}
          <Link href="/admin/questions" className="font-medium underline">
            View questions
          </Link>
        </Alert>
      )}
      {state.message && <Alert tone="error">{state.message}</Alert>}
      {state.fileErrors?.map((e) => (
        <Alert key={e} tone="error">
          {e}
        </Alert>
      ))}

      {(state.status === "preview" || (state.status === "error" && state.totalRows !== undefined)) && (
        <Card className="p-5 sm:p-6" aria-live="polite">
          <h2 className="font-semibold text-ink">Check results</h2>
          <dl className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <Stat label="Rows" value={state.totalRows} />
            <Stat label="Ready" value={state.validRows} />
            <Stat label="New" value={state.toCreate} />
            <Stat label="Updates" value={state.toUpdate} />
          </dl>

          {state.rowErrors && state.rowErrors.length > 0 ? (
            <div className="mt-5">
              <p className="flex items-center gap-2 text-sm font-medium text-danger">
                <CircleAlert className="size-4" aria-hidden /> {state.rowErrors.length} {state.rowErrors.length === 1 ? "row needs" : "rows need"} fixing
                before importing
              </p>
              <ul className="mt-2 max-h-80 space-y-2 overflow-y-auto text-sm">
                {state.rowErrors.map((e, i) => (
                  <li key={i} className="rounded-lg bg-danger-soft p-3">
                    <span className="font-medium text-ink">
                      {e.line ? `Line ${e.line}` : "Row"}
                      {e.slug && ` · ${e.slug}`}
                    </span>
                    <ul className="mt-1 list-disc pl-5 text-danger">
                      {e.messages.map((m) => (
                        <li key={m}>{m}</li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="mt-5 flex items-center gap-2 text-sm font-medium text-success">
              <CircleCheck className="size-4" aria-hidden /> No problems found. Click &ldquo;Import&rdquo; to save.
            </p>
          )}

          {state.sample && state.sample.length > 0 && (
            <div className="mt-5 overflow-x-auto">
              <p className="mb-2 text-xs text-ink-muted">First rows</p>
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead>
                  <tr className="border-b border-line text-xs text-ink-muted">
                    <th className="py-2 pr-3 font-medium">Slug</th>
                    <th className="py-2 pr-3 font-medium">Topic</th>
                    <th className="py-2 pr-3 font-medium">Origin</th>
                    <th className="py-2 pr-3 font-medium">Rights</th>
                    <th className="py-2 pr-3 font-medium">Review</th>
                  </tr>
                </thead>
                <tbody>
                  {state.sample.map((r) => (
                    <tr key={r.slug} className="border-b border-line/60">
                      <td className="py-2 pr-3 font-mono text-xs">{r.slug}</td>
                      <td className="py-2 pr-3">{r.topic}</td>
                      <td className="py-2 pr-3">{r.origin}</td>
                      <td className="py-2 pr-3">{r.rights_status}</td>
                      <td className="py-2 pr-3">{r.review_status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value?: number }) {
  return (
    <div className="rounded-lg bg-sunken p-3">
      <dt className="text-xs text-ink-muted">{label}</dt>
      <dd className="text-lg font-semibold tabular-nums text-ink">{value ?? 0}</dd>
    </div>
  );
}
