"use client"; // Error boundaries must be Client Components

import { ErrorScreen } from "@/components/error-screen";

// Catches errors on the signed-in pages; the navigation stays usable.
export default function Error(props: { error: Error & { digest?: string }; retry: () => void }) {
  return <ErrorScreen {...props} />;
}
