"use client";

import { useEffect, useSyncExternalStore } from "react";
import { WifiOff } from "lucide-react";
import { useProgress } from "@/lib/progress-store";

function subscribe(onChange: () => void) {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
}

/**
 * Tells the student when their device is offline, so failures that follow
 * have an obvious cause. When the connection returns, saved progress that
 * failed to load is fetched again automatically.
 */
export function OfflineNotice() {
  // The server always renders "online"; the browser corrects it after hydration.
  const online = useSyncExternalStore(subscribe, () => navigator.onLine, () => true);
  const { ready, error, retry } = useProgress();

  useEffect(() => {
    if (online && !ready && error) retry();
    // Only react to the connection coming back, not to every error change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [online]);

  if (online) return null;
  return (
    <div role="status" className="mb-6 flex items-center gap-3 rounded-xl bg-warning-soft p-3.5 text-sm text-warning">
      <WifiOff className="size-4 shrink-0" aria-hidden />
      <span>You&apos;re offline. Questions can&apos;t be loaded or answers saved until you reconnect.</span>
    </div>
  );
}
