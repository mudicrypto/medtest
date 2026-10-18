import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CircleCheck } from "lucide-react";
import { getQuestionForStaff, isPublished } from "@/lib/content/admin";
import { Card, PageHeader, Skeleton, cn } from "@/components/ui";
import { originLabel, PublishedBadge, ReviewBadge, rightsLabel } from "../../status";
import { ReviewForm } from "./review-form";

export const metadata: Metadata = { title: "Question" };

export default function Page({ params }: PageProps<"/admin/questions/[slug]">) {
  return (
    <>
      <Link href="/admin/questions" className="mb-5 inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden /> All questions
      </Link>
      <Suspense fallback={<Skeleton className="h-[600px]" />}>
        <Detail params={params} />
      </Suspense>
    </>
  );
}

async function Detail({ params }: { params: PageProps<"/admin/questions/[slug]">["params"] }) {
  const { slug } = await params;
  const q = /^[a-z0-9][a-z0-9-]{1,79}$/.test(slug) ? await getQuestionForStaff(slug) : null;
  if (!q) notFound();
  const key = Array.isArray(q.question_keys) ? q.question_keys[0] : q.question_keys;
  const provenance = Array.isArray(q.question_provenance) ? q.question_provenance[0] : q.question_provenance;
  const options = [...q.question_options].sort((a, b) => a.position.localeCompare(b.position));
  const terms = Array.isArray(q.key_terms) ? (q.key_terms as { ru: string; en: string }[]) : [];

  return (
    <>
      <PageHeader
        eyebrow={`${q.topics?.name_en ?? q.topic} · ${q.slug}`}
        title="Question detail"
        actions={
          <div className="flex flex-wrap gap-2">
            <ReviewBadge status={q.review_status} />
            <PublishedBadge published={isPublished(q)} />
          </div>
        }
      />
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <Card className="p-6">
          <p className="font-serif text-lg leading-relaxed text-ink">{q.stem_en}</p>
          {q.stem_ru && (
            <p lang="ru" className="mt-3 border-l-2 border-accent-line pl-3 font-serif text-ink-muted">
              {q.stem_ru}
            </p>
          )}
          <ol className="mt-5 space-y-2">
            {options.map((o) => {
              const correct = key?.correct === o.position;
              return (
                <li
                  key={o.position}
                  className={cn("flex gap-3 rounded-xl border px-4 py-3", correct ? "border-success bg-success-soft" : "border-line")}
                >
                  <span className="font-semibold text-ink-soft">{o.position}</span>
                  <span className="min-w-0">
                    <span className="block text-ink">{o.text_en}</span>
                    {o.text_ru && (
                      <span lang="ru" className="block text-sm text-ink-muted">
                        {o.text_ru}
                      </span>
                    )}
                  </span>
                  {correct && <CircleCheck className="ml-auto size-5 shrink-0 text-success" aria-label="Correct answer" />}
                </li>
              );
            })}
          </ol>
          <h2 className="mt-6 text-xs font-semibold uppercase tracking-[0.1em] text-ink-muted">Explanation</h2>
          <p className="mt-1.5 font-serif leading-relaxed text-ink-soft">{key?.explanation_en ?? "— no explanation in the source —"}</p>
          {key?.explanation_ru && (
            <p lang="ru" className="mt-2 font-serif leading-relaxed text-ink-muted">
              {key.explanation_ru}
            </p>
          )}
          {key?.tutor_hint && (
            <>
              <h2 className="mt-5 text-xs font-semibold uppercase tracking-[0.1em] text-ink-muted">Tutor hint</h2>
              <p className="mt-1.5 text-sm text-ink-soft">{key.tutor_hint}</p>
            </>
          )}
          {terms.length > 0 && (
            <>
              <h2 className="mt-5 text-xs font-semibold uppercase tracking-[0.1em] text-ink-muted">Key terms</h2>
              <ul className="mt-2 flex flex-wrap gap-2 text-sm">
                {terms.map((t) => (
                  <li key={t.ru} className="rounded-lg border border-line px-2.5 py-1">
                    <span lang="ru">{t.ru}</span> <span className="text-ink-muted">· {t.en}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>

        <div className="space-y-4">
          <Card className="p-5">
            <h2 className="text-sm font-semibold text-ink">Review</h2>
            <ReviewForm slug={q.slug} current={q.review_status} />
            {q.reviewed_at && (
              <p className="mt-3 text-xs text-ink-muted">
                Last changed by {q.reviewer?.display_name ?? "a staff member"} on{" "}
                {new Date(q.reviewed_at).toLocaleDateString("en-GB", { dateStyle: "medium" })}
              </p>
            )}
            {q.review_note && <p className="mt-2 rounded-lg bg-sunken p-2.5 text-xs text-ink-soft">{q.review_note}</p>}
          </Card>
          <Card className="p-5 text-sm">
            <h2 className="font-semibold text-ink">Provenance</h2>
            <dl className="mt-3 space-y-2">
              <Row label="Origin" value={originLabel[q.origin]} />
              <Row label="Rights" value={rightsLabel[q.rights_status]} />
              <Row label="Source" value={q.content_sources?.title ?? "—"} />
              <Row label="Source reference" value={q.source_ref ?? "—"} />
              <Row label="Answer key" value={key?.correct ?? "Not marked in the source (not scored)"} />
              <Row label="Released for practice" value={q.practice_release ? "Yes, before medical review" : "No"} />
              <Row label="Source flags" value={q.source_flags.length ? q.source_flags.join(", ") : "None"} />
              <Row label="Difficulty" value={String(q.difficulty)} />
              <Row label="Version" value={String(q.version)} />
            </dl>
            {provenance && (
              <details className="mt-3">
                <summary className="cursor-pointer text-xs text-accent">Original source record and audit ({provenance.bank})</summary>
                <pre className="mt-2 max-h-80 overflow-auto rounded-lg bg-sunken p-2.5 text-[11px] leading-snug text-ink-soft">
                  {JSON.stringify({ record: provenance.record, audit: provenance.audit }, null, 2)}
                </pre>
              </details>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-ink-muted">{label}</dt>
      <dd className="text-right text-ink">{value}</dd>
    </div>
  );
}
