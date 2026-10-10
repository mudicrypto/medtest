"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Languages } from "lucide-react";
import { useProgress } from "@/lib/progress-store";
import { topicStats } from "@/lib/analytics";
import type { TopicWithCount } from "@/lib/types";
import type { QuestionRef } from "@/lib/content/queries";
import { Button, Card, cn } from "@/components/ui";

const sizes = [5, 10, 20] as const;

export function PracticeView({ specialties: all, refs }: { specialties: TopicWithCount[]; refs: QuestionRef[] }) {
  const router = useRouter();
  const store = useProgress();
  const [picked, setPicked] = useState<string[]>([]);
  const [pickedTopics, setPickedTopics] = useState<string[]>([]);
  const [size, setSize] = useState<(typeof sizes)[number]>(10);

  // Only specialties that currently have questions.
  const specialties = all.filter((t) => t.questionCount > 0);
  const stats = Object.fromEntries(topicStats(store.attempts, specialties).map((t) => [t.slug, t]));
  const inSpecialties = refs.filter((r) => picked.length === 0 || picked.includes(r.specialty));
  // Topics within the chosen specialties, with how many questions each has.
  const topicCounts = new Map<string, number>();
  for (const r of inSpecialties) if (r.topic) topicCounts.set(r.topic, (topicCounts.get(r.topic) ?? 0) + 1);
  const topics = [...topicCounts.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  const activeTopics = pickedTopics.filter((t) => topicCounts.has(t));
  const available = inSpecialties.filter((r) => activeTopics.length === 0 || activeTopics.includes(r.topic)).length;

  function toggle(slug: string) {
    setPicked((p) => (p.includes(slug) ? p.filter((x) => x !== slug) : [...p, slug]));
  }

  function toggleTopic(topic: string) {
    setPickedTopics((p) => (p.includes(topic) ? p.filter((x) => x !== topic) : [...p, topic]));
  }

  function start() {
    const params = new URLSearchParams({ n: String(size) });
    if (picked.length) params.set("specialties", picked.join(","));
    for (const t of activeTopics) params.append("topic", t);
    router.push(`/practice/session?${params}`);
  }

  return (
    <>
      <Card className="p-5 sm:p-7">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink">Specialties</h2>
          {(picked.length > 0 || activeTopics.length > 0) && (
            <button
              type="button"
              onClick={() => {
                setPicked([]);
                setPickedTopics([]);
              }}
              className="text-sm text-accent hover:underline"
            >
              Clear
            </button>
          )}
        </div>
        <div className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {specialties.map((t) => {
            const on = picked.includes(t.slug);
            const st = stats[t.slug];
            const count = t.questionCount;
            return (
              <button
                key={t.slug}
                type="button"
                onClick={() => toggle(t.slug)}
                disabled={count === 0}
                aria-pressed={on}
                className={cn(
                  "flex items-start gap-3 rounded-xl border p-3.5 text-left transition-colors",
                  on ? "border-accent bg-accent-soft/60" : "border-line hover:border-line-strong hover:bg-sunken/50",
                  "disabled:cursor-not-allowed disabled:opacity-50",
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border",
                    on ? "border-accent bg-accent text-white" : "border-line-strong",
                  )}
                >
                  {on && <Check className="size-3.5" aria-hidden />}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-ink">{t.nameEn}</span>
                  <span lang="ru" className="block text-xs text-ink-muted">
                    {t.nameRu}
                  </span>
                  <span className="mt-1.5 block text-xs text-ink-muted">
                    {count} {count === 1 ? "question" : "questions"}
                    {store.ready && st?.accuracy !== null && st ? ` · ${st.accuracy}% correct` : ""}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        {topics.length > 0 && (
          <div className="mt-6">
            <h2 className="text-sm font-semibold text-ink">
              Topics <span className="font-normal text-ink-muted">(optional)</span>
            </h2>
            <p className="mt-0.5 text-xs text-ink-muted">Narrow down further, or leave empty for every topic.</p>
            <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Topics">
              {topics.map(([topic, count]) => {
                const on = activeTopics.includes(topic);
                return (
                  <button
                    key={topic}
                    type="button"
                    onClick={() => toggleTopic(topic)}
                    aria-pressed={on}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-sm transition-colors",
                      on ? "border-accent bg-accent text-white" : "border-line text-ink-soft hover:border-line-strong hover:bg-sunken/50",
                    )}
                  >
                    {topic} <span className={on ? "text-white/80" : "text-ink-muted"}>· {count}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-8 flex flex-col gap-6 border-t border-line pt-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-wrap gap-8">
            <div>
              <h2 className="mb-2 text-sm font-semibold text-ink">Questions</h2>
              <div className="inline-flex rounded-lg border border-line bg-sunken p-0.5" role="radiogroup" aria-label="Number of questions">
                {sizes.map((n) => (
                  <button
                    key={n}
                    type="button"
                    role="radio"
                    aria-checked={size === n}
                    onClick={() => setSize(n)}
                    className={cn(
                      "h-8 rounded-md px-4 text-sm tabular-nums",
                      size === n ? "bg-surface font-medium text-ink shadow-sm" : "text-ink-muted hover:text-ink",
                    )}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <h2 className="mb-2 text-sm font-semibold text-ink">Russian text</h2>
              <button
                type="button"
                role="switch"
                aria-checked={store.showRussian}
                onClick={() => store.setShowRussian(!store.showRussian)}
                className="inline-flex h-9 items-center gap-2.5 text-sm text-ink-soft"
              >
                <span className={cn("relative h-5 w-9 rounded-full transition-colors", store.showRussian ? "bg-accent" : "bg-line-strong")}>
                  <span
                    className={cn(
                      "absolute top-0.5 size-4 rounded-full bg-white shadow transition-transform",
                      store.showRussian ? "translate-x-4.5" : "translate-x-0.5",
                    )}
                  />
                </span>
                <Languages className="size-4" aria-hidden /> Show alongside English
              </button>
            </div>
          </div>
          <div className="flex flex-col items-stretch gap-1.5 sm:items-end">
            <Button onClick={start} disabled={available === 0} className="h-11 px-6">
              Start practice <ArrowRight className="size-4" aria-hidden />
            </Button>
            <p className="text-center text-xs text-ink-muted sm:text-right">
              {Math.min(size, available)} of {available} available questions
            </p>
          </div>
        </div>
      </Card>
    </>
  );
}
