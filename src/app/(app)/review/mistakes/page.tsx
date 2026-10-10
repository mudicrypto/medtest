import type { Metadata } from "next";
import { MistakesView } from "./view";

export const metadata: Metadata = { title: "Mistakes" };

export default function Page() {
  return <MistakesView />;
}
