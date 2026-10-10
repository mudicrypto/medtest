import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui";
import { MockRunView } from "./view";

export const metadata: Metadata = { title: "Mock exam" };

export default function Page() {
  return (
    <>
      <h1 className="sr-only">Mock exam</h1>
      <Suspense fallback={<Skeleton className="h-[520px]" />}>
        <MockRunView />
      </Suspense>
    </>
  );
}
