import type { Metadata } from "next";
import { Suspense } from "react";
import { listTerms } from "@/lib/content/queries";
import { Skeleton } from "@/components/ui";
import { ReviewView } from "./view";

export const metadata: Metadata = { title: "Daily review" };

export default function Page() {
  return (
    <Suspense fallback={<Skeleton className="h-[480px]" />}>
      <Review />
    </Suspense>
  );
}

async function Review() {
  return <ReviewView terms={await listTerms()} />;
}
