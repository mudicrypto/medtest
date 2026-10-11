"use client";

import { useEffect } from "react";
import { RotateCw, TriangleAlert } from "lucide-react";
import { Button, ButtonLink, Card } from "./ui";

/**
 * Friendly page for unexpected errors, e.g. when the database can't be reached.
 * The real error stays in the server logs; students never see technical
 * details (Next.js hides them in production anyway).
 */
export function ErrorScreen({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Card role="alert" className="mx-auto mt-6 max-w-lg p-8 text-center">
      <span className="mx-auto grid size-12 place-items-center rounded-full bg-sunken text-ink-soft">
        <TriangleAlert className="size-6" aria-hidden />
      </span>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight text-ink">Something went wrong</h1>
      <p className="mt-2 text-sm text-ink-soft">
        We couldn&apos;t load this page. This is usually a temporary connection problem — please try again in a
        moment. Your saved progress is safe.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Button onClick={() => retry()}>
          <RotateCw className="size-4" aria-hidden />
          Try again
        </Button>
        <ButtonLink href="/dashboard" variant="secondary">
          Back to dashboard
        </ButtonLink>
      </div>
      {error.digest && <p className="mt-6 text-xs text-ink-muted">Error reference: {error.digest}</p>}
    </Card>
  );
}
