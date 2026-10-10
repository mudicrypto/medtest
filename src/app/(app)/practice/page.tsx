import type { Metadata } from "next";
import { Suspense } from "react";
import { listQuestionRefs, listTopicsWithCounts } from "@/lib/content/queries";
import { PageHeader, Skeleton } from "@/components/ui";
import { PracticeView } from "./view";

export const metadata: Metadata = { title: "Practice" };

export default function Page() {
  return (
    <>
      <PageHeader
        eyebrow="Question bank"
        title="Practice"
        description="Pick specialties and, optionally, topics — or leave everything unselected for a mixed set. You'll see the answer and explanation after each question."
      />
      <Suspense fallback={<Skeleton className="h-[420px]" />}>
        <Topics />
      </Suspense>
    </>
  );
}

async function Topics() {
  const [specialties, refs] = await Promise.all([listTopicsWithCounts(), listQuestionRefs()]);
  return <PracticeView specialties={specialties} refs={refs} />;
}
