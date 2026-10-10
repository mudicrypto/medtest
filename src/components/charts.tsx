"use client";

import { useState } from "react";
import type { DayStat, TopicStat } from "@/lib/analytics";
import { cn } from "./ui";

function shortDate(iso: string) {
  const [, m, d] = iso.split("-").map(Number);
  return new Date(2000, m - 1, d).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

/** Horizontal bars, one per topic, weakest first. Single hue: magnitude only. */
export function TopicBars({ stats }: { stats: TopicStat[] }) {
  const rows = [...stats].sort((a, b) => (a.accuracy ?? -1) - (b.accuracy ?? -1));
  return (
    <figure>
      <ul className="space-y-3.5">
        {rows.map((s) => (
          <li key={s.slug} className="group relative">
            <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
              <span className="truncate text-ink-soft">{s.name}</span>
              <span className="shrink-0 tabular-nums text-ink">
                {s.accuracy === null ? <span className="text-ink-muted">—</span> : `${s.accuracy}%`}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-sunken">
              {s.accuracy !== null && (
                <div
                  className="h-full rounded-full bg-accent transition-[width] duration-700 group-hover:bg-accent-strong"
                  style={{ width: `${Math.max(2, s.accuracy)}%` }}
                />
              )}
            </div>
            <span
              role="tooltip"
              className="pointer-events-none absolute -top-8 right-0 z-10 hidden rounded-md bg-ink px-2 py-1 text-xs text-white shadow group-hover:block"
            >
              {s.correct} of {s.answered} correct
            </span>
          </li>
        ))}
      </ul>
      <DataTable
        caption="Accuracy by topic"
        head={["Topic", "Answered", "Correct", "Accuracy"]}
        rows={stats.map((s) => [s.name, s.answered, s.correct, s.accuracy === null ? "—" : `${s.accuracy}%`])}
      />
    </figure>
  );
}

const W = 640;
const H = 200;
const PAD = { l: 44, r: 28, t: 12, b: 26 };

/** Daily accuracy line (0–100%). Days with no answers are gaps, not zeros. */
export function AccuracyTrend({ days }: { days: DayStat[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const iw = W - PAD.l - PAD.r;
  const ih = H - PAD.t - PAD.b;
  const x = (i: number) => PAD.l + (days.length === 1 ? iw / 2 : (i * iw) / (days.length - 1));
  const y = (v: number) => PAD.t + ih - (v / 100) * ih;

  // Build path segments that break across empty days.
  const segments: string[] = [];
  let cur = "";
  days.forEach((d, i) => {
    if (d.accuracy === null) {
      if (cur) segments.push(cur);
      cur = "";
      return;
    }
    cur += `${cur ? "L" : "M"}${x(i).toFixed(1)},${y(d.accuracy).toFixed(1)}`;
  });
  if (cur) segments.push(cur);

  const h = hover !== null ? days[hover] : null;

  return (
    <figure>
      <div className="relative">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-auto w-full touch-none select-none"
          role="img"
          aria-label="Daily accuracy over the last 14 days"
          onPointerLeave={() => setHover(null)}
          onPointerMove={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            const px = ((e.clientX - r.left) / r.width) * W;
            const i = Math.round(((px - PAD.l) / iw) * (days.length - 1));
            setHover(Math.max(0, Math.min(days.length - 1, i)));
          }}
        >
          {[0, 50, 100].map((g) => (
            <g key={g}>
              <line x1={PAD.l} x2={W - PAD.r} y1={y(g)} y2={y(g)} stroke="var(--color-line)" strokeDasharray={g ? "3 4" : undefined} />
              <text x={PAD.l - 8} y={y(g) + 4} textAnchor="end" className="fill-ink-muted text-[11px]">
                {g}%
              </text>
            </g>
          ))}
          {days.map((d, i) =>
            i % 3 === 0 || i === days.length - 1 ? (
              <text key={d.date} x={x(i)} y={H - 6} textAnchor={i === days.length - 1 ? "end" : "middle"} className="fill-ink-muted text-[11px]">
                {shortDate(d.date)}
              </text>
            ) : null,
          )}
          {hover !== null && (
            <line x1={x(hover)} x2={x(hover)} y1={PAD.t} y2={PAD.t + ih} stroke="var(--color-line-strong)" />
          )}
          {segments.map((s, i) => (
            <path key={i} d={s} fill="none" stroke="var(--color-accent)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          ))}
          {days.map((d, i) =>
            d.accuracy === null ? null : (
              <circle
                key={d.date}
                cx={x(i)}
                cy={y(d.accuracy)}
                r={hover === i ? 5 : 3.5}
                fill="var(--color-surface)"
                stroke="var(--color-accent)"
                strokeWidth={2}
              />
            ),
          )}
        </svg>
        {h && hover !== null && (
          <div
            className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-lg bg-ink px-2.5 py-1.5 text-xs text-white shadow"
            style={{ left: `${(x(hover) / W) * 100}%` }}
          >
            <span className="font-medium">{shortDate(h.date)}</span>
            <span className="text-white/75">
              {" "}
              · {h.accuracy === null ? "no practice" : `${h.accuracy}% of ${h.answered}`}
            </span>
          </div>
        )}
      </div>
      <DataTable
        caption="Daily accuracy"
        head={["Date", "Answered", "Accuracy"]}
        rows={days.map((d) => [shortDate(d.date), d.answered, d.accuracy === null ? "—" : `${d.accuracy}%`])}
      />
    </figure>
  );
}

/** Small column chart of questions answered per day. */
export function VolumeColumns({ days }: { days: DayStat[] }) {
  const max = Math.max(1, ...days.map((d) => d.answered));
  return (
    <div className="flex h-24 items-end gap-[2px]" role="img" aria-label="Questions answered per day, last 14 days">
      {days.map((d, i) => (
        <div key={d.date} className="group relative flex h-full flex-1 items-end">
          <div
            className={cn(
              "w-full rounded-t-[4px] transition-colors",
              d.answered ? "bg-accent/80 group-hover:bg-accent-strong" : "bg-sunken",
              i === days.length - 1 && d.answered > 0 && "bg-accent",
            )}
            style={{ height: d.answered ? `${(d.answered / max) * 100}%` : "3px" }}
          />
          <span
            role="tooltip"
            className="pointer-events-none absolute -top-7 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-ink px-2 py-1 text-xs text-white group-hover:block"
          >
            {shortDate(d.date)} · {d.answered}
          </span>
        </div>
      ))}
    </div>
  );
}

function DataTable({ caption, head, rows }: { caption: string; head: string[]; rows: (string | number)[][] }) {
  return (
    <details className="mt-4 text-sm">
      <summary className="cursor-pointer text-xs text-ink-muted hover:text-ink">View as table</summary>
      <div className="mt-2 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr className="border-b border-line text-xs text-ink-muted">
              {head.map((h) => (
                <th key={h} className="py-1.5 pr-4 font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-b border-line/60">
                {r.map((c, j) => (
                  <td key={j} className="py-1.5 pr-4 tabular-nums text-ink-soft">
                    {c}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
