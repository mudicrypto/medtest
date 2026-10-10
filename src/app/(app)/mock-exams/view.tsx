"use client";

import Link from "next/link";
import { ArrowRight, Clock, Info, ListChecks, Target } from "lucide-react";
import { useProgress } from "@/lib/progress-store";
import { blueprints } from "@/demo/blueprints";
import { Badge, ButtonLink, Card, PageHeader } from "@/components/ui";

export function MockExamsView() {
  const store = useProgress();

  return (
    <>
      <PageHeader
        eyebrow="Exam simulation"
        title="Mock exams"
        description="Timed sets with no feedback until you submit — closer to exam conditions than practice mode."
      />

      <div className="mb-6 flex gap-3 rounded-xl border border-[#fedf89] bg-warning-soft p-4 text-sm text-warning">
        <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
        <p>
          These are <strong>demo formats</strong> for trying the exam runner. The real mock format (number of
          questions, time limit, pass mark) will be configured from the current official rules, with a source
          link and a &ldquo;last verified&rdquo; date shown here.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {blueprints.map((b) => (
          <Card key={b.id} className="flex flex-col p-6">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-lg font-semibold text-ink">{b.name}</h2>
              {b.isDemo && <Badge tone="warning">Demo format</Badge>}
            </div>
            <dl className="mt-4 grid grid-cols-3 gap-3 text-sm">
              <div>
                <dt className="flex items-center gap-1.5 text-ink-muted">
                  <ListChecks className="size-4" aria-hidden /> Questions
                </dt>
                <dd className="mt-0.5 font-medium tabular-nums text-ink">{b.questionCount}</dd>
              </div>
              <div>
                <dt className="flex items-center gap-1.5 text-ink-muted">
                  <Clock className="size-4" aria-hidden /> Time
                </dt>
                <dd className="mt-0.5 font-medium tabular-nums text-ink">{b.timeLimitMinutes} min</dd>
              </div>
              <div>
                <dt className="flex items-center gap-1.5 text-ink-muted">
                  <Target className="size-4" aria-hidden /> Pass
                </dt>
                <dd className="mt-0.5 font-medium tabular-nums text-ink">{b.passThresholdPct}%</dd>
              </div>
            </dl>
            <p className="mt-4 text-sm text-ink-muted">{b.note}</p>
            <ButtonLink href={`/mock-exams/run?b=${b.id}`} className="mt-6 self-start">
              Start exam <ArrowRight className="size-4" aria-hidden />
            </ButtonLink>
          </Card>
        ))}
      </div>

      <h2 className="mb-3 mt-10 text-sm font-semibold text-ink">Past attempts</h2>
      {store.ready && store.mocks.length > 0 ? (
        <Card className="divide-y divide-line">
          {store.mocks.map((m) => {
            const b = blueprints.find((x) => x.id === m.blueprintId);
            return (
              <div key={m.submittedAt} className="flex items-center justify-between gap-4 px-5 py-4">
                <div>
                  <p className="text-sm font-medium text-ink">{b?.name ?? m.blueprintId}</p>
                  <p className="text-xs text-ink-muted">
                    {new Date(m.submittedAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })} ·{" "}
                    {Math.round(m.durationSec / 60)} min
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm tabular-nums text-ink">
                    {m.score}/{m.total} · {Math.round((m.score / m.total) * 100)}%
                  </span>
                  <Badge tone={m.passed ? "success" : "danger"}>{m.passed ? "Passed" : "Below pass mark"}</Badge>
                </div>
              </div>
            );
          })}
        </Card>
      ) : (
        <Card className="px-5 py-8 text-center text-sm text-ink-muted">
          No attempts yet. Your results will appear here. <Link href="/mock-exams/run?b=demo-quick" className="text-accent hover:underline">Try the quick demo mock.</Link>
        </Card>
      )}
    </>
  );
}
