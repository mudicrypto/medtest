import type { Metadata } from "next";
import { Suspense } from "react";
import { listTopicsWithCounts } from "@/lib/content/queries";
import { Skeleton } from "@/components/ui";
import { AnalyticsView } from "./view";

export const metadata: Metadata = { title: "Progress" };

export default function Page() {
  return (
    <Suspense fallback={<Skeleton className="h-[600px]" />}>
      <Analytics />
    </Suspense>
  );
}

async function Analytics() {
  return <AnalyticsView topics={await listTopicsWithCounts()} />;
}
