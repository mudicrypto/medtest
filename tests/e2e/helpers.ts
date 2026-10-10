import { execSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";

type Status = { API_URL: string; SECRET_KEY: string; MAILPIT_URL: string };

// Local Supabase stack details, read from the CLI (nothing secret in the repo).
export const local = JSON.parse(
  execSync("pnpm exec supabase status -o json", { encoding: "utf8" }).replace(/^[^{]*/, ""),
) as Status;

export const admin = createClient(local.API_URL, local.SECRET_KEY, { auth: { persistSession: false } });

export const PASSWORD = "Medprep2026";

export function uniqueEmail(tag: string) {
  return `${tag}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.test`;
}

/** Create a confirmed user directly (skips the email step). */
export async function createConfirmedUser(email: string, displayName: string, password = PASSWORD) {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name: displayName },
  });
  if (error) throw error;
  return data.user.id;
}

/** Poll the local test mailbox (Mailpit) for the newest email to `to` and return the first link in it. */
export async function latestEmailLink(to: string, subjectIncludes: string): Promise<string> {
  for (let i = 0; i < 40; i++) {
    const res = await fetch(`${local.MAILPIT_URL}/api/v1/search?query=${encodeURIComponent(`to:"${to}"`)}`);
    const { messages } = (await res.json()) as { messages: { ID: string; Subject: string }[] };
    const msg = messages.find((m) => m.Subject.toLowerCase().includes(subjectIncludes.toLowerCase()));
    if (msg) {
      const full = (await (await fetch(`${local.MAILPIT_URL}/api/v1/message/${msg.ID}`)).json()) as { Text: string; HTML: string };
      const link = (full.HTML.match(/href="([^"]+)"/) ?? full.Text.match(/(https?:\/\/\S+)/))?.[1];
      if (link) return link.replaceAll("&amp;", "&");
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`No "${subjectIncludes}" email for ${to}`);
}
