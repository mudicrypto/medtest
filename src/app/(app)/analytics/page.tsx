import type { Metadata } from "next";
import { AnalyticsView } from "./view";

export const metadata: Metadata = { title: "Progress" };

export default function Page() {
  return <AnalyticsView />;
}
