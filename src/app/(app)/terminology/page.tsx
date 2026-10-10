import type { Metadata } from "next";
import { Suspense } from "react";
import { listTerms } from "@/lib/content/queries";
import { Skeleton } from "@/components/ui";
import { TerminologyView } from "./view";

export const metadata: Metadata = { title: "Terminology" };

export default function Page() {
  return (
    <Suspense fallback={<Skeleton className="h-96" />}>
      <Terminology />
    </Suspense>
  );
}

async function Terminology() {
  return <TerminologyView terms={await listTerms()} />;
}
