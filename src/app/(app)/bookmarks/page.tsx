import type { Metadata } from "next";
import { BookmarksView } from "./view";

export const metadata: Metadata = { title: "Bookmarks" };

export default function Page() {
  return <BookmarksView />;
}
