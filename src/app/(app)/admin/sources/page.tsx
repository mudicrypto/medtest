import type { Metadata } from "next";
import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import { listSources } from "@/lib/content/admin";
import { Card, PageHeader, Skeleton } from "@/components/ui";
import { rightsLabel } from "../status";
import { SourceForm } from "./source-form";

export const metadata: Metadata = { title: "Sources" };

export default function SourcesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Provenance"
        title="Sources & permissions"
        description="Record where content comes from and the evidence that we may use it. Official or adapted questions must be linked to a source when imported."
      />
      <Suspense fallback={<Skeleton className="h-96" />}>
        <Sources />
      </Suspense>
    </>
  );
}

async function Sources() {
  const [sources, user] = await Promise.all([listSources(), getCurrentUser()]);
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
      <div className="space-y-3">
        {sources.length === 0 && <Card className="p-8 text-center text-sm text-ink-muted">No sources yet.</Card>}
        {sources.map((s) => (
          <Card key={s.id} className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h2 className="font-semibold text-ink">{s.title}</h2>
              <span className="rounded-full bg-sunken px-2.5 py-0.5 text-xs text-ink-soft">{rightsLabel[s.rights_status]}</span>
            </div>
            {s.publisher && <p className="text-sm text-ink-muted">{s.publisher}</p>}
            <dl className="mt-3 grid gap-x-4 gap-y-1.5 text-sm sm:grid-cols-[auto_1fr]">
              {s.granted_by && (
                <>
                  <dt className="text-ink-muted">Granted by</dt>
                  <dd className="text-ink">{s.granted_by}</dd>
                </>
              )}
              {s.granted_on && (
                <>
                  <dt className="text-ink-muted">Date</dt>
                  <dd className="text-ink">{new Date(s.granted_on).toLocaleDateString("en-GB", { dateStyle: "medium" })}</dd>
                </>
              )}
              {s.permission_evidence && (
                <>
                  <dt className="text-ink-muted">Evidence</dt>
                  <dd className="whitespace-pre-line text-ink">{s.permission_evidence}</dd>
                </>
              )}
              {s.url && (
                <>
                  <dt className="text-ink-muted">Link</dt>
                  <dd className="truncate">
                    <a href={s.url} target="_blank" rel="noreferrer" className="text-accent hover:underline">
                      {s.url}
                    </a>
                  </dd>
                </>
              )}
              {s.license_notes && (
                <>
                  <dt className="text-ink-muted">Notes</dt>
                  <dd className="whitespace-pre-line text-ink">{s.license_notes}</dd>
                </>
              )}
            </dl>
          </Card>
        ))}
      </div>
      {user.role === "admin" ? (
        <Card className="h-fit p-5">
          <h2 className="font-semibold text-ink">Add a source</h2>
          <SourceForm />
        </Card>
      ) : (
        <Card className="h-fit p-5 text-sm text-ink-muted">Only admins can add sources.</Card>
      )}
    </div>
  );
}
