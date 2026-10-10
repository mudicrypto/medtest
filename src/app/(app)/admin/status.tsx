import type { ContentOrigin, ReviewStatus, RightsStatus } from "@/lib/content/admin";
import { Badge } from "@/components/ui";

const review: Record<ReviewStatus, { label: string; tone: "neutral" | "accent" | "warning" | "success" | "danger" }> = {
  draft: { label: "Draft", tone: "neutral" },
  in_review: { label: "In review", tone: "warning" },
  approved: { label: "Approved", tone: "success" },
  retired: { label: "Retired", tone: "danger" },
};

export const originLabel: Record<ContentOrigin, string> = {
  original_practice: "Original practice",
  official_verified: "Official · verified",
  adapted: "Adapted",
  demo: "Demo",
};

export const rightsLabel: Record<RightsStatus, string> = {
  owned: "Owned",
  licensed: "Licensed",
  public_domain: "Public domain",
  permission_pending: "Permission pending",
  not_cleared: "Not cleared",
};

export function ReviewBadge({ status }: { status: ReviewStatus }) {
  return <Badge tone={review[status].tone}>{review[status].label}</Badge>;
}

export function PublishedBadge({ published }: { published: boolean }) {
  return published ? <Badge tone="accent">Visible to students</Badge> : <Badge>Hidden from students</Badge>;
}
