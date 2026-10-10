import type { Metadata } from "next";
import { Suspense } from "react";
import { Card, Skeleton } from "@/components/ui";
import { LoginForm } from "./form";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <Card className="p-6 sm:p-8">
      <h1 className="text-xl font-semibold text-ink">Sign in</h1>
      <p className="mt-1 text-sm text-ink-muted">Welcome back. Continue your preparation.</p>
      {/* The form reads ?next= and notices from the URL, known only at request time. */}
      <Suspense fallback={<Skeleton className="mt-6 h-64" />}>
        <LoginForm />
      </Suspense>
    </Card>
  );
}
