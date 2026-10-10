"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { questionById } from "@/demo/questions";
import { topicBySlug } from "@/demo/topics";
import { Badge, Card } from "./ui";

export function QuestionList({ ids, meta }: { ids: string[]; meta?: (id: string) => React.ReactNode }) {
  return (
    <Card className="divide-y divide-line overflow-hidden">
      {ids.map((id) => {
        const q = questionById[id];
        if (!q) return null;
        return (
          <Link key={id} href={`/questions/${id}`} className="group flex items-center gap-4 px-5 py-4 hover:bg-sunken/50 sm:px-6">
            <div className="min-w-0 flex-1">
              <div className="mb-1.5 flex flex-wrap items-center gap-2">
                <Badge>{topicBySlug[q.topic]?.nameEn}</Badge>
                {meta?.(id)}
              </div>
              <p className="line-clamp-2 text-[0.95rem] leading-snug text-ink">{q.stemEn}</p>
            </div>
            <ChevronRight className="size-5 shrink-0 text-ink-muted transition-transform group-hover:translate-x-0.5" aria-hidden />
          </Link>
        );
      })}
    </Card>
  );
}
