import type { Metadata } from "next";
import { Suspense } from "react";
import { listTopicsWithCounts } from "@/lib/content/queries";
import { PageHeader, Skeleton } from "@/components/ui";
import { PracticeView } from "./view";

export const metadata: Metadata = { title: "Practice" };

export default function Page() {
  return (
    <>
      <PageHeader
        eyebrow="Question bank"
        title="Practice"
        description="Pick one or more topics — or leave them all unselected for a mixed set. You'll see the answer and explanation after each question."
      />
      <Suspense fallback={<Skeleton className="h-[420px]" />}>
        <Topics />
      </Suspense>
    </>
  );
}

async function Topics() {
  return <PracticeView topics={await listTopicsWithCounts()} />;
}
