"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Sparkles, X } from "lucide-react";
import type { Question, QuestionKey } from "@/lib/types";
import { cn } from "./ui";

export interface TutorContext {
  question: Question;
  qkey: QuestionKey;
  selected?: string;
}

interface Message {
  role: "user" | "tutor";
  text: string;
}

// Scripted replies — the real tutor (Milestone 8) calls Claude from the server
// with the same context: question, the student's answer, and our explanation.
function scriptedReply(prompt: string, ctx?: TutorContext): string {
  const p = prompt.toLowerCase();
  if (!ctx) {
    if (p.includes("plan") || p.includes("schedule"))
      return "Here's a simple weekly rhythm: do your daily review queue first (10–15 min), then one focused topic block of 20 practice questions, then 10 minutes of terminology. Once a week, sit a timed mock and spend as long reviewing it as you spent taking it.";
    if (p.includes("russian") || p.includes("term"))
      return "Learn terms in clinical phrases rather than alone — e.g. «давящая боль за грудиной» (crushing retrosternal pain) instead of just «боль». The Terminology trainer schedules each card for you so you see it again just before you'd forget.";
    return "In the full version I'll answer using your progress and the question you're on. For now, try opening me from a question after you answer it — I'll explain that specific item.";
  }
  const { question, qkey, selected } = ctx;
  const correctText = question.options.find((o) => o.id === qkey.correct)?.textEn;
  if (p.includes("wrong") || p.includes("why")) {
    const mine = question.options.find((o) => o.id === selected);
    const lead =
      selected && selected !== qkey.correct
        ? `You chose ${selected} (${mine?.textEn}). The key answer is ${qkey.correct} — ${correctText}. `
        : `The key answer is ${qkey.correct} — ${correctText}. `;
    return lead + qkey.tutorHint;
  }
  if (p.includes("term") || p.includes("russian")) {
    return (
      "Key Russian terms for this question:\n" +
      question.keyTerms.map((t) => `• ${t.ru} — ${t.en}`).join("\n") +
      "\n\nTry saying each one aloud, then use it in a short sentence about the patient."
    );
  }
  if (p.includes("memory") || p.includes("remember") || p.includes("hook")) {
    return `Memory hook: ${qkey.tutorHint}`;
  }
  return qkey.explanationEn;
}

const contextualPrompts = ["Why is my answer wrong?", "Explain the key Russian terms", "Give me a memory hook"];
const generalPrompts = ["Make me a weekly study plan", "How should I learn Russian terms?"];

export function TutorChat({ ctx, className }: { ctx?: TutorContext; className?: string }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "tutor",
      text: ctx
        ? "Hi! I can see the question you just answered. What would you like to go over?"
        : "Hi! I'm your study tutor. Ask about a topic, your plan, or Russian terminology.",
    },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [messages, typing]);

  function send(text: string) {
    const t = text.trim();
    if (!t || typing) return;
    setMessages((m) => [...m, { role: "user", text: t }]);
    setInput("");
    setTyping(true);
    setTimeout(() => {
      setMessages((m) => [...m, { role: "tutor", text: scriptedReply(t, ctx) }]);
      setTyping(false);
    }, 700);
  }

  const prompts = ctx ? contextualPrompts : generalPrompts;

  return (
    <div className={cn("flex min-h-0 flex-col", className)}>
      <div className="flex-1 space-y-3 overflow-y-auto px-1 py-2" aria-live="polite">
        {messages.map((m, i) => (
          <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
            <div
              className={cn(
                "max-w-[85%] whitespace-pre-line rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                m.role === "user"
                  ? "rounded-br-md bg-ink text-white"
                  : "rounded-bl-md border border-line bg-surface text-ink-soft",
              )}
            >
              {m.text}
            </div>
          </div>
        ))}
        {typing && (
          <div className="flex">
            <div className="rounded-2xl rounded-bl-md border border-line bg-surface px-4 py-3">
              <span className="flex gap-1" aria-label="Tutor is typing">
                {[0, 1, 2].map((d) => (
                  <span
                    key={d}
                    className="size-1.5 animate-bounce rounded-full bg-ink-muted"
                    style={{ animationDelay: `${d * 120}ms` }}
                  />
                ))}
              </span>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="flex flex-wrap gap-2 pb-3 pt-2">
        {prompts.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => send(p)}
            className="rounded-full border border-line bg-surface px-3 py-1.5 text-xs text-ink-soft hover:border-accent-line hover:text-accent-strong"
          >
            {p}
          </button>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex items-center gap-2 rounded-xl border border-line bg-surface p-1.5 focus-within:border-accent-line"
      >
        <label htmlFor="tutor-input" className="sr-only">
          Message the tutor
        </label>
        <input
          id="tutor-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question…"
          className="h-9 min-w-0 flex-1 bg-transparent px-2 text-sm text-ink outline-none placeholder:text-ink-muted"
        />
        <button
          type="submit"
          disabled={!input.trim() || typing}
          className="grid size-9 place-items-center rounded-lg bg-accent text-white disabled:bg-line-strong"
        >
          <Send className="size-4" aria-hidden />
          <span className="sr-only">Send</span>
        </button>
      </form>
      <p className="mt-2 text-center text-[11px] text-ink-muted">
        Demo tutor · scripted replies · no AI is connected yet
      </p>
    </div>
  );
}

export function TutorDrawer({ ctx, onClose }: { ctx: TutorContext; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby="tutor-title">
      <button
        type="button"
        aria-label="Close tutor"
        className="absolute inset-0 bg-ink/30 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className="absolute inset-x-0 bottom-0 flex h-[85dvh] flex-col rounded-t-3xl bg-canvas p-4 shadow-[var(--shadow-lift)] sm:inset-y-0 sm:left-auto sm:right-0 sm:h-full sm:w-[420px] sm:rounded-none sm:rounded-l-3xl sm:p-6">
        <div className="mb-2 flex items-center justify-between">
          <h2 id="tutor-title" className="flex items-center gap-2 font-semibold text-ink">
            <span className="grid size-8 place-items-center rounded-lg bg-accent-soft text-accent">
              <Sparkles className="size-4" aria-hidden />
            </span>
            AI tutor
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="grid size-9 place-items-center rounded-lg text-ink-muted hover:bg-sunken"
          >
            <X className="size-5" aria-hidden />
            <span className="sr-only">Close</span>
          </button>
        </div>
        <TutorChat ctx={ctx} className="flex-1" />
      </div>
    </div>
  );
}
