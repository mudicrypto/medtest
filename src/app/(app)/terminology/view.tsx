"use client";

import { useMemo, useState } from "react";
import { CircleCheck, Search } from "lucide-react";
import { useProgress } from "@/lib/progress-store";
import { isDue } from "@/lib/srs";
import { terms } from "@/demo/terms";
import { topicBySlug } from "@/demo/topics";
import { TermFlashcard } from "@/components/flashcard";
import { Card, PageHeader, Skeleton, cn } from "@/components/ui";

type Tab = "study" | "browse";

export function TerminologyView() {
  const store = useProgress();
  const [tab, setTab] = useState<Tab>("study");
  const [direction, setDirection] = useState<"ru-en" | "en-ru">("ru-en");

  return (
    <>
      <PageHeader
        eyebrow="Russian ↔ English"
        title="Terminology trainer"
        description="Learn the words patients and examiners actually use. Each card is scheduled for review just before you're likely to forget it."
      />

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-lg border border-line bg-sunken p-0.5" role="tablist">
          {(["study", "browse"] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={cn(
                "h-8 rounded-md px-4 text-sm",
                tab === t ? "bg-surface font-medium text-ink shadow-sm" : "text-ink-muted hover:text-ink",
              )}
            >
              {t === "study" ? "Flashcards" : "Word list"}
            </button>
          ))}
        </div>
        {tab === "study" && (
          <button
            type="button"
            onClick={() => setDirection((d) => (d === "ru-en" ? "en-ru" : "ru-en"))}
            className="text-sm text-accent hover:underline"
          >
            Switch to {direction === "ru-en" ? "English → Russian" : "Russian → English"}
          </button>
        )}
      </div>

      {!store.ready ? <Skeleton className="h-96" /> : tab === "study" ? <Study direction={direction} /> : <Browse />}
    </>
  );
}

function Study({ direction }: { direction: "ru-en" | "en-ru" }) {
  const store = useProgress();
  // Due cards first, then new (never-seen) terms. Snapshot once per visit.
  const [queue] = useState(() => {
    const due = terms.filter((t) => store.cards[`t:${t.id}`] && isDue(store.cards[`t:${t.id}`], store.now));
    const fresh = terms.filter((t) => !store.cards[`t:${t.id}`]);
    return [...due, ...fresh].slice(0, 10);
  });
  const [i, setI] = useState(0);

  if (i >= queue.length) {
    return (
      <Card className="flex flex-col items-center px-6 py-14 text-center">
        <span className="mb-4 grid size-12 place-items-center rounded-full bg-accent-soft text-accent">
          <CircleCheck className="size-6" />
        </span>
        <h2 className="font-semibold text-ink">{queue.length ? "Session complete" : "All caught up"}</h2>
        <p className="mt-1.5 max-w-sm text-sm text-ink-muted">
          {queue.length
            ? `You studied ${queue.length} terms. They'll come back in your daily review when they're due.`
            : "No terms are due. Browse the word list or come back tomorrow."}
        </p>
      </Card>
    );
  }

  const term = queue[i];
  const id = `t:${term.id}`;
  return (
    <div className="mx-auto max-w-2xl">
      <p className="mb-3 text-right text-sm tabular-nums text-ink-muted">
        {i + 1} / {queue.length}
      </p>
      <TermFlashcard
        key={`${id}-${direction}`}
        term={term}
        card={store.cards[id]}
        now={store.now}
        direction={direction}
        onGrade={(g) => {
          store.gradeCard(id, g);
          setI((n) => n + 1);
        }}
      />
      <p className="mt-3 text-center text-xs text-ink-muted">Space to reveal · 1–4 to grade</p>
    </div>
  );
}

function Browse() {
  const store = useProgress();
  const [q, setQ] = useState("");
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return s ? terms.filter((t) => t.ru.toLowerCase().includes(s) || t.en.toLowerCase().includes(s)) : terms;
  }, [q]);

  return (
    <>
      <label className="relative mb-4 block">
        <span className="sr-only">Search terms</span>
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-muted" aria-hidden />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search in Russian or English…"
          className="h-11 w-full rounded-xl border border-line bg-surface pl-10 pr-4 text-sm text-ink outline-none placeholder:text-ink-muted focus:border-accent-line"
        />
      </label>
      <Card className="divide-y divide-line overflow-hidden">
        {list.map((t) => {
          const card = store.cards[`t:${t.id}`];
          const status = !card ? "New" : card.reps === 0 ? "Learning" : `Next in ${Math.max(1, Math.round((card.due - store.now) / 86_400_000))}d`;
          return (
            <div key={t.id} className="grid gap-1 px-5 py-3.5 sm:grid-cols-[1fr_1fr_auto] sm:items-center sm:gap-4">
              <div>
                <span lang="ru" className="font-medium text-ink">
                  {t.ru}
                </span>
                <span className="ml-2 font-mono text-xs text-ink-muted">{t.translit}</span>
              </div>
              <span className="text-sm text-ink-soft">{t.en}</span>
              <span className="text-xs text-ink-muted">
                {topicBySlug[t.topic]?.nameEn ?? "General"} · {status}
              </span>
            </div>
          );
        })}
        {list.length === 0 && <p className="px-5 py-8 text-center text-sm text-ink-muted">No matching terms.</p>}
      </Card>
      <p className="mt-3 text-xs text-ink-muted">{terms.length} demo terms · not yet linguistically reviewed</p>
    </>
  );
}

