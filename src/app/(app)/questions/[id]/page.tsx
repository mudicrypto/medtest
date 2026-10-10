import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { questionById, questions } from "@/demo/questions";
import { QuestionCard } from "@/components/question-card";

// Every demo question is known at build time, so each page is prerendered.
export function generateStaticParams() {
  return questions.map((q) => ({ id: q.id }));
}

export const metadata: Metadata = { title: "Question" };

export default async function Page({ params }: PageProps<"/questions/[id]">) {
  const { id } = await params;
  const question = questionById[id];
  if (!question) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/practice" className="mb-5 inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden /> Question bank
      </Link>
      <h1 className="sr-only">Practice question</h1>
      <QuestionCard question={question} mode="practice" />
    </div>
  );
}
