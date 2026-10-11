"use client";

import { RotateCw } from "lucide-react";
import { Button, ButtonLink, Card } from "./ui";

/**
 * Shown when data couldn't be loaded (e.g. the database is unreachable), so a
 * failure never looks like "there's nothing here".
 */
export function LoadError({
  message,
  onRetry,
  back,
}: {
  message: string;
  onRetry: () => void;
  back?: { href: string; label: string };
}) {
  return (
    <Card role="alert" className="p-8 text-center">
      <p className="text-ink">{message}</p>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        <Button onClick={onRetry}>
          <RotateCw className="size-4" aria-hidden />
          Try again
        </Button>
        {back && (
          <ButtonLink href={back.href} variant="secondary">
            {back.label}
          </ButtonLink>
        )}
      </div>
    </Card>
  );
}
