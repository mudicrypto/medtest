"use client";

import { useEffect, useState } from "react";
import { Volume2 } from "lucide-react";
import type { Term } from "@/lib/types";
import { intervalLabel, newCard, type Grade, type SrsCard } from "@/lib/srs";
import { SourceBadge } from "./source-badge";
import { Card, cn } from "./ui";

const grades: { grade: Grade; label: string; className: string }[] = [
  { grade: "again", label: "Again", className: "text-danger hover:border-[#fecdca] hover:bg-danger-soft" },
  { grade: "hard", label: "Hard", className: "text-warning hover:border-[#fedf89] hover:bg-warning-soft" },
  { grade: "good", label: "Good", className: "text-accent-strong hover:border-accent-line hover:bg-accent-soft" },
  { grade: "easy", label: "Easy", className: "text-success hover:border-[#abefc6] hover:bg-success-soft" },
];

/** Uses the browser's built-in speech engine, if it has a Russian voice. */
function useRussianSpeech() {
  const [supported, setSupported] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const check = () => setSupported(speechSynthesis.getVoices().some((v) => v.lang.startsWith("ru")));
    check();
    speechSynthesis.addEventListener("voiceschanged", check);
    return () => speechSynthesis.removeEventListener("voiceschanged", check);
  }, []);
  const speak = (text: string) => {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "ru-RU";
    u.rate = 0.85;
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  };
  return { supported, speak };
}

export function TermFlashcard({
  term,
  card,
  now,
  direction = "ru-en",
  onGrade,
}: {
  term: Term;
  card?: SrsCard;
  now: number;
  direction?: "ru-en" | "en-ru";
  onGrade: (g: Grade) => void;
}) {
  const [revealed, setRevealed] = useState(false);
  const speech = useRussianSpeech();
  const c = card ?? newCard(now);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!revealed && (e.key === " " || e.key === "Enter")) {
        e.preventDefault();
        setRevealed(true);
      } else if (revealed && ["1", "2", "3", "4"].includes(e.key)) {
        onGrade(grades[Number(e.key) - 1].grade);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [revealed, onGrade]);

  const ruFront = direction === "ru-en";

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-line px-5 py-3">
        <span className="text-xs font-medium uppercase tracking-[0.1em] text-ink-muted">
          {ruFront ? "Russian → English" : "English → Russian"}
        </span>
        <SourceBadge origin={term.origin} />
      </div>

      <button
        type="button"
        onClick={() => setRevealed(true)}
        disabled={revealed}
        className="flex min-h-[260px] w-full flex-col items-center justify-center px-6 py-10 text-center disabled:cursor-default"
      >
        {ruFront ? (
          <>
            <span lang="ru" className="font-serif text-4xl text-ink sm:text-5xl">
              {term.ru}
            </span>
            <span className="mt-3 font-mono text-sm tracking-wide text-ink-muted">{term.translit}</span>
          </>
        ) : (
          <span className="font-serif text-3xl text-ink sm:text-4xl">{term.en}</span>
        )}

        {revealed ? (
          <span className="mt-8 w-full max-w-md border-t border-line pt-6">
            <span className="block text-xl font-medium text-accent-strong">
              {ruFront ? term.en : <span lang="ru">{term.ru}</span>}
            </span>
            {!ruFront && <span className="mt-1 block font-mono text-sm text-ink-muted">{term.translit}</span>}
            <span lang="ru" className="mt-4 block font-serif text-ink-soft">
              {term.exampleRu}
            </span>
            <span className="mt-1 block text-sm text-ink-muted">{term.exampleEn}</span>
          </span>
        ) : (
          <span className="mt-8 text-sm text-ink-muted">Tap or press Space to reveal</span>
        )}
      </button>

      {speech.supported && (
        <div className="-mt-4 flex justify-center pb-4">
          <button
            type="button"
            onClick={() => speech.speak(term.ru)}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-ink-muted hover:bg-sunken hover:text-ink"
          >
            <Volume2 className="size-4" aria-hidden /> Listen
          </button>
        </div>
      )}

      {revealed && (
        <div className="grid grid-cols-4 gap-2 border-t border-line bg-canvas p-3 sm:p-4">
          {grades.map((g, i) => (
            <button
              key={g.grade}
              type="button"
              onClick={() => onGrade(g.grade)}
              className={cn(
                "flex flex-col items-center rounded-xl border border-line bg-surface py-2.5 text-sm font-medium transition-colors",
                g.className,
              )}
            >
              {g.label}
              <span className="mt-0.5 text-[11px] font-normal text-ink-muted">
                <span className="hidden sm:inline">{i + 1} · </span>
                {intervalLabel(c, g.grade, now)}
              </span>
            </button>
          ))}
        </div>
      )}
    </Card>
  );
}
