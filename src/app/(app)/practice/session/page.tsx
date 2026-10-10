import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui";
import { SessionView } from "./view";

export const metadata: Metadata = { title: "Practice session" };

export default function Page() {
  // The session reads its options from the URL, which is only known at request
  // time, so it renders inside a Suspense boundary.
  return (
    <>
      <h1 className="sr-only">Practice session</h1>
      <Suspense fallback={<Skeleton className="mx-auto h-[520px] max-w-3xl" />}>
        <SessionView />
      </Suspense>
    </>
  );
}
