import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Bookmark,
  BookOpen,
  ChartColumn,
  FileText,
  FlaskConical,
  Languages,
  PenLine,
  RotateCcw,
  Sparkles,
  Timer,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { Badge, ButtonLink, Card } from "@/components/ui";
import { TUTOR_ENABLED } from "@/lib/features";

const features = [
  { icon: BookOpen, title: "Topic-based question bank", text: "Four-option questions in English, organised by specialty, with clear explanations." },
  { icon: Languages, title: "Russian alongside English", text: "Show the Russian text and key terms next to every question when you're ready." },
  { icon: RotateCcw, title: "Personal spaced repetition", text: "Missed questions and new terms return exactly when you need to see them again." },
  { icon: Timer, title: "Timed mock exams", text: "Practise under exam conditions, then review every answer by topic." },
  { icon: ChartColumn, title: "Progress you can act on", text: "See your weakest topics and how your accuracy changes week to week." },
  TUTOR_ENABLED
    ? { icon: Sparkles, title: "Context-aware AI tutor", text: "Ask why an answer is right, get memory hooks, and practise terminology." }
    : { icon: Bookmark, title: "Bookmarks and mistakes", text: "Save questions to revisit, and retry every question you got wrong." },
];

const labels = [
  { icon: BadgeCheck, tone: "accent" as const, label: "Official source · verified", text: "Matches published official material, with a citation and verification date." },
  { icon: FileText, tone: "neutral" as const, label: "Adapted from official source", text: "Based on official material, reworded or translated — always marked as adapted." },
  { icon: PenLine, tone: "neutral" as const, label: "MedPrep original practice", text: "Written by our team to teach the topic. Never presented as an official item." },
  { icon: FlaskConical, tone: "warning" as const, label: "DEMO — not for study", text: "Placeholder content in this prototype only." },
];

export default function Home() {
  return (
    <div className="min-h-dvh overflow-x-clip bg-canvas">
      <header className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo />
        <nav className="flex items-center gap-1 sm:gap-2">
          <ButtonLink href="/login" variant="ghost">
            Sign in
          </ButtonLink>
          <ButtonLink href="/signup" className="hidden sm:inline-flex">
            Create account
          </ButtonLink>
        </nav>
      </header>

      <main>
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-20 pt-10 sm:px-6 sm:pt-16 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:pt-24">
          <div>
            <Badge tone="accent">For international medical graduates</Badge>
            <h1 className="mt-5 text-[2.5rem] font-semibold leading-[1.08] tracking-tight text-ink sm:text-[3.4rem]">
              Learn the medicine.
              <br />
              <span className="text-accent">Master the Russian exam.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-muted">
              Focused preparation for Primary Accreditation in General Medicine{" "}
              <span lang="ru" className="whitespace-nowrap text-ink-soft">
                (Лечебное дело)
              </span>
              . Study in English, build your Russian medical vocabulary, and always know where every question comes from.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/signup" className="h-12 px-6 text-base">
                Create free account <ArrowRight className="size-4" aria-hidden />
              </ButtonLink>
              <ButtonLink href="/login" variant="secondary" className="h-12 px-6 text-base">
                Sign in
              </ButtonLink>
            </div>
            <p className="mt-4 text-sm text-ink-muted">Free while in development · practice content is currently demo content</p>
          </div>

          {/* Static preview of a question card */}
          <div className="relative" aria-hidden>
            <div className="absolute -inset-3 -z-10 sm:-inset-6 rounded-[2.5rem] bg-gradient-to-br from-accent-soft via-transparent to-sunken" />
            <Card className="overflow-hidden shadow-[var(--shadow-lift)]">
              <div className="flex items-center gap-2 border-b border-line px-5 py-3">
                <Badge>Cardiology</Badge>
                <Badge tone="warning">
                  <FlaskConical className="size-3.5" /> DEMO
                </Badge>
              </div>
              <div className="p-5 sm:p-6">
                <p className="font-serif text-[1.05rem] leading-relaxed text-ink">
                  ECG shows ST elevation in II, III and aVF. Occlusion of which artery is most likely?
                </p>
                <p lang="ru" className="mt-2 border-l-2 border-accent-line pl-3 font-serif text-sm text-ink-muted">
                  Подъём сегмента ST в отведениях II, III, aVF. Окклюзия какой артерии наиболее вероятна?
                </p>
                <div className="mt-5 space-y-2">
                  {["Left anterior descending", "Right coronary artery", "Left circumflex"].map((o, i) => (
                    <div
                      key={o}
                      className={
                        i === 1
                          ? "flex items-center gap-3 rounded-xl border border-success bg-success-soft px-3.5 py-2.5 text-sm text-ink"
                          : "flex items-center gap-3 rounded-xl border border-line px-3.5 py-2.5 text-sm text-ink-soft"
                      }
                    >
                      <span
                        className={
                          i === 1
                            ? "grid size-6 place-items-center rounded-md bg-success text-xs font-semibold text-white"
                            : "grid size-6 place-items-center rounded-md border border-line-strong text-xs font-semibold"
                        }
                      >
                        {"ABC"[i]}
                      </span>
                      {o}
                    </div>
                  ))}
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="rounded-lg border border-line px-2.5 py-1 text-xs">
                    <span lang="ru" className="font-medium text-ink">подъём сегмента ST</span>
                    <span className="text-ink-muted"> · ST elevation</span>
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </section>

        <section className="border-y border-line bg-surface py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="max-w-xl text-3xl font-semibold tracking-tight text-ink">Everything in one calm, focused place</h2>
            <div className="mt-10 grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((f) => (
                <div key={f.title}>
                  <span className="grid size-10 place-items-center rounded-xl bg-accent-soft text-accent">
                    <f.icon className="size-5" aria-hidden />
                  </span>
                  <h3 className="mt-4 font-semibold text-ink">{f.title}</h3>
                  <p className="mt-1.5 text-[0.95rem] leading-relaxed text-ink-muted">{f.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="grid gap-10 lg:grid-cols-[1fr_1.3fr] lg:gap-16">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent">Content integrity</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-ink">You always know what you&apos;re studying</h2>
              <p className="mt-4 leading-relaxed text-ink-muted">
                Every question carries a visible label showing where it comes from, and only medically reviewed content
                is published. We never present practice material as official exam content, and exam rules are shown
                with their source and the date they were last checked.
              </p>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2">
              {labels.map((l) => (
                <li key={l.label}>
                  <Card className="h-full p-5">
                    <Badge tone={l.tone}>
                      <l.icon className="size-3.5" aria-hidden /> {l.label}
                    </Badge>
                    <p className="mt-3 text-sm leading-relaxed text-ink-muted">{l.text}</p>
                  </Card>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-ink-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <Logo />
          <p>Prototype · demo content only · exam formats shown are not official rules.</p>
          <Link href="/dashboard" className="text-accent hover:underline">
            Open the app
          </Link>
        </div>
      </footer>
    </div>
  );
}
