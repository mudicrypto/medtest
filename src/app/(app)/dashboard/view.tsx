"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, Flame, Languages, RotateCcw, Sparkles, Target, Timer } from "lucide-react";
import { useDemoStore } from "@/lib/demo-store";
import { dailyStats, openMistakes, overallAccuracy, streakDays, topicStats } from "@/lib/analytics";
import { isDue } from "@/lib/srs";
import { topics } from "@/demo/topics";
import { questionById } from "@/demo/questions";
import { ButtonLink, Card, PageHeader, ProgressBar, Skeleton, StatTile } from "@/components/ui";
import { VolumeColumns } from "@/components/charts";

export function DashboardView({ greeting }: { greeting: React.ReactNode }) {
  const s = useDemoStore();
  if (!s.ready) return <DashboardSkeleton />;

  const dueQuestions = Object.entries(s.cards).filter(([id, c]) => id.startsWith("q:") && isDue(c, s.now)).length;
  const dueTerms = Object.entries(s.cards).filter(([id, c]) => id.startsWith("t:") && isDue(c, s.now)).length;
  const acc = overallAccuracy(s.attempts);
  const streak = streakDays(s.attempts, s.now);
  const days = dailyStats(s.attempts, 14, s.now);
  const weakest = topicStats(s.attempts, topics, questionById)
    .filter((t) => t.accuracy !== null)
    .sort((a, b) => a.accuracy! - b.accuracy!)
    .slice(0, 3);
  const mistakes = openMistakes(s.attempts).length;
  const answeredToday = days[days.length - 1].answered;
  const dailyGoal = 20;

  return (
    <>
      <PageHeader
        eyebrow="Dashboard"
        title={greeting}
        description="Here's what to focus on today. Start with your review queue — it takes the least time and protects what you've already learned."
      />

      <section aria-label="Today" className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card className="relative overflow-hidden p-6 sm:p-7">
          <div className="absolute -right-16 -top-16 size-56 rounded-full bg-accent-soft/70 blur-2xl" aria-hidden />
          <div className="relative">
            <p className="flex items-center gap-2 text-sm font-medium text-accent">
              <RotateCcw className="size-4" aria-hidden /> Daily review
            </p>
            <p className="mt-3 text-4xl font-semibold tracking-tight tabular-nums text-ink">
              {dueQuestions + dueTerms}
              <span className="ml-2 text-base font-normal text-ink-muted">items due</span>
            </p>
            <p className="mt-1 text-sm text-ink-muted">
              {dueQuestions} questions · {dueTerms} terms · about {Math.max(1, Math.round((dueQuestions + dueTerms) * 0.75))} min
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <ButtonLink href="/review">
                Start review <ArrowRight className="size-4" aria-hidden />
              </ButtonLink>
              <ButtonLink href="/practice" variant="secondary">
                New questions
              </ButtonLink>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-ink">Today&apos;s goal</p>
            <p className="text-sm tabular-nums text-ink-muted">
              {Math.min(answeredToday, dailyGoal)} / {dailyGoal}
            </p>
          </div>
          <div className="mt-3">
            <ProgressBar value={(answeredToday / dailyGoal) * 100} label="Daily question goal" />
          </div>
          <p className="mb-3 mt-6 text-xs text-ink-muted">Questions answered · last 14 days</p>
          <VolumeColumns days={days} />
        </Card>
      </section>

      <section aria-label="Key numbers" className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile label="Overall accuracy" value={acc === null ? "—" : `${acc}%`} hint={`${s.attempts.length} answers`} />
        <StatTile
          label="Study streak"
          value={
            <span className="inline-flex items-center gap-1.5">
              {streak}
              <Flame className="size-6 text-[#d97706]" aria-hidden />
            </span>
          }
          hint={streak === 1 ? "day" : "days in a row"}
        />
        <StatTile label="Open mistakes" value={mistakes} hint={<Link href="/review/mistakes" className="text-accent hover:underline">Review them</Link>} />
        <StatTile label="Bookmarked" value={s.bookmarks.length} hint={<Link href="/bookmarks" className="text-accent hover:underline">Open bookmarks</Link>} />
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-semibold text-ink">
              <Target className="size-4 text-accent" aria-hidden /> Focus topics
            </h2>
            <Link href="/analytics" className="text-sm text-accent hover:underline">
              All topics
            </Link>
          </div>
          <p className="mt-1 text-sm text-ink-muted">Your three lowest-scoring topics.</p>
          <ul className="mt-5 space-y-4">
            {weakest.map((t) => (
              <li key={t.slug} className="flex items-center gap-4">
                <div className="min-w-0 flex-1">
                  <div className="mb-1.5 flex justify-between text-sm">
                    <span className="text-ink-soft">{t.name}</span>
                    <span className="tabular-nums text-ink">{t.accuracy}%</span>
                  </div>
                  <ProgressBar value={t.accuracy!} label={`${t.name} accuracy`} />
                </div>
                <ButtonLink href={`/practice/session?topics=${t.slug}`} variant="secondary" className="h-8 px-3 text-xs">
                  Practise
                </ButtonLink>
              </li>
            ))}
          </ul>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2">
          <QuickLink href="/mock-exams" icon={<Timer className="size-5" />} title="Mock exam" text="Timed, no feedback until you submit." />
          <QuickLink href="/terminology" icon={<Languages className="size-5" />} title="Terminology" text="Russian ↔ English flashcards." />
          <QuickLink href="/practice" icon={<BookOpen className="size-5" />} title="Question bank" text={`${Object.keys(questionById).length} demo questions in ${topics.length} topics.`} />
          <QuickLink href="/tutor" icon={<Sparkles className="size-5" />} title="AI tutor" text="Ask about a topic or your study plan." />
        </div>
      </section>
    </>
  );
}

function QuickLink({ href, icon, title, text }: { href: string; icon: React.ReactNode; title: string; text: string }) {
  return (
    <Link href={href} className="group">
      <Card className="h-full p-5 transition-shadow group-hover:shadow-[var(--shadow-lift)]">
        <span className="grid size-10 place-items-center rounded-xl bg-accent-soft text-accent">{icon}</span>
        <p className="mt-4 flex items-center gap-1 font-medium text-ink">
          {title}
          <ArrowRight className="size-4 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" aria-hidden />
        </p>
        <p className="mt-0.5 text-sm text-ink-muted">{text}</p>
      </Card>
    </Link>
  );
}

function DashboardSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading dashboard">
      <Skeleton className="mb-8 h-16 w-2/3" />
      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Skeleton className="h-56" />
        <Skeleton className="h-56" />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
    </div>
  );
}
