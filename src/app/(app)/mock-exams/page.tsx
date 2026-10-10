import type { Metadata } from "next";
import { MockExamsView } from "./view";

export const metadata: Metadata = { title: "Mock exams" };

export default function Page() {
  return <MockExamsView />;
}
