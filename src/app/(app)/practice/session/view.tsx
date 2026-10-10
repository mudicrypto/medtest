"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, CircleCheck, CircleX, X } from "lucide-react";
import { useDemoStore } from "@/lib/demo-store";
import type { Attempt } from "@/lib/types";
import { questionById, questions } from "@/demo/questions";
import { QuestionCard } from "@/components/question-card";
import { Button, ButtonLink, Card, ProgressBar, Skeleton } from "@/components/ui";

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
  const store = useDemoStore();
  const [ids, setIds] = useState<string[] | null>(null);
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<Record<string, boolean>>({});

  // Freeze the question list once, when the store is ready, so answering
  // doesn't reshuffle the session.
  useEffect(() => {
    if (!store.ready || ids) return;
    const explicit = params.get("ids")?.split(",").filter((id) => questionById[id]);
    const topicFilter = params.get("topics")?.split(",").filter(Boolean) ?? [];
    const n = Math.max(1, Number(params.get("n")) || 10);
    let list: string[];
    if (explicit?.length) list = explicit;
    else {
      const lastSeen = new Map<string, number>();
      for (const a of store.attempts) lastSeen.set(a.questionId, a.at);
      list = questions
        .filter((q) => !topicFilter.length || topicFilter.includes(q.topic))
        // Unseen first, then the ones seen longest ago.
        .sort((a, b) => (lastSeen.get(a.id) ?? 0) - (lastSeen.get(b.id) ?? 0))
        .slice(0, n)
        .map((q) => q.id);
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- freeze session list once data is loaded
    setIds(list);
  }, [store.ready, store.attempts, ids, params]);

  if (!ids) return <Skeleton className="h-[520px]" />;

  if (ids.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-ink">No questions match this selection.</p>
        <ButtonLink href="/practice" variant="secondary" className="mt-4">
          Back to practice
        </ButtonLink>
      </Card>
    );
  }

  const done = index >= ids.length;
  const mode: Attempt["mode"] = params.get("mode") === "review" ? "review" : "practice";

  if (done) return <Summary ids={ids} results={results} />;

  const q = questionById[ids[index]];
  const isLast = index === ids.length - 1;

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
          <ProgressBar value={(index / ids.length) * 100} label="Session progress" />
        </div>
        <span className="shrink-0 text-sm tabular-nums text-ink-muted">
          {index + 1} / {ids.length}
        </span>
      </div>

      <QuestionCard
        key={q.id}
        question={q}
        mode={mode}
        onAnswered={(c) => setResults((r) => ({ ...r, [q.id]: c }))}
        footer={
          <Button onClick={() => setIndex((i) => i + 1)} autoFocus>
            {isLast ? "Finish" : "Next question"} <ArrowRight className="size-4" aria-hidden />
          </Button>
        }
      />
    </div>
  );
}

function Summary({ ids, results }: { ids: string[]; results: Record<string, boolean> }) {
  const correct = ids.filter((id) => results[id]).length;
  const pct = Math.round((correct / ids.length) * 100);
  const wrongIds = ids.filter((id) => results[id] === false);

  return (
    <div className="mx-auto max-w-2xl">
      <Card className="p-7 text-center sm:p-10">
        <p className="text-sm font-medium text-accent">Session complete</p>
        <p className="mt-3 text-5xl font-semibold tracking-tight tabular-nums text-ink">{pct}%</p>
        <p className="mt-2 text-ink-muted">
          {correct} of {ids.length} correct
        </p>
        <div className="mt-7 flex flex-col justify-center gap-2 sm:flex-row">
          {wrongIds.length > 0 && (
            <ButtonLink href={`/practice/session?ids=${wrongIds.join(",")}`}>
              Retry {wrongIds.length} missed
            </ButtonLink>
          )}
          <ButtonLink href="/practice" variant="secondary">
            New session
          </ButtonLink>
          <ButtonLink href="/dashboard" variant="ghost">
            Dashboard
          </ButtonLink>
        </div>
      </Card>

      <Card className="mt-4 divide-y divide-line">
        {ids.map((id, i) => {
          const q = questionById[id];
          const ok = results[id];
          return (
            <Link key={id} href={`/questions/${id}`} className="flex items-start gap-3 px-5 py-4 hover:bg-sunken/50">
              {ok ? (
                <CircleCheck className="mt-0.5 size-5 shrink-0 text-success" aria-label="Correct" />
              ) : (
                <CircleX className="mt-0.5 size-5 shrink-0 text-danger" aria-label="Incorrect" />
              )}
              <span className="line-clamp-2 text-sm text-ink-soft">
                <span className="tabular-nums text-ink-muted">{i + 1}. </span>
                {q.stemEn}
              </span>
            </Link>
          );
        })}
      </Card>
    </div>
  );
}
