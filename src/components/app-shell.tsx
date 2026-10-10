"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import {
  BookOpen,
  Bookmark,
  ChartColumn,
  CircleX,
  FlaskConical,
  Languages,
  LayoutDashboard,
  Menu,
  RotateCcw,
  Sparkles,
  Timer,
  X,
} from "lucide-react";
import { cn } from "./ui";
import { Logo } from "./logo";

const nav = [
  { href: "/dashboard", label: "Dashboard", short: "Home", icon: LayoutDashboard, primary: true },
  { href: "/practice", label: "Practice", short: "Practice", icon: BookOpen, primary: true },
  { href: "/review", label: "Daily review", short: "Review", icon: RotateCcw, primary: true },
  { href: "/mock-exams", label: "Mock exams", short: "Mock", icon: Timer, primary: false },
  { href: "/terminology", label: "Terminology", short: "Terms", icon: Languages, primary: true },
  { href: "/review/mistakes", label: "Mistakes", short: "Mistakes", icon: CircleX, primary: false },
  { href: "/bookmarks", label: "Bookmarks", short: "Saved", icon: Bookmark, primary: false },
  { href: "/analytics", label: "Progress", short: "Progress", icon: ChartColumn, primary: true },
  { href: "/tutor", label: "AI tutor", short: "Tutor", icon: Sparkles, primary: false },
];

type Variant = "sidebar" | "menu" | "tabs";

function isActive(pathname: string | null, href: string) {
  if (!pathname) return false;
  if (href === "/review") return pathname === "/review";
  return pathname === href || pathname.startsWith(href + "/");
}

/** The links themselves; `pathname` is null while the current URL is unknown. */
function NavLinks({ variant, pathname }: { variant: Variant; pathname: string | null }) {
  const items = variant === "tabs" ? nav.filter((i) => i.primary) : nav;
  return items.map((item) => {
    const active = isActive(pathname, item.href);
    const Icon = item.icon;
    if (variant === "tabs") {
      return (
        <Link
          key={item.href}
          href={item.href}
          aria-current={active ? "page" : undefined}
          className={cn("flex flex-col items-center gap-1 py-2.5 text-[11px]", active ? "font-medium text-accent" : "text-ink-muted")}
        >
          <Icon className="size-5" aria-hidden />
          {item.short}
        </Link>
      );
    }
    return (
      <Link
        key={item.href}
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex items-center rounded-lg text-sm transition-colors",
          variant === "sidebar" ? "gap-3 px-3 py-2" : "gap-2.5 px-3 py-3",
          active ? "bg-accent-soft font-medium text-accent-strong" : "text-ink-soft hover:bg-sunken hover:text-ink",
        )}
      >
        <Icon className="size-[18px]" aria-hidden />
        {item.label}
      </Link>
    );
  });
}

function ActiveNavLinks({ variant }: { variant: Variant }) {
  return <NavLinks variant={variant} pathname={usePathname()} />;
}

/**
 * Highlights the current page. Reading the URL can suspend while a page is
 * prerendered, so the links first render unhighlighted, then highlight.
 */
function Nav({ variant }: { variant: Variant }) {
  return (
    <Suspense fallback={<NavLinks variant={variant} pathname={null} />}>
      <ActiveNavLinks variant={variant} />
    </Suspense>
  );
}

function CloseOnNavigate({ onNavigate }: { onNavigate: () => void }) {
  const pathname = usePathname();
  useEffect(onNavigate, [pathname, onNavigate]);
  return null;
}

export function AppShell({ children, account }: { children: React.ReactNode; account: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [closeMenu] = useState(() => () => setMenuOpen(false));

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[256px_1fr]">
      <Suspense>
        <CloseOnNavigate onNavigate={closeMenu} />
      </Suspense>

      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-line bg-surface/70 px-4 py-6 backdrop-blur lg:flex">
        <Link href="/" className="mb-8 px-2">
          <Logo />
        </Link>
        <nav aria-label="Main" className="flex flex-col gap-0.5">
          <Nav variant="sidebar" />
        </nav>
        <div className="mt-auto space-y-3">
          <div className="rounded-xl border border-[#fedf89] bg-warning-soft p-3 text-xs leading-relaxed text-warning">
            <p className="flex items-center gap-1.5 font-semibold">
              <FlaskConical className="size-3.5" aria-hidden /> Prototype
            </p>
            <p className="mt-1">Progress is saved only in this browser for now.</p>
          </div>
          {account}
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-surface/85 px-4 backdrop-blur lg:hidden">
          <Link href="/">
            <Logo />
          </Link>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            className="grid size-10 place-items-center rounded-lg text-ink-soft hover:bg-sunken"
          >
            {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            <span className="sr-only">{menuOpen ? "Close menu" : "Open menu"}</span>
          </button>
        </header>

        {menuOpen && (
          <nav
            id="mobile-menu"
            aria-label="All sections"
            className="fixed inset-x-0 top-14 z-30 max-h-[calc(100dvh-3.5rem)] overflow-y-auto border-b border-line bg-surface px-4 pb-4 pt-2 shadow-[var(--shadow-lift)] lg:hidden"
          >
            <div className="grid grid-cols-2 gap-1">
              <Nav variant="menu" />
            </div>
            <div className="mt-3">{account}</div>
          </nav>
        )}

        <div className="border-b border-[#fedf89] bg-warning-soft px-4 py-2 text-center text-xs text-warning lg:hidden">
          Prototype · progress saved in this browser only
        </div>

        <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-28 pt-6 sm:px-6 sm:pt-8 lg:px-10 lg:pb-16 lg:pt-12">
          {children}
        </main>

        {/* Mobile bottom tabs */}
        <nav
          aria-label="Primary"
          className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
        >
          <Nav variant="tabs" />
        </nav>
      </div>
    </div>
  );
}
