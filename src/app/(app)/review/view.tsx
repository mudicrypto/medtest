"use client";

import { useEffect, useState } from "react";
import { ArrowRight, CalendarClock, CircleCheck } from "lucide-react";
import { useProgress } from "@/lib/progress-store";
import { isDue } from "@/lib/srs";
import { terms } from "@/demo/terms";
import { useQuestions } from "@/lib/use-questions";
import { PracticeQuestion } from "@/components/question-card";
import { TermFlashcard } from "@/components/flashcard";
import { Button, ButtonLink, EmptyState, PageHeader, ProgressBar, Skeleton } from "@/components/ui";

const termById = Object.fromEntries(terms.map((t) => [t.id, t]));

export function ReviewView() {
  const store = useProgress();
  const [queue, setQueue] = useState<string[] | null>(null);
  const [index, setIndex] = useState(0);

  // Snapshot what's due when the page opens; grading pushes cards into the future.
  useEffect(() => {
    if (!store.ready || queue) return;
    const due = Object.entries(store.cards)
      .filter(([id, c]) => isDue(c, store.now) && (id.startsWith("q:") || termById[id.slice(2)]))
      .sort(([, a], [, b]) => a.due - b.due)
      .map(([id]) => id);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- snapshot queue once data is loaded
    setQueue(due);
  }, [store.ready, store.cards, store.now, queue]);

  return <ReviewQueue queue={queue} index={index} setIndex={setIndex} />;
}

function ReviewQueue({
  queue: snapshot,
  index,
  setIndex,
}: {
  queue: string[] | null;
  index: number;
  setIndex: React.Dispatch<React.SetStateAction<number>>;
}) {
  const store = useProgress();
  // Load the due questions from the server; drop any no longer available.
  const questionIds = snapshot ? snapshot.filter((id) => id.startsWith("q:")).map((id) => id.slice(2)) : null;
  const loaded = useQuestions(questionIds);

  if (!snapshot || loaded.status === "loading") return <Skeleton className="h-[480px]" />;
  const questionById = loaded.status === "ready" ? new Map(loaded.questions.map((q) => [q.id, q])) : new Map();
  const queue = snapshot.filter((id) => !id.startsWith("q:") || questionById.has(id.slice(2)));

  const header = (
    <PageHeader
      eyebrow="Spaced repetition"
      title="Daily review"
      description="Items come back just before you're likely to forget them. Questions you miss return soon; ones you know well return after longer gaps."
    />
  );

  if (queue.length === 0 || index >= queue.length) {
    const finished = queue.length > 0;
    return (
      <>
        {header}
        <EmptyState
          icon={finished ? <CircleCheck className="size-6" /> : <CalendarClock className="size-6" />}
          title={finished ? "Review complete" : "Nothing due right now"}
        >
          <p>
            {finished
              ? `You reviewed ${queue.length} items. New reviews will appear as they come due.`
              : "Answer new questions or study terms to build your queue."}
          </p>
          <div className="mt-5 flex justify-center gap-2">
            <ButtonLink href="/practice">Practise new questions</ButtonLink>
            <ButtonLink href="/dashboard" variant="secondary">
              Dashboard
            </ButtonLink>
          </div>
        </EmptyState>
      </>
    );
  }

  const id = queue[index];
  const next = () => setIndex((i) => i + 1);
  const isQuestion = id.startsWith("q:");

  return (
    <div className="mx-auto max-w-3xl">
      {header}
      <div className="mb-5 flex items-center gap-4">
        <div className="flex-1">
          <ProgressBar value={(index / queue.length) * 100} label="Review progress" />
        </div>
        <span className="shrink-0 text-sm tabular-nums text-ink-muted">
          {index + 1} / {queue.length}
        </span>
      </div>
      {isQuestion ? (
        <PracticeQuestion
          key={id}
          question={questionById.get(id.slice(2))!}
          mode="review"
          footer={(answered) =>
            answered && (
              <Button onClick={next} autoFocus>
                Continue <ArrowRight className="size-4" aria-hidden />
              </Button>
            )
          }
        />
      ) : (
        <TermFlashcard
          key={id}
          term={termById[id.slice(2)]}
          card={store.cards[id]}
          now={store.now}
          onGrade={(g) => {
            store.gradeCard(id, g);
            next();
          }}
        />
      )}
    </div>
  );
}
