import { Suspense } from "react";
import { AppShell } from "@/components/app-shell";
import { ProgressProvider } from "@/lib/progress-store";
import { ProgressStatus } from "@/components/progress-status";
import { AccountMenu, AccountMenuSkeleton } from "@/components/account-menu";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  // The account menu reads the session, so it streams in behind its own
  // boundary; the rest of the shell renders immediately.
  return (
    <ProgressProvider>
      <AppShell
      account={
        <Suspense fallback={<AccountMenuSkeleton />}>
          <AccountMenu />
        </Suspense>
      }
    >
        <ProgressStatus />
        {children}
      </AppShell>
    </ProgressProvider>
  );
}
