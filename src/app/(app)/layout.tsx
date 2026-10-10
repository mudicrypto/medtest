import { Suspense } from "react";
import { AppShell } from "@/components/app-shell";
import { AccountMenu, AccountMenuSkeleton } from "@/components/account-menu";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  // The account menu reads the session, so it streams in behind its own
  // boundary; the rest of the shell renders immediately.
  return (
    <AppShell
      account={
        <Suspense fallback={<AccountMenuSkeleton />}>
          <AccountMenu />
        </Suspense>
      }
    >
      {children}
    </AppShell>
  );
}
