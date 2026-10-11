import Link from "next/link";
import { CircleCheck, CircleMinus, CircleX } from "lucide-react";
import type { Question, QuestionOption } from "@/lib/types";
import { SourceBadge } from "./source-badge";
import { Card, cn } from "./ui";

type OptionId = QuestionOption["id"];

export interface ReviewedAnswer {
  question: Question;
  /** null when the question was left unanswered (mock exams). */
  selected: OptionId | null;
  correct: OptionId;
  explanationEn: string;
}

const STATUS = {
  correct: { label: "Correct", icon: CircleCheck, tone: "text-success" },
  incorrect: { label: "Incorrect", icon: CircleX, tone: "text-danger" },
  unanswered: { label: "Not answered", icon: CircleMinus, tone: "text-ink-muted" },
} as const;

/**
 * Question-by-question review after a practice session or mock exam: the
 * student's answer, the correct answer, the explanation and a link back to the
 * question. Each row expands; the status is readable without expanding.
 */
export function AnswerReview({ items }: { items: ReviewedAnswer[] }) {
  return (
    <Card className="divide-y divide-line">
      {items.map(({ question: q, selected, correct, explanationEn }, i) => {
        const status = selected === null ? "unanswered" : selected === correct ? "correct" : "incorrect";
        const s = STATUS[status];
        const optionText = (id: OptionId) => q.options.find((o) => o.id === id)?.textEn;
        return (
          <details key={q.id} className="group px-5 py-4" data-testid="answer-review-item">
            <summary className="flex cursor-pointer list-none items-start gap-3">
              <s.icon className={cn("mt-0.5 size-5 shrink-0", s.tone)} aria-hidden />
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className={cn("text-xs font-medium", s.tone)}>{s.label}</span>
                  {q.origin === "demo" && <SourceBadge origin="demo" />}
                </span>
                <span className="mt-0.5 line-clamp-2 text-sm text-ink-soft group-open:line-clamp-none">
                  <span className="tabular-nums text-ink-muted">{i + 1}. </span>
                  {q.stemEn}
                </span>
              </span>
              <span className="shrink-0 text-xs text-accent group-open:hidden">Show</span>
              <span className="hidden shrink-0 text-xs text-accent group-open:inline">Hide</span>
            </summary>
            <dl className="ml-8 mt-3 space-y-2 text-sm">
              <div>
                <dt className="inline text-ink-muted">Your answer: </dt>
                <dd className={cn("inline", status === "correct" ? "text-success" : status === "incorrect" ? "text-danger" : "text-ink-muted")}>
                  {selected ? `${selected} — ${optionText(selected)}` : "not answered"}
                </dd>
              </div>
              <div>
                <dt className="inline text-ink-muted">Correct answer: </dt>
                <dd className="inline font-medium text-success">
                  {correct} — {optionText(correct)}
                </dd>
              </div>
              <div className="pt-1">
                <dt className="sr-only">Explanation</dt>
                <dd className="font-serif leading-relaxed text-ink-soft">{explanationEn}</dd>
              </div>
            </dl>
            <Link href={`/questions/${q.id}`} className="ml-8 mt-3 inline-block text-sm text-accent hover:underline">
              Open question
            </Link>
          </details>
        );
      })}
    </Card>
  );
}
