import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getQuestion } from "@/lib/content/queries";
import { PracticeQuestion } from "@/components/question-card";
import { Skeleton } from "@/components/ui";

export const metadata: Metadata = { title: "Question" };

export default function Page({ params }: PageProps<"/questions/[id]">) {
  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/practice" className="mb-5 inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden /> Question bank
      </Link>
      <h1 className="sr-only">Practice question</h1>
      <Suspense fallback={<Skeleton className="h-[520px]" />}>
        <QuestionLoader params={params} />
      </Suspense>
    </div>
  );
}

async function QuestionLoader({ params }: { params: PageProps<"/questions/[id]">["params"] }) {
  const { id } = await params;
  // Only published questions are returned to students (row level security).
  const question = /^[a-z0-9][a-z0-9-]{1,79}$/.test(id) ? await getQuestion(id) : null;
  if (!question) notFound();
  return <PracticeQuestion question={question} mode="practice" />;
}
