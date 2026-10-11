// One-step setup for working on MedPrep with the LOCAL database only.
// Usage: pnpm db:start   (once per session, needs Docker)
//        pnpm local:setup
//
// 1. Points the app at the local database by writing .env.local — but never
//    overwrites a .env.local that points at a real (cloud) Supabase project.
// 2. Creates two ready-to-use local accounts (a student and an admin).
//
// It refuses to run against anything except the local database on this
// computer, so it can't touch your real Supabase project.
import { execSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const ENV_FILE = ".env.local";
const PASSWORD = "Medprep-local-1";
const ACCOUNTS = [
  { email: "student@medprep.local", name: "Demo Student", role: "student" as const },
  { email: "admin@medprep.local", name: "Demo Admin", role: "admin" as const },
];

function fail(message: string): never {
  console.error(`\n✗ ${message}\n`);
  process.exit(1);
}

const isLocal = (url: string) => /^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?(\/|$)/.test(url);

// ── The local database must be running ──────────────────────────────────────
type Status = { API_URL: string; PUBLISHABLE_KEY: string; SECRET_KEY: string; MAILPIT_URL?: string };
let status: Status;
try {
  const raw = execSync("pnpm exec supabase status -o json", { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  status = JSON.parse(raw.replace(/^[^{]*/, "")) as Status;
} catch {
  fail("The local database isn't running. Start Docker Desktop, then run: pnpm db:start");
}
if (!isLocal(status.API_URL)) fail(`Expected a local database address, got ${status.API_URL}. Nothing was changed.`);

// ── .env.local ───────────────────────────────────────────────────────────────
const current = existsSync(ENV_FILE) ? readFileSync(ENV_FILE, "utf8") : null;
const currentUrl = current?.match(/^NEXT_PUBLIC_SUPABASE_URL=(.*)$/m)?.[1]?.trim();
if (current && currentUrl && !isLocal(currentUrl)) {
  fail(
    `${ENV_FILE} points at ${currentUrl}, so it was left unchanged and nothing else was done.\n` +
      `  To work locally, rename ${ENV_FILE} (e.g. to .env.cloud) and run this again.`,
  );
} else {
  writeFileSync(
    ENV_FILE,
    [
      "# Written by `pnpm local:setup` — LOCAL database on this computer only.",
      "# To connect your own Supabase project later, see docs/SUPABASE_SETUP.md.",
      `NEXT_PUBLIC_SUPABASE_URL=${status.API_URL}`,
      `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=${status.PUBLISHABLE_KEY}`,
      "NEXT_PUBLIC_SITE_URL=http://localhost:3000",
      "",
    ].join("\n"),
  );
  console.log(`• ${ENV_FILE} now points at the local database (${status.API_URL}).`);
}

// ── Local accounts ───────────────────────────────────────────────────────────
// The secret key is the local stack's built-in one; it's used only here.
async function createAccounts() {
  const admin = createClient(status.API_URL, status.SECRET_KEY, { auth: { persistSession: false } });
  for (const a of ACCOUNTS) {
    const { data, error } = await admin.auth.admin.createUser({
      email: a.email,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { display_name: a.name },
    });
    if (error && !/already/i.test(error.message)) fail(`Couldn't create ${a.email}: ${error.message}`);
    if (data?.user && a.role !== "student") {
      const { error: roleError } = await admin.from("profiles").update({ role: a.role }).eq("id", data.user.id);
      if (roleError) fail(`Couldn't make ${a.email} an ${a.role}: ${roleError.message}`);
    }
    console.log(`• ${error ? "Already exists" : "Created"}: ${a.email}  (${a.role})`);
  }

  console.log(`
Done. Next:
  pnpm dev            then open http://localhost:3000
  Sign in as  student@medprep.local  or  admin@medprep.local
  Password    ${PASSWORD}
  Test inbox  ${status.MAILPIT_URL ?? "http://127.0.0.1:54324"}  (emails from sign-up and password reset)

All questions and terms here are demo content, labelled DEMO.`);
}

createAccounts().catch((e) => fail(String(e)));
