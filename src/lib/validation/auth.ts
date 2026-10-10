import { z } from "zod";

export const email = z.string().trim().toLowerCase().pipe(z.email({ error: "Enter a valid email address." }));

// Matches the server rule in supabase/config.toml: 8+ characters, letters and digits.
export const password = z
  .string()
  .min(8, { error: "Use at least 8 characters." })
  .max(72, { error: "Use at most 72 characters." })
  .regex(/[A-Za-z]/, { error: "Include at least one letter." })
  .regex(/[0-9]/, { error: "Include at least one number." });

export const displayName = z
  .string()
  .trim()
  .min(1, { error: "Enter your name." })
  .max(80, { error: "Keep it under 80 characters." });

export const signUpSchema = z.object({ displayName, email, password });
export const signInSchema = z.object({ email, password: z.string().min(1, { error: "Enter your password." }) });
export const resetRequestSchema = z.object({ email });
export const newPasswordSchema = z
  .object({ password, confirm: z.string() })
  .refine((v) => v.password === v.confirm, { path: ["confirm"], error: "Passwords don't match." });

export const profileSchema = z.object({
  displayName,
  targetExamDate: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : v))
    .pipe(z.iso.date({ error: "Enter a valid date." }).nullable()),
  showRussian: z.boolean(),
});

/** First error message per field, for showing under inputs. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    out[key] ??= issue.message;
  }
  return out;
}
