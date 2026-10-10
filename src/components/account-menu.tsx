import Link from "next/link";
import { LogOut, Settings, ShieldCheck } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { signOut } from "@/app/(auth)/actions";

/** Signed-in user's name with Settings and Sign out. Server component. */
export async function AccountMenu() {
  const user = await getCurrentUser();
  const initials = user.displayName
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="rounded-xl border border-line bg-surface p-3">
      <div className="flex items-center gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-ink text-xs font-semibold text-white">
          {initials || "?"}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-ink" data-testid="account-name">
            {user.displayName}
          </p>
          <p className="truncate text-xs text-ink-muted">{user.email}</p>
        </div>
      </div>
      {(user.role === "admin" || user.role === "reviewer") && (
        <Link
          href="/admin"
          className="mt-3 flex h-8 items-center justify-center gap-1.5 rounded-lg bg-sunken text-xs font-medium text-ink-soft hover:text-ink"
        >
          <ShieldCheck className="size-3.5" aria-hidden /> Content admin
        </Link>
      )}
      <div className="mt-2 grid grid-cols-2 gap-1.5">
        <Link
          href="/settings"
          className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg text-xs text-ink-soft hover:bg-sunken hover:text-ink"
        >
          <Settings className="size-3.5" aria-hidden /> Settings
        </Link>
        <form action={signOut}>
          <button
            type="submit"
            className="inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-lg text-xs text-ink-soft hover:bg-sunken hover:text-ink"
          >
            <LogOut className="size-3.5" aria-hidden /> Sign out
          </button>
        </form>
      </div>
    </div>
  );
}

export function AccountMenuSkeleton() {
  return <div className="h-[104px] animate-pulse rounded-xl bg-sunken" />;
}
