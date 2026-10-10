import type { Metadata } from "next";
import { TerminologyView } from "./view";

export const metadata: Metadata = { title: "Terminology" };

export default function Page() {
  return <TerminologyView />;
}
