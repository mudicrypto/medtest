"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { Bookmark, BookmarkCheck, CircleCheck, CircleX, Languages, Sparkles } from "lucide-react";
import type { Question, QuestionKey, QuestionOption } from "@/lib/types";
import { useProgress } from "@/lib/progress-store";
import { submitAnswer } from "@/app/(app)/question-actions";
import { SourceBadge } from "./source-badge";
import { Badge, Button, Card, cn } from "./ui";
import { TutorDrawer } from "./tutor";
import { TUTOR_ENABLED } from "@/lib/features";

type OptionId = QuestionOption["id"];

export function QuestionCard({
  question,
  mode,
  onAnswered,
  footer,
}: {
  question: Question;
  mode: "practice" | "review";
  /** Called once the server has graded the answer. */
  onAnswered?: (answer: { selected: OptionId; correct: boolean; key: QuestionKey }) => void;
  /** Rendered after the answer is revealed, e.g. a "Next" button. */
  footer?: React.ReactNode;
}) {
  const store = useProgress();
  const [selected, setSelected] = useState<OptionId | null>(null);
  const [result, setResult] = useState<{ correct: boolean; key: QuestionKey } | null>(null);
  const [tutorOpen, setTutorOpen] = useState(false);
  const [checking, startChecking] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const bookmarked = store.bookmarks.includes(question.id);
  const showRu = store.showRussian && !!question.stemRu && question.rightsStatus !== "not_cleared";
  const { recordAttempt } = store;

  // The answer is graded on the server; the key only arrives in the reply.
  const submit = useCallback(() => {
    if (!selected || result || checking) return;
    setError(null);
    startChecking(async () => {
      try {
        const r = await submitAnswer(question.id, selected, mode);
        recordAttempt({ questionId: question.id, topic: r.topic, selected, correct: r.correct, mode }, r.card);
        setResult(r);
        onAnswered?.({ selected, correct: r.correct, key: r.key });
      } catch {
        setError("We couldn't check your answer. Please try again.");
      }
    });
  }, [selected, result, checking, question.id, mode, recordAttempt, onAnswered]);

  // Keyboard: 1–4 or A–D to choose, Enter to check.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (tutorOpen || result || checking) return;
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;
      const k = e.key.toUpperCase();
      const map: Record<string, OptionId> = { "1": "A", "2": "B", "3": "C", "4": "D", A: "A", B: "B", C: "C", D: "D" };
      if (map[k]) setSelected(map[k]);
      if (e.key === "Enter" && selected) {
        // Stop the same keypress from also clicking the "Next" button that
        // appears (and takes focus) once the answer is revealed.
        e.preventDefault();
        submit();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [tutorOpen, result, checking, selected, submit]);

  return (
    <>
      <Card className="overflow-hidden">
        {/* Badges wrap on the left; the RU and bookmark buttons stay top right. */}
        <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-3.5 sm:px-7">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <Badge>{question.topicName}</Badge>
            <SourceBadge origin={question.origin} reviewStatus={question.reviewStatus} />
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {question.stemRu && (
              <button
                type="button"
                onClick={() => store.setShowRussian(!store.showRussian)}
                disabled={!store.ready}
                aria-pressed={store.showRussian}
                className={cn(
                  "inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium",
                  store.showRussian ? "bg-accent-soft text-accent-strong" : "text-ink-muted hover:bg-sunken",
                )}
              >
                <Languages className="size-4" aria-hidden />
                RU
              </button>
            )}
            <button
              type="button"
              onClick={() => store.toggleBookmark(question.id)}
              // Wait for saved progress to load so the toggle starts from the right state.
              disabled={!store.ready}
              aria-pressed={bookmarked}
              className={cn(
                "grid size-8 place-items-center rounded-lg",
                bookmarked ? "text-accent" : "text-ink-muted hover:bg-sunken",
              )}
            >
              {bookmarked ? <BookmarkCheck className="size-[18px]" /> : <Bookmark className="size-[18px]" />}
              <span className="sr-only">{bookmarked ? "Remove bookmark" : "Bookmark question"}</span>
            </button>
          </div>
        </div>

        <div className="px-5 py-6 sm:px-7 sm:py-8">
          <p className="font-serif text-[1.13rem] leading-[1.7] text-ink sm:text-[1.2rem]">{question.stemEn}</p>
          {showRu && (
            <p lang="ru" className="mt-3 border-l-2 border-accent-line pl-3 font-serif text-[0.98rem] leading-relaxed text-ink-muted">
              {question.stemRu}
            </p>
          )}

          <fieldset className="mt-6 space-y-2.5" disabled={!!result || checking}>
            <legend className="sr-only">Choose one answer</legend>
            {question.options.map((o) => {
              const isSel = selected === o.id;
              const isKey = result?.key.correct === o.id;
              const isWrongPick = result && isSel && !result.correct;
              return (
                <label
                  key={o.id}
                  className={cn(
                    "group flex cursor-pointer items-start gap-3.5 rounded-xl border px-4 py-3.5 transition-colors",
                    !result && (isSel ? "border-accent bg-accent-soft/60" : "border-line hover:border-line-strong hover:bg-sunken/50"),
                    result && isKey && "border-success bg-success-soft",
                    isWrongPick && "border-danger bg-danger-soft",
                    result && !isKey && !isWrongPick && "border-line opacity-70",
                    result && "cursor-default",
                  )}
                >
                  <input
                    type="radio"
                    name={`q-${question.id}`}
                    value={o.id}
                    checked={isSel}
                    onChange={() => setSelected(o.id)}
                    className="sr-only"
                  />
                  <span
                    className={cn(
                      "mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg border text-xs font-semibold",
                      !result && (isSel ? "border-accent bg-accent text-white" : "border-line-strong text-ink-soft"),
                      result && isKey && "border-success bg-success text-white",
                      isWrongPick && "border-danger bg-danger text-white",
                      result && !isKey && !isWrongPick && "border-line text-ink-muted",
                    )}
                  >
                    {result && isKey ? <CircleCheck className="size-4" /> : isWrongPick ? <CircleX className="size-4" /> : o.id}
                  </span>
                  <span className="min-w-0 pt-0.5">
                    <span className="block text-[0.95rem] leading-snug text-ink">{o.textEn}</span>
                    {showRu && o.textRu && (
                      <span lang="ru" className="mt-0.5 block text-[0.85rem] text-ink-muted">
                        {o.textRu}
                      </span>
                    )}
                  </span>
                </label>
              );
            })}
          </fieldset>

          {!result && (
            <div className="mt-6 flex items-center justify-between gap-3">
              <p className="hidden text-xs text-ink-muted sm:block">Tip: press 1–4 to choose, Enter to check.</p>
              <Button onClick={submit} disabled={!selected || checking} className="w-full sm:w-auto">
                {checking ? "Checking…" : "Check answer"}
              </Button>
            </div>
          )}
          {error && (
            <p role="alert" className="mt-3 text-sm text-danger">
              {error}
            </p>
          )}
        </div>

        {result && (
          <div className="border-t border-line bg-canvas px-5 py-6 sm:px-7">
            <p
              className={cn(
                "flex items-center gap-2 text-sm font-semibold",
                result.correct ? "text-success" : "text-danger",
              )}
              role="status"
            >
              {result.correct ? <CircleCheck className="size-5" /> : <CircleX className="size-5" />}
              {result.correct ? "Correct" : `Not quite — the answer is ${result.key.correct}`}
            </p>
            <h3 className="mt-4 text-xs font-semibold uppercase tracking-[0.1em] text-ink-muted">Explanation</h3>
            <p className="mt-1.5 font-serif text-[1.02rem] leading-[1.7] text-ink-soft">{result.key.explanationEn}</p>

            {question.keyTerms.length > 0 && (
              <>
                <h3 className="mt-5 text-xs font-semibold uppercase tracking-[0.1em] text-ink-muted">Key terms</h3>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {question.keyTerms.map((t) => (
                    <li key={t.ru} className="rounded-lg border border-line bg-surface px-3 py-1.5 text-sm">
                      <span lang="ru" className="font-medium text-ink">
                        {t.ru}
                      </span>
                      <span className="text-ink-muted"> · {t.en}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}

            <div
              className={cn(
                "mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:items-center",
                TUTOR_ENABLED ? "sm:justify-between" : "sm:justify-end",
              )}
            >
              {TUTOR_ENABLED && (
                <Button variant="secondary" onClick={() => setTutorOpen(true)}>
                  <Sparkles className="size-4 text-accent" aria-hidden />
                  Ask the tutor
                </Button>
              )}
              {footer}
            </div>
          </div>
        )}
      </Card>

      {tutorOpen && result && (
        <TutorDrawer
          ctx={{ question, qkey: result.key, selected: selected ?? undefined }}
          onClose={() => setTutorOpen(false)}
        />
      )}
    </>
  );
}
