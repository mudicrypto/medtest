"use client";

import { catchError, type ErrorInfo } from "next/error";
import { RotateCw } from "lucide-react";

/** If the account details can't load, keep the rest of the app usable. */
function AccountMenuError(_props: { children?: React.ReactNode }, { retry }: ErrorInfo) {
  return (
    <div role="alert" className="rounded-xl border border-line bg-surface p-3 text-xs text-ink-soft">
      <p>We couldn&apos;t load your account details.</p>
      <button
        type="button"
        onClick={() => retry()}
        className="mt-2 inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-lg hover:bg-sunken hover:text-ink"
      >
        <RotateCw className="size-3.5" aria-hidden /> Try again
      </button>
    </div>
  );
}

export const AccountMenuBoundary = catchError(AccountMenuError);
