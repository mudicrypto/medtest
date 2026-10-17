// Imported question banks: topic hierarchy, optional explanations, and the
// staff-only "needs correction" list. Runs against the LOCAL Supabase stack and
// creates its own rows, so it doesn't need the (private) imported bank.
import { execSync } from "node:child_process";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../src/lib/supabase/database.types";

type Status = { API_URL: string; PUBLISHABLE_KEY: string; SECRET_KEY: string };
const status = JSON.parse(execSync("pnpm exec supabase status -o json", { encoding: "utf8" }).replace(/^[^{]*/, "")) as Status;
const admin = createClient<Database>(status.API_URL, status.SECRET_KEY, { auth: { persistSession: false } });
const anon = () => createClient<Database>(status.API_URL, status.PUBLISHABLE_KEY, { auth: { persistSession: false } });

const run = Date.now();
const PREFIX = `qb${run}`;
const userIds: string[] = [];

async function signedIn(name: string, role: "student" | "reviewer" = "student") {
  const email = `bank-${name}-${run}@example.test`;
  const { data, error } = await admin.auth.admin.createUser({ email, password: "Testing123", email_confirm: true });
  if (error) throw error;
  userIds.push(data.user.id);
  if (role !== "student") await admin.from("profiles").update({ role }).eq("id", data.user.id);
  const client = anon();
  await client.auth.signInWithPassword({ email, password: "Testing123" });
  return client;
}

let student: SupabaseClient<Database>;
let reviewer: SupabaseClient<Database>;

beforeAll(async () => {
  [student, reviewer] = await Promise.all([signedIn("student"), signedIn("reviewer", "reviewer")]);

  // A sub-topic under Cardiology, one complete question without an explanation,
  // and one record that needs correction.
  const topic = await admin.from("topics").insert({
    slug: `${PREFIX}-topic`,
    name_en: "Test sub-topic",
    name_ru: "Тестовая подтема",
    parent_slug: "cardiology",
    category_en: "Medications",
    sort_order: 999,
  });
  if (topic.error) throw topic.error;
  const q = await admin
    .from("questions")
    .insert({ slug: `${PREFIX}-q1`, topic: `${PREFIX}-topic`, stem_en: "A COMPLETE TEST QUESTION", stem_ru: "ТЕСТОВЫЙ ВОПРОС", origin: "original_practice", rights_status: "owned", review_status: "approved" })
    .select("id")
    .single();
  if (q.error) throw q.error;
  const options = ["A", "B", "C", "D"].map((position) => ({ question_id: q.data.id, position, text_en: `option ${position}`, text_ru: `вариант ${position}` }));
  const o = await admin.from("question_options").insert(options);
  if (o.error) throw o.error;
  const k = await admin.from("question_keys").insert({ question_id: q.data.id, correct: "B", explanation_en: null });
  if (k.error) throw k.error;
  const i = await admin.from("question_import_issues").insert({
    slug: `${PREFIX}-q2`,
    batch: `${PREFIX}-topic`,
    topic: `${PREFIX}-topic`,
    source_ref: "Test.docx · question 2",
    issues: ["source_truncated"],
    record: { question_en: "TRUNCATED…" },
  });
  if (i.error) throw i.error;
});

afterAll(async () => {
  await admin.from("question_import_issues").delete().like("slug", `${PREFIX}%`);
  await admin.from("questions").delete().like("slug", `${PREFIX}%`);
  await admin.from("topics").delete().like("slug", `${PREFIX}%`);
  for (const id of userIds) await admin.auth.admin.deleteUser(id);
});

describe("topic hierarchy", () => {
  it("students can read a sub-topic's parent and category", async () => {
    const { data } = await student.from("topics").select("slug, parent_slug, category_en").eq("slug", `${PREFIX}-topic`).single();
    expect(data).toEqual({ slug: `${PREFIX}-topic`, parent_slug: "cardiology", category_en: "Medications" });
  });

  it("a sub-topic must point at an existing topic", async () => {
    const { error } = await admin.from("topics").insert({ slug: `${PREFIX}-orphan`, name_en: "x", name_ru: "х", parent_slug: "no-such-topic" });
    expect(error).not.toBeNull();
  });
});

describe("questions without an explanation", () => {
  it("can be answered and graded; the explanation comes back empty", async () => {
    const { data, error } = await student.rpc("submit_answer", { p_slug: `${PREFIX}-q1`, p_selected: "B", p_mode: "practice" }).single();
    expect(error).toBeNull();
    expect(data).toMatchObject({ correct: "B", is_correct: true, explanation_en: null });
  });

  it("an empty explanation still isn't allowed (absent means null)", async () => {
    const { data: q } = await admin.from("questions").select("id").eq("slug", `${PREFIX}-q1`).single();
    const { error } = await admin.from("question_keys").update({ explanation_en: "" }).eq("question_id", q!.id);
    expect(error).not.toBeNull();
  });
});

describe("the needs-correction list", () => {
  it("is hidden from students", async () => {
    const { data } = await student.from("question_import_issues").select("slug");
    expect(data ?? []).toEqual([]);
  });

  it("is hidden from signed-out visitors", async () => {
    const { data } = await anon().from("question_import_issues").select("slug");
    expect(data ?? []).toEqual([]);
  });

  it("is readable by staff", async () => {
    const { data } = await reviewer.from("question_import_issues").select("slug, issues").eq("slug", `${PREFIX}-q2`);
    expect(data).toEqual([{ slug: `${PREFIX}-q2`, issues: ["source_truncated"] }]);
  });

  it("can't be changed by staff through the app (only the local import tool writes it)", async () => {
    await reviewer.from("question_import_issues").update({ issues: ["changed"] }).eq("slug", `${PREFIX}-q2`);
    await reviewer.from("question_import_issues").delete().eq("slug", `${PREFIX}-q2`);
    const { data } = await admin.from("question_import_issues").select("issues").eq("slug", `${PREFIX}-q2`).single();
    expect(data?.issues).toEqual(["source_truncated"]);
  });

  it("records on it can't be answered", async () => {
    const { error } = await student.rpc("submit_answer", { p_slug: `${PREFIX}-q2`, p_selected: "A", p_mode: "practice" }).single();
    expect(error).not.toBeNull();
  });
});
