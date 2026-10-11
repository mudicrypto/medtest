"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Info, RotateCcw, X } from "lucide-react";
import { useProgress } from "@/lib/progress-store";
import type { Question, QuestionKey, QuestionOption } from "@/lib/types";
import { QUESTIONS_LOAD_ERROR, useQuestions } from "@/lib/use-questions";
import { fetchQuestionRefs } from "@/app/(app)/question-actions";
import { AnswerReview } from "@/components/answer-review";
import { LoadError } from "@/components/load-error";
import { QuestionCard } from "@/components/question-card";
import { Button, ButtonLink, Card, ProgressBar, Skeleton } from "@/components/ui";

/** What the student chose for one question, and the key the server returned. */
type SessionAnswer = { selected: QuestionOption["id"]; correct: boolean; key: QuestionKey };

/**
 * Runs a list of questions one at a time.
 * URL options: ?topics=a,b  ?ids=q1,q2  ?n=10
 */
export function SessionView() {
  const params = useSearchParams();
  // A new query string (e.g. "Retry missed") starts a fresh session.
  return <Session key={params.toString()} params={params} />;
}

function Session({ params }: { params: URLSearchParams }) {
  const store = useProgress();
  const [ids, setIds] = useState<string[] | null>(null);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, SessionAnswer>>({});

  const [failed, setFailed] = useState(false);
  // Bumped by "Try again" to re-run the question picker below.
  const [attempt, setAttempt] = useState(0);

  // Choose the session's questions once, when local progress has loaded, so
  // answering doesn't reshuffle the session.
  useEffect(() => {
    if (!store.ready || ids) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- clear a previous failure before trying again
    setFailed(false);
    const explicit = params.get("ids")?.split(",").filter(Boolean) ?? [];
    const topicFilter = params.get("topics")?.split(",").filter(Boolean) ?? [];
    const n = Math.max(1, Math.min(100, Number(params.get("n")) || 10));
    if (explicit.length) {
      setIds(explicit.slice(0, 300));
      return;
    }
    const lastSeen = new Map<string, number>();
    for (const a of store.attempts) lastSeen.set(a.questionId, a.at);
    fetchQuestionRefs(topicFilter).then(
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
  }, [store.ready, store.attempts, ids, params, attempt]);

  const loaded = useQuestions(ids);

  if (failed || loaded.status === "error") {
    return (
      <LoadError
        message={QUESTIONS_LOAD_ERROR}
        onRetry={failed ? () => setAttempt((n) => n + 1) : loaded.retry}
        back={{ href: "/practice", label: "Back to practice" }}
      />
    );
  }
  if (!ids || loaded.status === "loading") return <Skeleton className="h-[520px]" />;

  const list = loaded.questions;
  if (list.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-ink">No questions match this selection.</p>
        <ButtonLink href="/practice" variant="secondary" className="mt-4">
          Back to practice
        </ButtonLink>
      </Card>
    );
  }

  const done = index >= list.length;
  const mode = params.get("mode") === "review" ? "review" : "practice";

  if (done) return <Summary questions={list} answers={answers} />;

  const q = list[index];
  const isLast = index === list.length - 1;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-5 flex items-center gap-4">
        <Link
          href="/practice"
          className="grid size-9 shrink-0 place-items-center rounded-lg text-ink-muted hover:bg-sunken hover:text-ink"
        >
          <X className="size-5" aria-hidden />
          <span className="sr-only">End session</span>
        </Link>
        <div className="flex-1">
          <ProgressBar value={(index / list.length) * 100} label="Session progress" />
        </div>
        <span className="shrink-0 text-sm tabular-nums text-ink-muted">
          {index + 1} / {list.length}
        </span>
      </div>

      <QuestionCard
        key={q.id}
        question={q}
        mode={mode}
        onAnswered={(a) => setAnswers((prev) => ({ ...prev, [q.id]: a }))}
        footer={
          <Button onClick={() => setIndex((i) => i + 1)} autoFocus>
            {isLast ? "Finish" : "Next question"} <ArrowRight className="size-4" aria-hidden />
          </Button>
        }
      />
    </div>
  );
}

function Summary({ questions, answers }: { questions: Question[]; answers: Record<string, SessionAnswer> }) {
  const answered = questions.filter((q) => answers[q.id]);
  const correct = answered.filter((q) => answers[q.id].correct).length;
  const pct = answered.length ? Math.round((correct / answered.length) * 100) : 0;
  const wrongIds = answered.filter((q) => !answers[q.id].correct).map((q) => q.id);

  return (
    <div className="mx-auto max-w-3xl">
      <Card className="p-7 text-center sm:p-10">
        <p className="text-sm font-medium text-accent">Session complete</p>
        <p className="mt-3 text-5xl font-semibold tracking-tight tabular-nums text-ink">{pct}%</p>
        <p className="mt-2 text-ink-muted">
          {correct} of {answered.length} correct
        </p>
        <div className="mt-7 flex flex-col justify-center gap-2 sm:flex-row">
          {wrongIds.length > 0 && (
            <ButtonLink href={`/practice/session?ids=${wrongIds.join(",")}`}>
              <RotateCcw className="size-4" aria-hidden />
              Retry {wrongIds.length} missed
            </ButtonLink>
          )}
          <ButtonLink href="/practice" variant={wrongIds.length ? "secondary" : "primary"}>
            New session
          </ButtonLink>
          <ButtonLink href="/dashboard" variant="ghost">
            Dashboard
          </ButtonLink>
        </div>
      </Card>

      <h2 className="mb-3 mt-8 flex items-center gap-2 text-sm font-semibold text-ink">
        <Info className="size-4 text-ink-muted" aria-hidden /> Answer review
      </h2>
      <AnswerReview
        items={answered.map((q) => ({
          question: q,
          selected: answers[q.id].selected,
          correct: answers[q.id].key.correct,
          explanationEn: answers[q.id].key.explanationEn,
        }))}
      />
    </div>
  );
}
