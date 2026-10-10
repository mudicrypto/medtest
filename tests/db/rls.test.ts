// Database security tests. They run against the LOCAL Supabase stack
// (`pnpm db:start`), create throwaway users, and try to break the rules.
import { execSync } from "node:child_process";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../src/lib/supabase/database.types";

type Status = { API_URL: string; PUBLISHABLE_KEY: string; SECRET_KEY: string };

// Read the local stack's URL and keys from the Supabase CLI so nothing secret
// is written into the repository.
const status = JSON.parse(execSync("pnpm exec supabase status -o json", { encoding: "utf8" }).replace(/^[^{]*/, "")) as Status;

const admin = createClient<Database>(status.API_URL, status.SECRET_KEY, { auth: { persistSession: false } });
const anon = () => createClient<Database>(status.API_URL, status.PUBLISHABLE_KEY, { auth: { persistSession: false } });

const run = Date.now();
const password = "Testing123";
const users: { id: string; email: string; client: SupabaseClient<Database> }[] = [];

async function makeUser(name: string) {
  const email = `rls-${name}-${run}@example.test`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name: `Test ${name}` },
  });
  if (error) throw error;
  const client = anon();
  const { error: signInError } = await client.auth.signInWithPassword({ email, password });
  if (signInError) throw signInError;
  return { id: data.user.id, email, client };
}

beforeAll(async () => {
  users.push(await makeUser("alice"), await makeUser("bob"));
});

afterAll(async () => {
  for (const u of users) await admin.auth.admin.deleteUser(u.id);
});

describe("profiles", () => {
  it("are created automatically at sign-up with the chosen name and student role", async () => {
    const [alice] = users;
    const { data, error } = await alice.client.from("profiles").select("*").eq("id", alice.id).single();
    expect(error).toBeNull();
    expect(data).toMatchObject({ display_name: "Test alice", role: "student", show_russian: true });
  });

  it("a user sees only their own profile", async () => {
    const [alice, bob] = users;
    const { data: all } = await alice.client.from("profiles").select("id");
    expect(all?.map((r) => r.id)).toEqual([alice.id]);
    const { data: other } = await alice.client.from("profiles").select("id").eq("id", bob.id);
    expect(other).toEqual([]);
  });

  it("signed-out visitors can read nothing", async () => {
    const { data, error } = await anon().from("profiles").select("id");
    // Either an explicit permission error or an empty result is acceptable.
    expect(error !== null || data?.length === 0).toBe(true);
  });

  it("a user can edit their own name, exam date and Russian preference", async () => {
    const [alice] = users;
    const { error } = await alice.client
      .from("profiles")
      .update({ display_name: "Alice Ivanova", target_exam_date: "2027-06-01", show_russian: false })
      .eq("id", alice.id);
    expect(error).toBeNull();
    const { data } = await admin.from("profiles").select("*").eq("id", alice.id).single();
    expect(data).toMatchObject({ display_name: "Alice Ivanova", target_exam_date: "2027-06-01", show_russian: false });
  });

  it("a user cannot make themselves an admin", async () => {
    const [alice] = users;
    const { error } = await alice.client.from("profiles").update({ role: "admin" }).eq("id", alice.id);
    expect(error?.code).toBe("42501"); // permission denied
    const { data } = await admin.from("profiles").select("role").eq("id", alice.id).single();
    expect(data?.role).toBe("student");
  });

  it("a user cannot edit someone else's profile", async () => {
    const [alice, bob] = users;
    await alice.client.from("profiles").update({ display_name: "hacked" }).eq("id", bob.id);
    const { data } = await admin.from("profiles").select("display_name").eq("id", bob.id).single();
    expect(data?.display_name).toBe("Test bob");
  });

  it("a user cannot create or delete profile rows directly", async () => {
    const [alice] = users;
    const ins = await alice.client.from("profiles").insert({ id: crypto.randomUUID() });
    expect(ins.error).not.toBeNull();
    await alice.client.from("profiles").delete().eq("id", alice.id);
    const { data } = await admin.from("profiles").select("id").eq("id", alice.id);
    expect(data).toHaveLength(1);
  });

  it("names longer than 80 characters are rejected", async () => {
    const [alice] = users;
    const { error } = await alice.client.from("profiles").update({ display_name: "x".repeat(81) }).eq("id", alice.id);
    expect(error).not.toBeNull();
  });

  it("deleting the account deletes the profile", async () => {
    const temp = await makeUser("temp");
    await admin.auth.admin.deleteUser(temp.id);
    const { data } = await admin.from("profiles").select("id").eq("id", temp.id);
    expect(data).toEqual([]);
  });
});
