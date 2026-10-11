"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useQuestions } from "@/lib/use-questions";
import { LoadError } from "./load-error";
import { Badge, Card, Skeleton } from "./ui";

/** Lists questions by id, loading their text from the server. */
export function QuestionList({ ids, meta }: { ids: string[]; meta?: (id: string) => React.ReactNode }) {
  const loaded = useQuestions(ids);
  if (loaded.status === "loading") return <Skeleton className="h-64" />;
  if (loaded.status === "error") return <LoadError message={loaded.message} onRetry={loaded.retry} />;

  const missing = ids.length - loaded.questions.length;
  return (
    <>
      <Card className="divide-y divide-line overflow-hidden">
        {loaded.questions.map((q) => (
          <Link key={q.id} href={`/questions/${q.id}`} className="group flex items-center gap-4 px-5 py-4 hover:bg-sunken/50 sm:px-6">
            <div className="min-w-0 flex-1">
              <div className="mb-1.5 flex flex-wrap items-center gap-2">
                <Badge>{q.topicName}</Badge>
                {meta?.(q.id)}
              </div>
              <p className="line-clamp-2 text-[0.95rem] leading-snug text-ink">{q.stemEn}</p>
            </div>
            <ChevronRight className="size-5 shrink-0 text-ink-muted transition-transform group-hover:translate-x-0.5" aria-hidden />
          </Link>
        ))}
      </Card>
      {missing > 0 && (
        <p className="mt-3 text-xs text-ink-muted">
          {missing} {missing === 1 ? "question is" : "questions are"} no longer available (withdrawn for review) and
          {missing === 1 ? " is" : " are"} hidden.
        </p>
      )}
    </>
  );
}
