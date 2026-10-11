import type { Metadata } from "next";
import { NotFoundScreen } from "@/components/not-found-screen";

export const metadata: Metadata = { title: "Page not found" };

// Any address that doesn't match a page.
export default function NotFound() {
  return (
    <main className="px-4 py-12">
      <NotFoundScreen home="/" homeLabel="Go to the home page" />
    </main>
  );
}
