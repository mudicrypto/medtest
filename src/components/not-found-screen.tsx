import { SearchX } from "lucide-react";
import { ButtonLink, Card } from "./ui";

/** Friendly "page not found", used inside and outside the signed-in app. */
export function NotFoundScreen({ home = "/dashboard", homeLabel = "Back to dashboard" }: { home?: string; homeLabel?: string }) {
  return (
    <Card className="mx-auto mt-6 max-w-lg p-8 text-center">
      <span className="mx-auto grid size-12 place-items-center rounded-full bg-sunken text-ink-soft">
        <SearchX className="size-6" aria-hidden />
      </span>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight text-ink">Page not found</h1>
      <p className="mt-2 text-sm text-ink-soft">
        We couldn&apos;t find that page. If you followed a link to a question, it may have been withdrawn for review.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <ButtonLink href={home}>{homeLabel}</ButtonLink>
      </div>
    </Card>
  );
}
