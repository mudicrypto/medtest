import { NotFoundScreen } from "@/components/not-found-screen";

// Shown inside the app (menu still visible) when a page calls notFound(),
// e.g. a question that doesn't exist or isn't published.
export default function NotFound() {
  return <NotFoundScreen />;
}
