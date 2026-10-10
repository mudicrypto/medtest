"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/components/ui";

const tabs = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/questions", label: "Questions" },
  { href: "/admin/import", label: "Import" },
  { href: "/admin/sources", label: "Sources" },
];

// Reading the URL can suspend during prerendering; show plain tabs until then.
export function AdminTabs() {
  return (
    <Suspense fallback={<Tabs pathname={null} />}>
      <ActiveTabs />
    </Suspense>
  );
}

function ActiveTabs() {
  return <Tabs pathname={usePathname()} />;
}

function Tabs({ pathname }: { pathname: string | null }) {
  return (
    <nav aria-label="Admin" className="-mx-1 mb-8 flex gap-1 overflow-x-auto border-b border-line">
      {tabs.map((t) => {
        const active = !!pathname && (t.href === "/admin" ? pathname === "/admin" : pathname.startsWith(t.href));
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "-mb-px whitespace-nowrap border-b-2 px-3 py-2.5 text-sm",
              active ? "border-accent font-medium text-ink" : "border-transparent text-ink-muted hover:text-ink",
            )}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
