"use client";

import { useProgress } from "@/lib/progress-store";
import { dailyStats, overallAccuracy, streakDays, topicStats } from "@/lib/analytics";
import type { TopicWithCount } from "@/lib/types";
import { AccuracyTrend, TopicBars, VolumeColumns } from "@/components/charts";
import { Card, PageHeader, Skeleton, StatTile } from "@/components/ui";

export function AnalyticsView({ topics }: { topics: TopicWithCount[] }) {
  const s = useProgress();
  if (!s.ready) return <Skeleton className="h-[600px]" />;

  const days = dailyStats(s.attempts, 14, s.now);
  const last7 = s.attempts.filter((a) => a.at > s.now - 7 * 86_400_000);
  const prev7 = s.attempts.filter((a) => a.at <= s.now - 7 * 86_400_000 && a.at > s.now - 14 * 86_400_000);
  const accNow = overallAccuracy(last7);
  const accPrev = overallAccuracy(prev7);
  const delta = accNow !== null && accPrev !== null ? accNow - accPrev : null;
  const seen = new Set(s.attempts.map((a) => a.questionId)).size;
  const bankSize = Math.max(1, topics.reduce((n, t) => n + t.questionCount, 0));

  return (
    <>
      <PageHeader
        eyebrow="Analytics"
        title="Your progress"
        description="Based on every answer you've given, saved to your account."
      />

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile
          label="Accuracy · last 7 days"
          value={accNow === null ? "—" : `${accNow}%`}
          hint={delta === null ? "No previous week" : `${delta >= 0 ? "▲" : "▼"} ${Math.abs(delta)} pts vs previous 7 days`}
        />
        <StatTile label="Questions answered" value={s.attempts.length} hint={`${last7.length} this week`} />
        <StatTile label="Bank coverage" value={`${Math.min(100, Math.round((seen / bankSize) * 100))}%`} hint={`${seen} of ${bankSize} questions seen`} />
        <StatTile label="Study streak" value={streakDays(s.attempts, s.now)} hint="days in a row" />
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <Card className="p-6">
          <h2 className="font-semibold text-ink">Daily accuracy</h2>
          <p className="mb-4 text-sm text-ink-muted">Last 14 days · gaps are days without practice</p>
          <AccuracyTrend days={days} />
        </Card>
        <Card className="p-6">
          <h2 className="font-semibold text-ink">Questions per day</h2>
          <p className="mb-6 text-sm text-ink-muted">Last 14 days</p>
          <VolumeColumns days={days} />
        </Card>
      </section>

      <Card className="mt-4 p-6">
        <h2 className="font-semibold text-ink">Accuracy by specialty</h2>
        <p className="mb-6 text-sm text-ink-muted">Weakest first — this is where practice pays off most.</p>
        <TopicBars stats={topicStats(s.attempts, topics)} />
      </Card>

    </>
  );
}
