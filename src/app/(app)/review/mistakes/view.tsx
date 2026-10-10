"use client";

import { CircleCheck, RotateCcw } from "lucide-react";
import { useDemoStore } from "@/lib/demo-store";
import { openMistakes } from "@/lib/analytics";
import { QuestionList } from "@/components/question-list";
import { ButtonLink, EmptyState, PageHeader, Skeleton } from "@/components/ui";

export function MistakesView() {
  const store = useDemoStore();
  if (!store.ready) return <Skeleton className="h-96" />;

  const ids = openMistakes(store.attempts);
  const misses = (id: string) => store.attempts.filter((a) => a.questionId === id && !a.correct).length;

  return (
    <>
      <PageHeader
        eyebrow="Mistake review"
        title="Mistakes"
        description="Questions where your most recent answer was wrong. Answer one correctly and it leaves this list."
        actions={
          ids.length > 0 && (
            <ButtonLink href={`/practice/session?mode=review&ids=${ids.join(",")}`}>
              <RotateCcw className="size-4" aria-hidden /> Retry all {ids.length}
            </ButtonLink>
          )
        }
      />
      {ids.length ? (
        <QuestionList
          ids={ids}
          meta={(id) => (
            <span className="text-xs text-danger">
              Missed {misses(id)} {misses(id) === 1 ? "time" : "times"}
            </span>
          )}
        />
      ) : (
        <EmptyState icon={<CircleCheck className="size-6" />} title="No open mistakes">
          Nice work. Mistakes from practice and mock exams will collect here.
        </EmptyState>
      )}
    </>
  );
}
