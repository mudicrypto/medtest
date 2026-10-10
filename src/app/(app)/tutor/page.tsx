import type { Metadata } from "next";
import { TutorView } from "./view";

export const metadata: Metadata = { title: "AI tutor" };

export default function Page() {
  return <TutorView />;
}
