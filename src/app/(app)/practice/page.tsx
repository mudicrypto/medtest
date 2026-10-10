import type { Metadata } from "next";
import { PracticeView } from "./view";

export const metadata: Metadata = { title: "Practice" };

export default function Page() {
  return <PracticeView />;
}
