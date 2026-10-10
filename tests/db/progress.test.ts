// Progress tables: every row belongs to one user, and nobody else can read or
// write it. Runs against the LOCAL Supabase stack.
import { execSync } from "node:child_process";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../src/lib/supabase/database.types";

type Status = { API_URL: string; PUBLISHABLE_KEY: string; SECRET_KEY: string };
const status = JSON.parse(execSync("pnpm exec supabase status -o json", { encoding: "utf8" }).replace(/^[^{]*/, "")) as Status;
const admin = createClient<Database>(status.API_URL, status.SECRET_KEY, { auth: { persistSession: false } });

const run = Date.now();
const ids: string[] = [];

async function student(name: string) {
  const email = `progress-${name}-${run}@example.test`;
  const { data, error } = await admin.auth.admin.createUser({ email, password: "Testing123", email_confirm: true });
  if (error) throw error;
  ids.push(data.user.id);
  const client = createClient<Database>(status.API_URL, status.PUBLISHABLE_KEY, { auth: { persistSession: false } });
  await client.auth.signInWithPassword({ email, password: "Testing123" });
  return { id: data.user.id, client };
}

let alice: { id: string; client: SupabaseClient<Database> };
let bob: { id: string; client: SupabaseClient<Database> };
let questionId: string;

const card = (userId: string, itemId: string) => ({
  user_id: userId,
  item_type: "term" as const,
  item_id: itemId,
  due: new Date().toISOString(),
  interval_days: 1,
  ease: 2.5,
  reps: 1,
  lapses: 0,
});

beforeAll(async () => {
  [alice, bob] = await Promise.all([student("alice"), student("bob")]);
  questionId = (await admin.from("questions").select("id").eq("slug", "q-card-01").single()).data!.id;
});

afterAll(async () => {
  for (const id of ids) await admin.auth.admin.deleteUser(id);
});

describe("bookmarks", () => {
  it("a student can add, read and remove their own", async () => {
    expect((await alice.client.from("bookmarks").insert({ user_id: alice.id, question_id: questionId })).error).toBeNull();
    expect((await alice.client.from("bookmarks").select("question_id")).data).toEqual([{ question_id: questionId }]);
    await alice.client.from("bookmarks").delete().eq("question_id", questionId);
    expect((await alice.client.from("bookmarks").select("question_id")).data).toEqual([]);
  });

  it("nobody can read or create someone else's", async () => {
    await alice.client.from("bookmarks").insert({ user_id: alice.id, question_id: questionId });
    expect((await bob.client.from("bookmarks").select("question_id")).data).toEqual([]);
    expect((await bob.client.from("bookmarks").insert({ user_id: alice.id, question_id: questionId })).error).not.toBeNull();
    await bob.client.from("bookmarks").delete().eq("user_id", alice.id);
    expect((await admin.from("bookmarks").select("question_id").eq("user_id", alice.id)).data).toHaveLength(1);
  });
});

describe("review cards", () => {
  it("a student can save and update their own", async () => {
    expect((await alice.client.from("srs_cards").upsert(card(alice.id, "t-01"))).error).toBeNull();
    expect((await alice.client.from("srs_cards").upsert({ ...card(alice.id, "t-01"), reps: 2 })).error).toBeNull();
    const { data } = await alice.client.from("srs_cards").select("item_id, reps");
    expect(data).toEqual([{ item_id: "t-01", reps: 2 }]);
  });

  it("nobody can read, write or change someone else's", async () => {
    expect((await bob.client.from("srs_cards").select("item_id")).data).toEqual([]);
    expect((await bob.client.from("srs_cards").insert(card(alice.id, "t-02"))).error).not.toBeNull();
    await bob.client.from("srs_cards").update({ reps: 99 }).eq("user_id", alice.id);
    expect((await admin.from("srs_cards").select("reps").eq("user_id", alice.id).single()).data?.reps).toBe(2);
  });

  it("rejects nonsense values", async () => {
    expect((await alice.client.from("srs_cards").insert({ ...card(alice.id, "t-03"), ease: 50 })).error).not.toBeNull();
    expect((await alice.client.from("srs_cards").insert({ ...card(alice.id, "Bad ID!") })).error).not.toBeNull();
  });
});

describe("mock results", () => {
  const result = (userId: string) => ({
    user_id: userId,
    blueprint_id: "demo-quick",
    question_slugs: ["q-card-01"],
    answers: { "q-card-01": "B" },
    score: 1,
    total: 1,
    passed: true,
    duration_sec: 60,
  });

  it("are private to each student and can't be edited afterwards", async () => {
    expect((await alice.client.from("mock_attempts").insert(result(alice.id))).error).toBeNull();
    expect((await bob.client.from("mock_attempts").select("id")).data).toEqual([]);
    expect((await bob.client.from("mock_attempts").insert(result(alice.id))).error).not.toBeNull();

    const edit = await alice.client.from("mock_attempts").update({ score: 0 }).eq("user_id", alice.id).select();
    expect(edit.error !== null || edit.data?.length === 0).toBe(true);
  });

  it("a score above the total is rejected", async () => {
    expect((await alice.client.from("mock_attempts").insert({ ...result(alice.id), score: 5 })).error).not.toBeNull();
  });
});

describe("deleting an account", () => {
  it("removes all of that student's progress", async () => {
    const temp = await student("temp");
    await temp.client.from("bookmarks").insert({ user_id: temp.id, question_id: questionId });
    await temp.client.from("srs_cards").insert(card(temp.id, "t-05"));
    await temp.client.rpc("submit_answer", { p_slug: "q-card-01", p_selected: "B" });
    await admin.auth.admin.deleteUser(temp.id);
    for (const table of ["bookmarks", "srs_cards", "attempts"] as const) {
      expect((await admin.from(table).select("user_id").eq("user_id", temp.id)).data).toEqual([]);
    }
  });
});
