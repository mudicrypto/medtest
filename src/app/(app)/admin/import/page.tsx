import type { Metadata } from "next";
import { Suspense } from "react";
import { Download } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { listSources } from "@/lib/content/admin";
import { Card, PageHeader, Skeleton } from "@/components/ui";
import { ImportForm } from "./import-form";

export const metadata: Metadata = { title: "Import" };

export default function ImportPage() {
  return (
    <>
      <PageHeader
        eyebrow="Content"
        title="Import questions"
        description="Upload a CSV spreadsheet. The file is checked first and nothing is saved until you confirm. Existing questions with the same slug are updated."
        actions={
          <a
            href="/admin/template.csv"
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-line bg-surface px-4 text-sm font-medium text-ink hover:bg-sunken"
          >
            <Download className="size-4" aria-hidden /> Template
          </a>
        }
      />
      <Suspense fallback={<Skeleton className="h-80" />}>
        <Importer />
      </Suspense>
      <Card className="mt-6 p-5 text-sm leading-relaxed text-ink-soft">
        <h2 className="font-semibold text-ink">Spreadsheet tips</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>In Excel use <strong>File → Save As → CSV UTF-8</strong> so Russian text is kept.</li>
          <li>One row per question. <code>correct</code> is A, B, C or D.</li>
          <li>
            <code>key_terms</code>: <code>русский = English; русский = English</code>
          </li>
          <li>
            <code>origin</code>: original_practice, official_verified, adapted or demo. Official and adapted questions need a
            source chosen above.
          </li>
          <li>
            <code>review_status</code>: draft, in_review (default) or approved. Approved questions with cleared rights become
            visible to students straight away.
          </li>
          <li>Full guide: docs/CONTENT_GUIDE.md in the project.</li>
        </ul>
      </Card>
    </>
  );
}

async function Importer() {
  const [user, sources] = await Promise.all([getCurrentUser(), listSources()]);
  if (user.role !== "admin") {
    return <Card className="p-6 text-sm text-ink-muted">Only admins can import questions.</Card>;
  }
  return <ImportForm sources={sources.map((s) => ({ id: s.id, title: s.title }))} />;
}
