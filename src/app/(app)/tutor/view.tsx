"use client";

import { ShieldCheck } from "lucide-react";
import { TutorChat } from "@/components/tutor";
import { Card, PageHeader } from "@/components/ui";

export function TutorView() {
  return (
    <>
      <PageHeader
        eyebrow="AI tutor"
        title="Ask your tutor"
        description="Get explanations, memory hooks, and help with Russian terms. For a specific question, open the tutor from that question after answering — it will see the question and your answer."
      />
      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <Card className="flex h-[min(640px,calc(100dvh-280px))] min-h-[420px] flex-col p-4 sm:p-5">
          <TutorChat className="flex-1" />
        </Card>
        <Card className="h-fit p-5 text-sm">
          <p className="flex items-center gap-2 font-medium text-ink">
            <ShieldCheck className="size-4 text-accent" aria-hidden /> How the tutor will work
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-4 text-ink-muted">
            <li>Answers from our medically reviewed explanation first.</li>
            <li>Clearly labelled as AI — never presented as official exam guidance.</li>
            <li>Runs on our server; no API key is ever sent to your browser.</li>
            <li>Daily usage limits keep it fast and fair.</li>
          </ul>
          <p className="mt-4 rounded-lg bg-warning-soft p-3 text-xs text-warning">
            Prototype: replies are scripted. The real AI is connected in a later milestone.
          </p>
        </Card>
      </div>
    </>
  );
}
