"use client";

import { Bookmark, BookOpen } from "lucide-react";
import { useProgress } from "@/lib/progress-store";
import { QuestionList } from "@/components/question-list";
import { ButtonLink, EmptyState, PageHeader, Skeleton } from "@/components/ui";

export function BookmarksView() {
  const store = useProgress();
  if (!store.ready) return <Skeleton className="h-96" />;
  const ids = [...store.bookmarks].reverse();

  return (
    <>
      <PageHeader
        eyebrow="Saved"
        title="Bookmarks"
        description="Questions you've saved to come back to. Tap the bookmark icon on any question to add or remove it."
        actions={
          ids.length > 0 && (
            <ButtonLink href={`/practice/session?ids=${ids.join(",")}`}>
              <BookOpen className="size-4" aria-hidden /> Practise these
            </ButtonLink>
          )
        }
      />
      {ids.length ? (
        <QuestionList ids={ids} />
      ) : (
        <EmptyState icon={<Bookmark className="size-6" />} title="No bookmarks yet">
          Use the bookmark icon at the top of a question to save it here.
        </EmptyState>
      )}
    </>
  );
}
