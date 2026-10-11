import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TUTOR_ENABLED } from "@/lib/features";
import { TutorView } from "./view";

export const metadata: Metadata = { title: "AI tutor" };

export default function Page() {
  // Hidden until the real tutor exists (see src/lib/features.ts).
  if (!TUTOR_ENABLED) notFound();
  return <TutorView />;
}
