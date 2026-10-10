import type { Metadata } from "next";
import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import { listTopicsWithCounts } from "@/lib/content/queries";
import { DashboardSkeleton, DashboardView } from "./view";

export const metadata: Metadata = { title: "Dashboard" };

export default function Page() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <Dashboard />
    </Suspense>
  );
}

async function Dashboard() {
  const topics = await listTopicsWithCounts();
  return (
    <DashboardView
      topics={topics}
      greeting={
        <Suspense fallback="Welcome back">
          <Greeting />
        </Suspense>
      }
    />
  );
}

async function Greeting() {
  const user = await getCurrentUser();
  const first = user.displayName.split(/\s+/)[0];
  const days = daysUntil(user.targetExamDate);
  return (
    <>
      Welcome back, {first}
      {days !== null && (
        <span className="mt-1.5 block text-sm font-normal tracking-normal text-ink-muted">
          {days > 0
            ? `${days} ${days === 1 ? "day" : "days"} until your exam`
            : days === 0
              ? "Your exam is today — good luck!"
              : "Exam date passed — update it in Settings"}
        </span>
      )}
    </>
  );
}

function daysUntil(isoDate: string | null): number | null {
  if (!isoDate) return null;
  const [y, m, d] = isoDate.split("-").map(Number);
  const today = new Date();
  const start = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((Date.UTC(y, m - 1, d) - start) / 86_400_000);
}
