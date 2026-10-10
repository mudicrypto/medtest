"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, CircleCheck, CircleX, Clock, Flag, Info } from "lucide-react";
import { useProgress, type MockSummary } from "@/lib/progress-store";
import type { Question, QuestionOption } from "@/lib/types";
import { blueprints } from "@/demo/blueprints";
import { startMock, submitMock, type MockGrade } from "@/app/(app)/question-actions";
import { SourceBadge } from "@/components/source-badge";
import { Badge, Button, ButtonLink, Card, ProgressBar, Skeleton, cn } from "@/components/ui";

type OptionId = QuestionOption["id"];

function fmt(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function MockRunView() {
  const params = useSearchParams();
  const blueprint = blueprints.find((b) => b.id === params.get("b")) ?? blueprints[0];
  const store = useProgress();

  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, startSubmitting] = useTransition();
  const [startedAt, setStartedAt] = useState(0);
  const [now, setNow] = useState(0);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, OptionId>>({});
  const [flags, setFlags] = useState<string[]>([]);
  const [confirming, setConfirming] = useState(false);
  const [result, setResult] = useState<{ summary: MockSummary; grades: MockGrade[] } | null>(null);
  const ids = useMemo(() => questions?.map((q) => q.id) ?? null, [questions]);

  // The server picks the exam's questions once, on mount.
  useEffect(() => {
    let cancelled = false;
    startMock(blueprint.questionCount).then(
      (qs) => {
        if (cancelled) return;
        const t = Date.now();
        setQuestions(qs);
        setStartedAt(t);
        setNow(t);
      },
      () => !cancelled && setLoadError(true),
    );
    return () => {
      cancelled = true;
    };
  }, [blueprint.questionCount]);

  const remaining = Math.max(0, blueprint.timeLimitMinutes * 60 - Math.floor((now - startedAt) / 1000));

  const { recordAttempt, addMock } = store;
  const submit = useCallback(() => {
    if (!ids || result || submitting) return;
    setSubmitError(null);
    // One server call grades the whole exam. (Server-side time limits arrive
    // with the full mock exam milestone.)
    startSubmitting(async () => {
      try {
        const { grades, summary, cards } = await submitMock(blueprint.id, ids, answers, (Date.now() - startedAt) / 1000);
        for (const g of grades) {
          if (g.selected) {
            recordAttempt({ questionId: g.questionId, topic: g.topic, selected: g.selected, correct: g.isCorrect, mode: "mock" }, cards[g.questionId]);
          }
        }
        addMock(summary, cards);
        setConfirming(false);
        setResult({ summary, grades });
        window.scrollTo({ top: 0 });
      } catch {
        setSubmitError("We couldn't submit your exam. Check your connection and try again — your answers are kept.");
      }
    });
  }, [ids, result, submitting, answers, recordAttempt, addMock, blueprint, startedAt]);

  // Countdown; auto-submit when time runs out.
  useEffect(() => {
    if (!ids || result) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [ids, result]);

  // Auto-submit once when time runs out (a failed attempt can be retried by hand).
  const autoSubmitted = useRef(false);
  useEffect(() => {
    if (ids && !result && startedAt && remaining === 0 && !autoSubmitted.current) {
      autoSubmitted.current = true;
      submit();
    }
  }, [ids, result, startedAt, remaining, submit]);

  if (loadError) {
    return (
      <Card className="p-8 text-center">
        <p className="text-ink">We couldn&apos;t start the exam. Check your connection and try again.</p>
        <ButtonLink href="/mock-exams" variant="secondary" className="mt-4">
          Back to mock exams
        </ButtonLink>
      </Card>
    );
  }
  if (!questions || !ids || !store.ready) return <Skeleton className="h-[520px]" />;
  if (questions.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-ink">There are no questions available for a mock exam yet.</p>
        <ButtonLink href="/mock-exams" variant="secondary" className="mt-4">
          Back to mock exams
        </ButtonLink>
      </Card>
    );
  }
  if (result) return <Results result={result.summary} grades={result.grades} questions={questions} />;

  const q = questions[index];
  const answeredCount = Object.keys(answers).length;
  const lowTime = remaining <= 60;

  return (
    <div className="mx-auto max-w-5xl">
      <div className="sticky top-14 z-20 -mx-4 mb-5 border-b border-line bg-canvas/90 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:top-0 lg:-mx-10 lg:px-10">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink">{blueprint.name}</p>
            <p className="text-xs text-ink-muted">
              {answeredCount} of {ids.length} answered
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-mono text-sm tabular-nums",
                lowTime ? "bg-danger-soft text-danger" : "bg-surface text-ink ring-1 ring-line",
              )}
              role="timer"
              aria-label={`Time remaining ${fmt(remaining)}`}
            >
              <Clock className="size-4" aria-hidden /> {fmt(remaining)}
            </span>
            <Button onClick={() => setConfirming(true)} className="h-9">
              Submit
            </Button>
          </div>
        </div>
        <div className="mt-3">
          <ProgressBar value={(answeredCount / ids.length) * 100} label="Questions answered" />
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_220px]">
        <Card className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-5 py-3.5 sm:px-7">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium tabular-nums text-ink">Question {index + 1}</span>
              <SourceBadge origin={q.origin} />
            </div>
            <button
              type="button"
              onClick={() => setFlags((f) => (f.includes(q.id) ? f.filter((x) => x !== q.id) : [...f, q.id]))}
              aria-pressed={flags.includes(q.id)}
              title="Flag for review"
              className={cn(
                "inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium",
                flags.includes(q.id) ? "bg-warning-soft text-warning" : "text-ink-muted hover:bg-sunken",
              )}
            >
              <Flag className="size-4" aria-hidden /> {flags.includes(q.id) ? "Flagged" : "Flag"}
            </button>
          </div>
          <div className="px-5 py-6 sm:px-7 sm:py-8">
            <p className="font-serif text-[1.13rem] leading-[1.7] text-ink sm:text-[1.2rem]">{q.stemEn}</p>
            {store.showRussian && q.stemRu && (
              <p lang="ru" className="mt-3 border-l-2 border-accent-line pl-3 font-serif text-[0.98rem] leading-relaxed text-ink-muted">
                {q.stemRu}
              </p>
            )}
            <fieldset className="mt-6 space-y-2.5">
              <legend className="sr-only">Choose one answer</legend>
              {q.options.map((o) => {
                const on = answers[q.id] === o.id;
                return (
                  <label
                    key={o.id}
                    className={cn(
                      "flex cursor-pointer items-start gap-3.5 rounded-xl border px-4 py-3.5 transition-colors",
                      on ? "border-accent bg-accent-soft/60" : "border-line hover:border-line-strong hover:bg-sunken/50",
                    )}
                  >
                    <input
                      type="radio"
                      name={`mock-${q.id}`}
                      checked={on}
                      onChange={() => setAnswers((a) => ({ ...a, [q.id]: o.id }))}
                      className="sr-only"
                    />
                    <span
                      className={cn(
                        "mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg border text-xs font-semibold",
                        on ? "border-accent bg-accent text-white" : "border-line-strong text-ink-soft",
                      )}
                    >
                      {o.id}
                    </span>
                    <span className="pt-0.5">
                      <span className="block text-[0.95rem] leading-snug text-ink">{o.textEn}</span>
                      {store.showRussian && o.textRu && (
                        <span lang="ru" className="mt-0.5 block text-[0.85rem] text-ink-muted">
                          {o.textRu}
                        </span>
                      )}
                    </span>
                  </label>
                );
              })}
            </fieldset>
            <div className="mt-7 flex justify-between">
              <Button variant="secondary" onClick={() => setIndex((i) => i - 1)} disabled={index === 0}>
                <ArrowLeft className="size-4" aria-hidden /> Previous
              </Button>
              {index < ids.length - 1 ? (
                <Button onClick={() => setIndex((i) => i + 1)}>
                  Next <ArrowRight className="size-4" aria-hidden />
                </Button>
              ) : (
                <Button onClick={() => setConfirming(true)}>Review &amp; submit</Button>
              )}
            </div>
          </div>
        </Card>

        <Card className="h-fit p-4 lg:sticky lg:top-36">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.1em] text-ink-muted">Navigator</p>
          <div className="grid grid-cols-6 gap-1.5 lg:grid-cols-5">
            {ids.map((id, i) => (
              <button
                key={id}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Question ${i + 1}${answers[id] ? ", answered" : ""}${flags.includes(id) ? ", flagged" : ""}`}
                aria-current={i === index ? "step" : undefined}
                className={cn(
                  "relative grid aspect-square place-items-center rounded-lg border text-xs tabular-nums",
                  answers[id] ? "border-accent-line bg-accent-soft text-accent-strong" : "border-line text-ink-muted",
                  i === index && "ring-2 ring-accent ring-offset-1",
                )}
              >
                {i + 1}
                {flags.includes(id) && <span className="absolute right-0.5 top-0.5 size-1.5 rounded-full bg-[#d97706]" />}
              </button>
            ))}
          </div>
          <div className="mt-4 space-y-1.5 text-xs text-ink-muted">
            <p className="flex items-center gap-2">
              <span className="size-3 rounded border border-accent-line bg-accent-soft" /> Answered
            </p>
            <p className="flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-[#d97706]" /> Flagged
            </p>
          </div>
        </Card>
      </div>

      {confirming && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
          <button type="button" aria-label="Cancel" className="absolute inset-0 bg-ink/30" onClick={() => setConfirming(false)} />
          <Card className="relative w-full max-w-sm p-6">
            <h2 id="confirm-title" className="text-lg font-semibold text-ink">
              Submit exam?
            </h2>
            <p className="mt-2 text-sm text-ink-muted">
              {answeredCount < ids.length
                ? `${ids.length - answeredCount} unanswered question${ids.length - answeredCount === 1 ? "" : "s"} will be marked wrong.`
                : "All questions answered."}
              {flags.length > 0 && ` ${flags.length} flagged.`}
            </p>
            {submitError && (
              <p role="alert" className="mt-3 text-sm text-danger">
                {submitError}
              </p>
            )}
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setConfirming(false)}>
                Keep going
              </Button>
              <Button onClick={submit} disabled={submitting}>
                {submitting ? "Submitting…" : "Submit"}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

function Results({ result, grades, questions }: { result: MockSummary; grades: MockGrade[]; questions: Question[] }) {
  const pct = Math.round((result.score / result.total) * 100);
  const blueprint = blueprints.find((b) => b.id === result.blueprintId)!;

  const questionById = useMemo(() => new Map(questions.map((q) => [q.id, q])), [questions]);
  const topicName = (slug: string) => questions.find((q) => q.topic === slug)?.topicName ?? slug;

  const byTopic = useMemo(() => {
    const m = new Map<string, { correct: number; total: number }>();
    for (const g of grades) {
      const cur = m.get(g.topic) ?? { correct: 0, total: 0 };
      cur.total++;
      if (g.isCorrect) cur.correct++;
      m.set(g.topic, cur);
    }
    return [...m.entries()].sort((a, b) => a[1].correct / a[1].total - b[1].correct / b[1].total);
  }, [grades]);

  return (
    <div className="mx-auto max-w-3xl">
      <Card className="p-7 text-center sm:p-10">
        <Badge tone="warning" className="mb-4">
          Demo format · not an official result
        </Badge>
        <p className="text-5xl font-semibold tracking-tight tabular-nums text-ink">{pct}%</p>
        <p className="mt-2 text-ink-muted">
          {result.score} of {result.total} correct · {Math.floor(result.durationSec / 60)} min {result.durationSec % 60} s
        </p>
        <p className={cn("mt-4 inline-flex items-center gap-1.5 text-sm font-medium", result.passed ? "text-success" : "text-danger")}>
          {result.passed ? <CircleCheck className="size-4" /> : <CircleX className="size-4" />}
          {result.passed ? "Above" : "Below"} the demo pass mark of {blueprint.passThresholdPct}%
        </p>
        <div className="mt-7 flex flex-col justify-center gap-2 sm:flex-row">
          <ButtonLink href="/mock-exams">Back to mock exams</ButtonLink>
          <ButtonLink href="/review/mistakes" variant="secondary">
            Review mistakes
          </ButtonLink>
        </div>
      </Card>

      <Card className="mt-4 p-6">
        <h2 className="font-semibold text-ink">By topic</h2>
        <ul className="mt-4 space-y-3">
          {byTopic.map(([slug, v]) => (
            <li key={slug} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1.5 text-sm">
              <span className="text-ink-soft">{topicName(slug)}</span>
              <span className="tabular-nums text-ink">
                {v.correct}/{v.total}
              </span>
              <div className="col-span-2">
                <ProgressBar value={(v.correct / v.total) * 100} label={`${topicName(slug)} score`} />
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <h2 className="mb-3 mt-8 flex items-center gap-2 text-sm font-semibold text-ink">
        <Info className="size-4 text-ink-muted" aria-hidden /> Answer review
      </h2>
      <Card className="divide-y divide-line">
        {grades.map((g, i) => {
          const id = g.questionId;
          const q = questionById.get(id)!;
          const key = { correct: g.correct, explanationEn: g.explanationEn };
          const mine = g.selected;
          const ok = g.isCorrect;
          return (
            <details key={id} className="group px-5 py-4">
              <summary className="flex cursor-pointer list-none items-start gap-3">
                {ok ? (
                  <CircleCheck className="mt-0.5 size-5 shrink-0 text-success" aria-label="Correct" />
                ) : (
                  <CircleX className="mt-0.5 size-5 shrink-0 text-danger" aria-label="Incorrect" />
                )}
                <span className="line-clamp-2 text-sm text-ink-soft group-open:line-clamp-none">
                  <span className="tabular-nums text-ink-muted">{i + 1}. </span>
                  {q.stemEn}
                </span>
              </summary>
              <div className="ml-8 mt-3 space-y-2 text-sm">
                <p className="text-ink-muted">
                  Your answer:{" "}
                  <span className={ok ? "text-success" : "text-danger"}>
                    {mine ? `${mine} — ${q.options.find((o) => o.id === mine)?.textEn}` : "not answered"}
                  </span>
                </p>
                {!ok && (
                  <p className="text-ink-muted">
                    Correct: <span className="text-success">{key.correct} — {q.options.find((o) => o.id === key.correct)?.textEn}</span>
                  </p>
                )}
                <p className="font-serif leading-relaxed text-ink-soft">{key.explanationEn}</p>
                <Link href={`/questions/${id}`} className="inline-block text-accent hover:underline">
                  Open question
                </Link>
              </div>
            </details>
          );
        })}
      </Card>
    </div>
  );
}
