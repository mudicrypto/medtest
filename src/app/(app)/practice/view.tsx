"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Languages } from "lucide-react";
import { useDemoStore } from "@/lib/demo-store";
import { topicStats } from "@/lib/analytics";
import { topics } from "@/demo/topics";
import { questionById, questions } from "@/demo/questions";
import { Button, Card, PageHeader, cn } from "@/components/ui";

const sizes = [5, 10, 20] as const;

export function PracticeView() {
  const router = useRouter();
  const store = useDemoStore();
  const [picked, setPicked] = useState<string[]>([]);
  const [size, setSize] = useState<(typeof sizes)[number]>(10);

  const stats = Object.fromEntries(topicStats(store.attempts, topics, questionById).map((t) => [t.slug, t]));
  const available = questions.filter((q) => picked.length === 0 || picked.includes(q.topic)).length;

  function toggle(slug: string) {
    setPicked((p) => (p.includes(slug) ? p.filter((x) => x !== slug) : [...p, slug]));
  }

  function start() {
    const params = new URLSearchParams({ n: String(size) });
    if (picked.length) params.set("topics", picked.join(","));
    router.push(`/practice/session?${params}`);
  }

  return (
    <>
      <PageHeader
        eyebrow="Question bank"
        title="Practice"
        description="Pick one or more topics — or leave them all unselected for a mixed set. You'll see the answer and explanation after each question."
      />

      <Card className="p-5 sm:p-7">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink">Topics</h2>
          {picked.length > 0 && (
            <button type="button" onClick={() => setPicked([])} className="text-sm text-accent hover:underline">
              Clear
            </button>
          )}
        </div>
        <div className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {topics.map((t) => {
            const on = picked.includes(t.slug);
            const st = stats[t.slug];
            const count = questions.filter((q) => q.topic === t.slug).length;
            return (
              <button
                key={t.slug}
                type="button"
                onClick={() => toggle(t.slug)}
                aria-pressed={on}
                className={cn(
                  "flex items-start gap-3 rounded-xl border p-3.5 text-left transition-colors",
                  on ? "border-accent bg-accent-soft/60" : "border-line hover:border-line-strong hover:bg-sunken/50",
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
                    {count} questions
                    {store.ready && st?.accuracy !== null && st ? ` · ${st.accuracy}% correct` : ""}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

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
            <Button onClick={start} className="h-11 px-6">
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
