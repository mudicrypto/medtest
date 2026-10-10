"use client";

import { CircleAlert } from "lucide-react";
import { useProgress } from "@/lib/progress-store";

/** Shows a banner when progress couldn't be loaded or saved. */
export function ProgressStatus() {
  const { error, ready, retry } = useProgress();
  if (!error) return null;
  return (
    <div role="alert" className="mb-6 flex flex-wrap items-center gap-3 rounded-xl bg-danger-soft p-3.5 text-sm text-danger">
      <CircleAlert className="size-4 shrink-0" aria-hidden />
      <span className="flex-1">{error}</span>
      {!ready && (
        <button type="button" onClick={retry} className="font-medium underline">
          Try again
        </button>
      )}
    </div>
  );
}
