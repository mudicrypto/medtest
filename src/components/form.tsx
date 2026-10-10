"use client";

import { useState, type ComponentProps } from "react";
import { useFormStatus } from "react-dom";
import { CircleAlert, CircleCheck, Eye, EyeOff, LoaderCircle } from "lucide-react";
import { Button, cn } from "./ui";

export function Field({
  label,
  error,
  hint,
  className,
  type,
  ...input
}: ComponentProps<"input"> & { label: string; error?: string; hint?: string; name: string }) {
  const id = `f-${input.name}`;
  const [show, setShow] = useState(false);
  const isPassword = type === "password";
  return (
    <div className={className}>
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
      </label>
      <div className="relative mt-1.5">
        <input
          id={id}
          type={isPassword && show ? "text" : type}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-err` : hint ? `${id}-hint` : undefined}
          className={cn(
            "h-11 w-full rounded-xl border bg-surface px-3.5 text-[0.95rem] text-ink outline-none transition-colors placeholder:text-ink-muted focus:border-accent focus:ring-2 focus:ring-accent/15",
            error ? "border-danger" : "border-line hover:border-line-strong",
            isPassword && "pr-11",
          )}
          {...input}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            className="absolute right-1 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-lg text-ink-muted hover:text-ink"
          >
            {show ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
            <span className="sr-only">{show ? "Hide password" : "Show password"}</span>
          </button>
        )}
      </div>
      {error ? (
        <p id={`${id}-err`} className="mt-1.5 text-sm text-danger">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="mt-1.5 text-xs text-ink-muted">
            {hint}
          </p>
        )
      )}
    </div>
  );
}

export function SubmitButton({
  children,
  pendingText,
  className,
  variant = "primary",
}: {
  children: React.ReactNode;
  pendingText: string;
  className?: string;
  variant?: "primary" | "secondary";
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant={variant} disabled={pending} className={cn("h-11 w-full", className)}>
      {pending ? (
        <>
          <LoaderCircle className="size-4 animate-spin" aria-hidden /> {pendingText}
        </>
      ) : (
        children
      )}
    </Button>
  );
}

export function Alert({ tone, children }: { tone: "error" | "success" | "info"; children: React.ReactNode }) {
  const styles = {
    error: "bg-danger-soft text-danger",
    success: "bg-success-soft text-success",
    info: "bg-accent-soft text-accent-strong",
  }[tone];
  const Icon = tone === "error" ? CircleAlert : CircleCheck;
  return (
    <div role={tone === "error" ? "alert" : "status"} className={cn("flex gap-2.5 rounded-xl p-3.5 text-sm", styles)}>
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div>{children}</div>
    </div>
  );
}
