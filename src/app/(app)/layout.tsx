import { Suspense } from "react";
import { AppShell } from "@/components/app-shell";
import { ProgressProvider } from "@/lib/progress-store";
import { ProgressStatus } from "@/components/progress-status";
import { OfflineNotice } from "@/components/offline-notice";
import { AccountMenu, AccountMenuSkeleton } from "@/components/account-menu";
import { AccountMenuBoundary } from "@/components/account-menu-boundary";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  // The account menu reads the session, so it streams in behind its own
  // boundary; the rest of the shell renders immediately.
  return (
    <ProgressProvider>
      <AppShell
      account={
        <AccountMenuBoundary>
          <Suspense fallback={<AccountMenuSkeleton />}>
            <AccountMenu />
          </Suspense>
        </AccountMenuBoundary>
      }
    >
        <OfflineNotice />
        <ProgressStatus />
        {children}
      </AppShell>
    </ProgressProvider>
  );
}
