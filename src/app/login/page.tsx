import type { Metadata } from "next";
import Link from "next/link";
import { Info } from "lucide-react";
import { Logo } from "@/components/logo";
import { ButtonLink, Card } from "@/components/ui";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <div className="grid min-h-dvh place-items-center bg-canvas px-4 py-10">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 flex justify-center">
          <Logo />
        </Link>
        <Card className="p-6 sm:p-8">
          <h1 className="text-xl font-semibold text-ink">Sign in</h1>
          <p className="mt-1 text-sm text-ink-muted">Welcome back. Continue your preparation.</p>

          {/* Visual only — real authentication (Supabase Auth) arrives in Milestone 2. */}
          <div className="mt-6 space-y-4" aria-disabled>
            <label className="block">
              <span className="text-sm font-medium text-ink">Email</span>
              <input
                type="email"
                disabled
                placeholder="you@example.com"
                className="mt-1.5 h-11 w-full rounded-xl border border-line bg-sunken/60 px-3.5 text-sm placeholder:text-ink-muted"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-ink">Password</span>
              <input
                type="password"
                disabled
                placeholder="••••••••"
                className="mt-1.5 h-11 w-full rounded-xl border border-line bg-sunken/60 px-3.5 text-sm placeholder:text-ink-muted"
              />
            </label>
          </div>

          <div className="mt-5 flex gap-2.5 rounded-xl bg-accent-soft p-3.5 text-sm text-accent-strong">
            <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
            <p>Accounts arrive in the next milestone. For now, continue as a demo student.</p>
          </div>

          <ButtonLink href="/dashboard" className="mt-5 h-11 w-full">
            Continue as demo student
          </ButtonLink>
        </Card>
      </div>
    </div>
  );
}
