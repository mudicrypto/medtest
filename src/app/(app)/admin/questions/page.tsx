import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { isPublished, listQuestionsForStaff, ORIGINS, REVIEW_STATUSES } from "@/lib/content/admin";
import { listTopicsWithCounts } from "@/lib/content/queries";
import { Badge, Card, PageHeader, Skeleton } from "@/components/ui";
import { originLabel, ReviewBadge } from "../status";

export const metadata: Metadata = { title: "Questions" };

export default function QuestionsPage({ searchParams }: PageProps<"/admin/questions">) {
  return (
    <>
      <PageHeader eyebrow="Content" title="Questions" description="Newest changes first. Open a question to review it." />
      <Suspense fallback={<Skeleton className="h-96" />}>
        <QuestionTable searchParams={searchParams} />
      </Suspense>
    </>
  );
}

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

async function QuestionTable({ searchParams }: { searchParams: PageProps<"/admin/questions">["searchParams"] }) {
  const sp = await searchParams;
  const filters = { status: one(sp.status), origin: one(sp.origin), topic: one(sp.topic), search: one(sp.q) };
  const [rows, topics] = await Promise.all([listQuestionsForStaff(filters), listTopicsWithCounts()]);

  const select = "h-10 rounded-lg border border-line bg-surface px-3 text-sm text-ink";
  return (
    <>
      <form className="mb-4 flex flex-wrap items-end gap-2" role="search">
        <label className="flex flex-col gap-1 text-xs text-ink-muted">
          Search
          <input name="q" defaultValue={filters.search} placeholder="Text or slug" className={`${select} w-56`} />
        </label>
        <label className="flex flex-col gap-1 text-xs text-ink-muted">
          Status
          <select name="status" defaultValue={filters.status} className={select}>
            <option value="">All</option>
            {REVIEW_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replace("_", " ")}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-ink-muted">
          Origin
          <select name="origin" defaultValue={filters.origin} className={select}>
            <option value="">All</option>
            {ORIGINS.map((o) => (
              <option key={o} value={o}>
                {originLabel[o]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-ink-muted">
          Specialty
          <select name="topic" defaultValue={filters.topic} className={select}>
            <option value="">All</option>
            {topics.map((t) => (
              <option key={t.slug} value={t.slug}>
                {t.nameEn}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="h-10 rounded-lg bg-ink px-4 text-sm font-medium text-white">
          Filter
        </button>
        <Link href="/admin/questions" className="h-10 px-2 text-sm leading-10 text-accent hover:underline">
          Clear
        </Link>
      </form>

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-line text-xs text-ink-muted">
              <th className="px-4 py-3 font-medium">Question</th>
              <th className="px-4 py-3 font-medium">Specialty · topic</th>
              <th className="px-4 py-3 font-medium">Origin</th>
              <th className="px-4 py-3 font-medium">Review</th>
              <th className="px-4 py-3 font-medium">Students</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.slug} className="border-b border-line/70 last:border-0 hover:bg-sunken/40">
                <td className="max-w-md px-4 py-3">
                  <Link href={`/admin/questions/${r.slug}`} className="block hover:underline">
                    <span className="font-mono text-xs text-ink-muted">{r.slug}</span>
                    <span className="mt-0.5 line-clamp-2 block text-ink">{r.stem_en}</span>
                  </Link>
                </td>
                <td className="px-4 py-3 text-ink-soft">
                  {r.topics?.name_en}
                  {r.clinical_topic && <span className="block text-xs text-ink-muted">{r.clinical_topic}</span>}
                </td>
                <td className="px-4 py-3 text-ink-soft">{originLabel[r.origin]}</td>
                <td className="px-4 py-3">
                  <ReviewBadge status={r.review_status} />
                </td>
                <td className="px-4 py-3">{isPublished(r) ? <Badge tone="accent">Visible</Badge> : <span className="text-xs text-ink-muted">Hidden</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="px-4 py-10 text-center text-sm text-ink-muted">No questions match these filters.</p>}
      </Card>
      {rows.length === 200 && <p className="mt-2 text-xs text-ink-muted">Showing the 200 most recently changed. Use the filters to narrow down.</p>}
    </>
  );
}
