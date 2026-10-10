import { Suspense } from "react";
import Link from "next/link";
import { FileUp, Library, ListChecks } from "lucide-react";
import { contentStats, ORIGINS, REVIEW_STATUSES } from "@/lib/content/admin";
import { Card, PageHeader, Skeleton, StatTile } from "@/components/ui";
import { originLabel, ReviewBadge } from "./status";

export default function AdminHome() {
  return (
    <>
      <PageHeader
        eyebrow="Content"
        title="Question bank"
        description="Only questions that are rights-cleared and medically approved are shown to students. Demo questions are shown with a DEMO label until you retire them."
      />
      <Suspense fallback={<Skeleton className="h-64" />}>
        <Stats />
      </Suspense>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <QuickLink href="/admin/import" icon={<FileUp className="size-5" />} title="Import questions" text="Upload a CSV spreadsheet." />
        <QuickLink href="/admin/questions?status=in_review" icon={<ListChecks className="size-5" />} title="Review queue" text="Questions waiting for review." />
        <QuickLink href="/admin/sources" icon={<Library className="size-5" />} title="Sources & permissions" text="Where content comes from." />
      </div>
    </>
  );
}

async function Stats() {
  const s = await contentStats();
  return (
    <>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile label="Questions" value={s.total} />
        <StatTile label="Visible to students" value={s.published} />
        <StatTile label="Waiting for review" value={s.byStatus.in_review} />
        <StatTile label="Drafts" value={s.byStatus.draft} />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-ink">By review status</h2>
          <ul className="mt-3 space-y-2">
            {REVIEW_STATUSES.map((st) => (
              <li key={st} className="flex items-center justify-between text-sm">
                <Link href={`/admin/questions?status=${st}`} className="hover:underline">
                  <ReviewBadge status={st} />
                </Link>
                <span className="tabular-nums text-ink">{s.byStatus[st]}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-ink">By origin</h2>
          <ul className="mt-3 space-y-2">
            {ORIGINS.map((o) => (
              <li key={o} className="flex items-center justify-between text-sm">
                <Link href={`/admin/questions?origin=${o}`} className="text-ink-soft hover:underline">
                  {originLabel[o]}
                </Link>
                <span className="tabular-nums text-ink">{s.byOrigin[o]}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}

function QuickLink({ href, icon, title, text }: { href: string; icon: React.ReactNode; title: string; text: string }) {
  return (
    <Link href={href} className="group">
      <Card className="h-full p-5 transition-shadow group-hover:shadow-[var(--shadow-lift)]">
        <span className="grid size-10 place-items-center rounded-xl bg-accent-soft text-accent">{icon}</span>
        <p className="mt-3 font-medium text-ink">{title}</p>
        <p className="text-sm text-ink-muted">{text}</p>
      </Card>
    </Link>
  );
}
