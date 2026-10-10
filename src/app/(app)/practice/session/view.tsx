"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, CircleCheck, CircleMinus, CircleX, RotateCcw, X } from "lucide-react";
import { useProgress } from "@/lib/progress-store";
import type { Question } from "@/lib/types";
import { useQuestions } from "@/lib/use-questions";
import { questionState, sessionMistakes, sessionScore, type SessionState } from "@/lib/practice/engine";
import { usePracticeSession } from "@/lib/practice/use-practice-session";
import { fetchQuestionRefs } from "@/app/(app)/question-actions";
import { QuestionCard } from "@/components/question-card";
import { Button, ButtonLink, Card, ProgressBar, Skeleton, cn } from "@/components/ui";

/**
 * Runs a practice session.
 * URL options: ?specialties=a,b  &topic=X (repeatable)  ?ids=q1,q2  ?n=10  ?mode=review
 */
export function SessionView() {
  const params = useSearchParams();
  // A new query string (e.g. "Retry mistakes") starts a fresh session.
  return <SessionLoader key={params.toString()} params={params} />;
}

function SessionLoader({ params }: { params: URLSearchParams }) {
  const store = useProgress();
  const [ids, setIds] = useState<string[] | null>(null);
  const [failed, setFailed] = useState(false);

  // Choose the session's questions once, when saved progress has loaded, so
  // answering doesn't reshuffle the session.
  useEffect(() => {
    if (!store.ready || ids) return;
    let cancelled = false;
    const explicit = params.get("ids")?.split(",").filter(Boolean) ?? [];
    // `topics=` is the older name for specialties, kept so old links still work.
    const specialties = (params.get("specialties") ?? params.get("topics") ?? "").split(",").filter(Boolean);
    const topics = params.getAll("topic").filter(Boolean);
    const n = Math.max(1, Math.min(100, Number(params.get("n")) || 10));
    if (explicit.length) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- freeze session list once data is loaded
      setIds(explicit.slice(0, 300));
      return;
    }
    const lastSeen = new Map<string, number>();
    for (const a of store.attempts) lastSeen.set(a.questionId, a.at);
    fetchQuestionRefs({ specialties, topics }).then(
      (refs) => {
        if (cancelled) return;
        setIds(
          refs
            // Unseen first, then the ones seen longest ago.
            .sort((a, b) => (lastSeen.get(a.id) ?? 0) - (lastSeen.get(b.id) ?? 0))
            .slice(0, n)
            .map((r) => r.id),
        );
      },
      () => !cancelled && setFailed(true),
    );
    return () => {
      cancelled = true;
    };
  }, [store.ready, store.attempts, ids, params]);

  const loaded = useQuestions(ids);

  if (failed || loaded.status === "error") {
    return (
      <Card className="p-8 text-center">
        <p className="text-ink">We couldn&apos;t load your questions. Check your connection and try again.</p>
        <ButtonLink href="/practice" variant="secondary" className="mt-4">
          Back to practice
        </ButtonLink>
      </Card>
    );
  }
  if (!ids || loaded.status === "loading") return <Skeleton className="h-[520px]" />;
  if (loaded.questions.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-ink">No questions match this selection.</p>
        <ButtonLink href="/practice" variant="secondary" className="mt-4">
          Back to practice
        </ButtonLink>
      </Card>
    );
  }
  return <Session questions={loaded.questions} mode={params.get("mode") === "review" ? "review" : "practice"} />;
}

