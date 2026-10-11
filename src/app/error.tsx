"use client"; // Error boundaries must be Client Components

import { ErrorScreen } from "@/components/error-screen";

// Catches errors anywhere else (sign-in pages, the app shell itself).
export default function Error(props: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <main className="px-4 py-12">
      <ErrorScreen {...props} />
    </main>
  );
}
