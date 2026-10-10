"use client";

import { useEffect, useState } from "react";
import { Bookmark, BookmarkCheck, CircleCheck, CircleX, Languages, Lightbulb, RotateCcw, Sparkles } from "lucide-react";
import type { Question } from "@/lib/types";
import { useProgress } from "@/lib/progress-store";
import type { OptionId, QuestionState } from "@/lib/practice/engine";
import { usePracticeSession } from "@/lib/practice/use-practice-session";
import { SourceBadge } from "./source-badge";
import { Badge, Button, Card, cn } from "./ui";
import { TutorDrawer } from "./tutor";

/**
 * Displays one question. It holds no answer logic of its own: the session
 * engine owns selection and submission state and passes it in.
 */
export function QuestionCard({
  question,
  state,
  onSelect,
  onSubmit,
  onRestart,
  footer,
}: {
  question: Question;
  state: QuestionState;
  onSelect: (option: OptionId) => void;
  onSubmit: () => void;
  /** "Try again": clears this question's answer. */
  onRestart?: () => void;
  /** Rendered under the explanation, e.g. a "Next question" button. */
  footer?: React.ReactNode;
}) {
  const store = useProgress();
  const [tutorOpen, setTutorOpen] = useState(false);

  const answered = state.status === "answered" ? state : null;
  const submitting = state.status === "submitting";
  const selected = state.selected;
  const failed = state.status === "unanswered" && !!state.retry && state.retry.selected === state.selected;
  const bookmarked = store.bookmarks.includes(question.id);
  const showRu = store.showRussian && !!question.stemRu && question.rightsStatus !== "not_cleared";

  // Keyboard: 1–4 or A–D to choose, Enter to check.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (tutorOpen || state.status !== "unanswered") return;
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT") return;
      const k = e.key.toUpperCase();
      const map: Record<string, OptionId> = { "1": "A", "2": "B", "3": "C", "4": "D", A: "A", B: "B", C: "C", D: "D" };
      if (map[k]) onSelect(map[k]);
      if (e.key === "Enter" && state.selected) {
        // Stop the same keypress from also clicking the "Next" button that
        // appears (and takes focus) once the answer is revealed.
        e.preventDefault();
        onSubmit();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [tutorOpen, state, onSelect, onSubmit]);

  const key = answered?.result.key;
  const classification = [question.subject, question.topic, question.subtopic].filter(Boolean).join(" › ");

  return (
    <>
      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3.5 sm:px-7">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <Badge>{question.specialtyName}</Badge>
            <SourceBadge origin={question.origin} reviewStatus={question.reviewStatus} />
          </div>
          <div className="flex items-center gap-1">
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
              className={cn("grid size-8 place-items-center rounded-lg", bookmarked ? "text-accent" : "text-ink-muted hover:bg-sunken")}
            >
              {bookmarked ? <BookmarkCheck className="size-[18px]" /> : <Bookmark className="size-[18px]" />}
              <span className="sr-only">{bookmarked ? "Remove bookmark" : "Bookmark question"}</span>
            </button>
          </div>
        </div>

        <div className="px-5 py-6 sm:px-7 sm:py-8">
          {classification && <p className="mb-3 text-xs text-ink-muted">{classification}</p>}
          <p className="font-serif text-[1.13rem] leading-[1.7] text-ink sm:text-[1.2rem]">{question.stemEn}</p>
          {showRu && (
            <p lang="ru" className="mt-3 border-l-2 border-accent-line pl-3 font-serif text-[0.98rem] leading-relaxed text-ink-muted">
              {question.stemRu}
            </p>
          )}

          <fieldset className="mt-6 space-y-2.5" disabled={state.status !== "unanswered"}>
            <legend className="sr-only">Choose one answer</legend>
            {question.options.map((o) => {
              const isSel = selected === o.id;
              const isKey = key?.correct === o.id;
              const isWrongPick = !!answered && isSel && !answered.result.correct;
              const why = key?.optionExplanations[o.id];
              return (
                <label
                  key={o.id}
                  className={cn(
                    "group flex items-start gap-3.5 rounded-xl border px-4 py-3.5 transition-colors",
                    !answered && "cursor-pointer",
                    !answered && (isSel ? "border-accent bg-accent-soft/60" : "border-line hover:border-line-strong hover:bg-sunken/50"),
                    answered && isKey && "border-success bg-success-soft",
                    isWrongPick && "border-danger bg-danger-soft",
                    answered && !isKey && !isWrongPick && "border-line",
                  )}
                >
                  <input
                    type="radio"
                    name={`q-${question.id}`}
                    value={o.id}
                    checked={isSel}
                    onChange={() => onSelect(o.id)}
                    className="sr-only"
                  />
                  <span
                    className={cn(
                      "mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg border text-xs font-semibold",
                      !answered && (isSel ? "border-accent bg-accent text-white" : "border-line-strong text-ink-soft"),
                      answered && isKey && "border-success bg-success text-white",
                      isWrongPick && "border-danger bg-danger text-white",
                      answered && !isKey && !isWrongPick && "border-line text-ink-muted",
                    )}
                  >
                    {answered && isKey ? <CircleCheck className="size-4" /> : isWrongPick ? <CircleX className="size-4" /> : o.id}
                  </span>
                  <span className="min-w-0 pt-0.5">
                    <span className={cn("block text-[0.95rem] leading-snug", answered && !isKey && !isWrongPick ? "text-ink-soft" : "text-ink")}>
                      {o.textEn}
                    </span>
                    {showRu && o.textRu && (
                      <span lang="ru" className="mt-0.5 block text-[0.85rem] text-ink-muted">
                        {o.textRu}
                      </span>
                    )}
                    {why && (
                      <span className={cn("mt-1.5 block text-[0.85rem] leading-snug", isKey ? "text-success" : "text-ink-muted")}>
                        <span className="font-medium">{isKey ? "Why it's right: " : "Why not: "}</span>
                        {why}
                      </span>
                    )}
                  </span>
                </label>
              );
            })}
          </fieldset>

          {!answered && (
            <div className="mt-6 flex items-center justify-between gap-3">
              <p className="hidden text-xs text-ink-muted sm:block">Tip: press 1–4 to choose, Enter to check.</p>
              <Button onClick={onSubmit} disabled={!selected || submitting || !store.ready} className="w-full sm:w-auto">
                {submitting ? "Checking…" : failed ? "Try checking again" : "Check answer"}
              </Button>
            </div>
          )}
          {failed && (
            <p role="alert" className="mt-3 text-sm text-danger">
              We couldn&apos;t check your answer. Check your connection and try again.
            </p>
          )}
          {!answered && footer && <div className="mt-4 flex justify-end">{footer}</div>}
        </div>

        {answered && key && (
          <div className="border-t border-line bg-canvas px-5 py-6 sm:px-7">
            <p className={cn("flex items-center gap-2 text-sm font-semibold", answered.result.correct ? "text-success" : "text-danger")} role="status">
              {answered.result.correct ? <CircleCheck className="size-5" /> : <CircleX className="size-5" />}
              {answered.result.correct ? "Correct" : `Not quite — the answer is ${key.correct}`}
            </p>

            <h3 className="mt-4 text-xs font-semibold uppercase tracking-[0.1em] text-ink-muted">Explanation</h3>
            <p className="mt-1.5 font-serif text-[1.02rem] leading-[1.7] text-ink-soft">{key.explanationEn}</p>
            {store.showRussian && key.explanationRu && (
              <p lang="ru" className="mt-2 border-l-2 border-accent-line pl-3 font-serif leading-relaxed text-ink-muted">
                {key.explanationRu}
              </p>
            )}

            {key.examPearl && (
              <div className="mt-5 flex gap-3 rounded-xl border border-accent-line bg-accent-soft/60 p-4">
                <Lightbulb className="mt-0.5 size-5 shrink-0 text-accent" aria-hidden />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.1em] text-accent-strong">Exam pearl</p>
                  <p className="mt-1 text-sm leading-relaxed text-ink">{key.examPearl}</p>
                </div>
              </div>
            )}

            {question.keyTerms.length > 0 && (
              <>
                <h3 className="mt-5 text-xs font-semibold uppercase tracking-[0.1em] text-ink-muted">Russian terminology</h3>
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

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button variant="secondary" onClick={() => setTutorOpen(true)}>
                  <Sparkles className="size-4 text-accent" aria-hidden />
                  Ask the tutor
                </Button>
                {onRestart && (
                  <Button variant="ghost" onClick={onRestart}>
                    <RotateCcw className="size-4" aria-hidden /> Try again
                  </Button>
                )}
              </div>
              {footer}
            </div>
          </div>
        )}
      </Card>

      {tutorOpen && answered && key && (
        <TutorDrawer
          ctx={{ question, qkey: { ...key, tutorHint: key.tutorHint || key.examPearl || "" }, selected: answered.selected }}
          onClose={() => setTutorOpen(false)}
        />
      )}
    </>
  );
}

/**
 * A single self-contained question (question page, daily review): the same
 * engine as a session, with one question.
 */
export function PracticeQuestion({
  question,
  mode,
  footer,
}: {
  question: Question;
  mode: "practice" | "review";
  footer?: (answered: boolean) => React.ReactNode;
}) {
  const { state, dispatch, submit } = usePracticeSession([question.id], mode);
  const qs = state.questions[question.id];
  return (
    <QuestionCard
      question={question}
      state={qs}
      onSelect={(option) => dispatch({ type: "select", id: question.id, option })}
      onSubmit={() => void submit(question.id)}
      onRestart={() => dispatch({ type: "restartQuestion", id: question.id })}
      footer={footer?.(qs.status === "answered")}
    />
  );
}