function Session({ questions, mode }: { questions: Question[]; mode: "practice" | "review" }) {
  const { state, dispatch, submit } = usePracticeSession(
    questions.map((q) => q.id),
    mode,
  );
  const byId = new Map(questions.map((q) => [q.id, q]));
  const score = sessionScore(state);

  if (state.finished) {
    return (
      <Summary
        state={state}
        questions={byId}
        onRestart={() => dispatch({ type: "restartSession" })}
        onReview={(index) => dispatch({ type: "goTo", index })}
      />
    );
  }

  const id = state.ids[state.index];
  const q = byId.get(id)!;
  const qs = questionState(state, id);
  const isFirst = state.index === 0;
  const isLast = state.index === state.ids.length - 1;
  const answered = qs.status === "answered";

  const nav = (
    <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-end">
      <Button variant="ghost" onClick={() => dispatch({ type: "previous" })} disabled={isFirst}>
        <ArrowLeft className="size-4" aria-hidden /> Previous
      </Button>
      {answered ? (
        <Button onClick={() => dispatch({ type: "next" })} autoFocus>
          {isLast ? "Finish" : "Next question"} <ArrowRight className="size-4" aria-hidden />
        </Button>
      ) : (
        <Button variant="secondary" onClick={() => dispatch({ type: "next" })} disabled={qs.status === "submitting"}>
          {isLast ? "Finish" : "Skip"} <ArrowRight className="size-4" aria-hidden />
        </Button>
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-5 flex items-center gap-4">
        <Link href="/practice" className="grid size-9 shrink-0 place-items-center rounded-lg text-ink-muted hover:bg-sunken hover:text-ink">
          <X className="size-5" aria-hidden />
          <span className="sr-only">End session</span>
        </Link>
        <div className="flex-1">
          <ProgressBar value={(score.answered / score.total) * 100} label="Questions answered" />
        </div>
        <span className="shrink-0 text-sm tabular-nums text-ink-muted">
          {state.index + 1} / {state.ids.length}
        </span>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-sm" aria-live="polite">
        <span className="text-ink-muted" data-testid="session-score">
          Score: <span className="font-medium tabular-nums text-ink">{score.correct}/{score.answered}</span>
          {score.accuracy !== null && <span className="tabular-nums"> · {score.accuracy}%</span>}
          {score.unanswered > 0 && <span> · {score.unanswered} unanswered</span>}
        </span>
        <button type="button" onClick={() => dispatch({ type: "finish" })} className="text-sm text-accent hover:underline">
          End &amp; see results
        </button>
      </div>

      <QuestionCard
        key={id}
        question={q}
        state={qs}
        onSelect={(option) => dispatch({ type: "select", id, option })}
        onSubmit={() => void submit(id)}
        onRestart={() => dispatch({ type: "restartQuestion", id })}
        footer={nav}
      />
    </div>
  );
}

function Summary({
  state,
  questions,
  onRestart,
  onReview,
}: {
  state: SessionState;
  questions: Map<string, Question>;
  onRestart: () => void;
  onReview: (index: number) => void;
}) {
  const score = sessionScore(state);
  const mistakes = sessionMistakes(state);

  return (
    <div className="mx-auto max-w-2xl">
      <Card className="p-7 text-center sm:p-10">
        <p className="text-sm font-medium text-accent">Session complete</p>
        <p className="mt-3 text-5xl font-semibold tracking-tight tabular-nums text-ink" data-testid="session-accuracy">
          {score.accuracy === null ? "—" : `${score.accuracy}%`}
        </p>
        <p className="mt-2 text-ink-muted">
          {score.answered === 0 ? "You didn't answer any questions." : `${score.correct} of ${score.answered} answered correctly`}
        </p>
        <dl className="mx-auto mt-6 grid max-w-sm grid-cols-3 gap-2 text-sm">
          <div className="rounded-lg bg-success-soft p-2.5">
            <dt className="text-success">Correct</dt>
            <dd className="text-lg font-semibold tabular-nums text-ink">{score.correct}</dd>
          </div>
          <div className="rounded-lg bg-danger-soft p-2.5">
            <dt className="text-danger">Incorrect</dt>
            <dd className="text-lg font-semibold tabular-nums text-ink">{score.incorrect}</dd>
          </div>
          <div className="rounded-lg bg-sunken p-2.5">
            <dt className="text-ink-muted">Skipped</dt>
            <dd className="text-lg font-semibold tabular-nums text-ink">{score.unanswered}</dd>
          </div>
        </dl>
        <p className="mt-3 text-xs text-ink-muted">Accuracy counts answered questions only; skipped questions aren&apos;t marked wrong.</p>
        <div className="mt-7 flex flex-col justify-center gap-2 sm:flex-row">
          {mistakes.length > 0 && <ButtonLink href={`/practice/session?ids=${mistakes.join(",")}`}>Retry {mistakes.length} missed</ButtonLink>}
          <Button variant="secondary" onClick={onRestart}>
            <RotateCcw className="size-4" aria-hidden /> Restart session
          </Button>
          <ButtonLink href="/practice" variant="ghost">
            New session
          </ButtonLink>
        </div>
      </Card>

      <Card className="mt-4 divide-y divide-line">
        {state.ids.map((id, i) => {
          const q = questions.get(id)!;
          const qs = questionState(state, id);
          const status = qs.status !== "answered" ? "skipped" : qs.result.correct ? "correct" : "incorrect";
          return (
            <button key={id} type="button" onClick={() => onReview(i)} className="flex w-full items-start gap-3 px-5 py-4 text-left hover:bg-sunken/50">
              {status === "correct" ? (
                <CircleCheck className="mt-0.5 size-5 shrink-0 text-success" aria-label="Correct" />
              ) : status === "incorrect" ? (
                <CircleX className="mt-0.5 size-5 shrink-0 text-danger" aria-label="Incorrect" />
              ) : (
                <CircleMinus className="mt-0.5 size-5 shrink-0 text-ink-muted" aria-label="Skipped" />
              )}
              <span className={cn("line-clamp-2 text-sm", status === "skipped" ? "text-ink-muted" : "text-ink-soft")}>
                <span className="tabular-nums text-ink-muted">{i + 1}. </span>
                {q.stemEn}
              </span>
            </button>
          );
        })}
      </Card>
    </div>
  );
}
