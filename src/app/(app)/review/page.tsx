import type { Metadata } from "next";
import { ReviewView } from "./view";

export const metadata: Metadata = { title: "Daily review" };

export default function Page() {
  return <ReviewView />;
}
