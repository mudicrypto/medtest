import { BadgeCheck, FileText, FlaskConical, PenLine } from "lucide-react";
import type { ContentOrigin, ReviewStatus } from "@/lib/types";
import { Badge } from "./ui";

const originMeta: Record<
  ContentOrigin,
  { label: string; tone: "neutral" | "accent" | "warning"; icon: typeof BadgeCheck; title: string }
> = {
  demo: {
    label: "Illustrative demo · unreviewed",
    tone: "warning",
    icon: FlaskConical,
    title:
      "An illustrative original question written to demonstrate the app. It has not been validated by a qualified medical reviewer and is not official exam content.",
  },
  original_practice: {
    label: "MedPrep original practice",
    tone: "neutral",
    icon: PenLine,
    title: "Written by the MedPrep team to practise the topic. Not an official exam item.",
  },
  official_verified: {
    label: "Official source · verified",
    tone: "accent",
    icon: BadgeCheck,
    title: "Matches an official source, with citation and verification date.",
  },
  adapted: {
    label: "Adapted from official source",
    tone: "neutral",
    icon: FileText,
    title: "Based on an official item but reworded or translated.",
  },
};

const reviewLabel: Record<ReviewStatus, string> = {
  draft: "Awaiting medical review",
  in_review: "In medical review",
  approved: "Medically reviewed",
  retired: "Retired",
};

export function SourceBadge({ origin, reviewStatus }: { origin: ContentOrigin; reviewStatus?: ReviewStatus }) {
  const m = originMeta[origin];
  const Icon = m.icon;
  return (
    <span className="inline-flex flex-wrap items-center gap-2" title={m.title}>
      <Badge tone={m.tone}>
        <Icon className="size-3.5" aria-hidden />
        {m.label}
      </Badge>
      {reviewStatus && <span className="text-xs text-ink-muted">{reviewLabel[reviewStatus]}</span>}
    </span>
  );
}
