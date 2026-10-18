// Questions imported as-is: 1–13 options, no answer key, duplicate option
// text, release for practice, topic counts and staff-only provenance.
// Runs against the LOCAL Supabase stack with its own rows; the last block
// also checks the imported General Medicine bank when it's present.
import { execSync } from "node:child_process";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../src/lib/supabase/database.types";

type Status = { API_URL: string; PUBLISHABLE_KEY: string; SECRET_KEY: string };
const status = JSON.parse(execSync("pnpm exec supabase status -o json", { encoding: "utf8" }).replace(/^[^{]*/, "")) as Status;
const admin = createClient<Database>(status.API_URL, status.SECRET_KEY, { auth: { persistSession: false } });
const anon = () => createClient<Database>(status.API_URL, status.PUBLISHABLE_KEY, { auth: { persistSession: false } });

const run = Date.now();
const P = `vo${run}`;
const userIds: string[] = [];
let student: SupabaseClient<Database>;
let studentId: string;
let reviewer: SupabaseClient<Database>;

async function signedIn(name: string, role: "student" | "reviewer" = "student") {
  const email = `vo-${name}-${run}@example.test`;
  const { data, error } = await admin.auth.admin.createUser({ email, password: "Testing123", email_confirm: true });
  if (error) throw error;
  userIds.push(data.user.id);
  if (role !== "student") await admin.from("profiles").update({ role }).eq("id", data.user.id);
  const client = anon();
  await client.auth.signInWithPassword({ email, password: "Testing123" });
  return { client, id: data.user.id };
}

/** A released (unreviewed) question with the given options and key. */
async function question(suffix: string, options: string[], correct: string | null, extra: Partial<Database["public"]["Tables"]["questions"]["Insert"]> = {}) {
  const { data: q, error } = await admin
    .from("questions")
    .insert({
      slug: `${P}-${suffix}`,
      topic: `${P}-topic`,
      stem_en: "A TEST QUESTION",
      stem_ru: "ТЕСТОВЫЙ ВОПРОС",
      origin: "original_practice",
      rights_status: "permission_pending",
      review_status: "in_review",
      practice_release: true,
      scored: correct !== null,
      ...extra,
    })
    .select("id")
    .single();
  if (error) throw error;
  const rows = options.map((t, i) => ({ question_id: q.id, position: "ABCDEFGHIJKLM"[i], text_en: t, text_ru: t }));
  const o = await admin.from("question_options").insert(rows);
  if (o.error) throw o.error;
  const k = await admin.from("question_keys").insert({ question_id: q.id, correct, explanation_en: null });
  if (k.error) throw k.error;
  return q.id;
}

const attemptsFor = async (questionId: string) =>
  (await admin.from("attempts").select("selected, is_correct").eq("user_id", studentId).eq("question_id", questionId)).data ?? [];

let fiveId: string;
let unscoredId: string;

beforeAll(async () => {
  const s = await signedIn("student");
  student = s.client;
  studentId = s.id;
  reviewer = (await signedIn("reviewer", "reviewer")).client;
  const t = await admin.from("topics").insert({ slug: `${P}-topic`, name_en: "Test", name_ru: "Тест", sort_order: 999 });
  if (t.error) throw t.error;
  fiveId = await question("five", ["one", "two", "three", "four", "five"], "E");
  await question("two", ["yes", "no"], "B");
  await question("thirteen", Array.from({ length: 13 }, (_, i) => `option ${i + 1}`), "M");
  await question("dup", ["same text", "same text", "other"], "C");
  unscoredId = await question("nokey", ["a", "b", "c", "d"], null);
  await question("hidden", ["a", "b", "c", "d"], "A", { practice_release: false });
});

afterAll(async () => {
  await admin.from("questions").delete().like("slug", `${P}%`);
  await admin.from("topics").delete().like("slug", `${P}%`);
  for (const id of userIds) await admin.auth.admin.deleteUser(id);
});

describe("any number of options (A–M)", () => {
  it("grades the fifth option of a five-option question and records it", async () => {
    const { data, error } = await student.rpc("submit_answer", { p_slug: `${P}-five`, p_selected: "E", p_mode: "practice" }).single();
    expect(error).toBeNull();
    expect(data).toMatchObject({ correct: "E", is_correct: true });
    expect(await attemptsFor(fiveId)).toEqual([{ selected: "E", is_correct: true }]);
  });

  it("works for two and for thirteen options", async () => {
    const two = await student.rpc("submit_answer", { p_slug: `${P}-two`, p_selected: "A", p_mode: "practice" }).single();
    expect(two.data).toMatchObject({ correct: "B", is_correct: false });
    const thirteen = await student.rpc("submit_answer", { p_slug: `${P}-thirteen`, p_selected: "M", p_mode: "practice" }).single();
    expect(thirteen.data).toMatchObject({ correct: "M", is_correct: true });
  });

  it("rejects a letter the question doesn't have", async () => {
    const { error } = await student.rpc("submit_answer", { p_slug: `${P}-two`, p_selected: "C", p_mode: "practice" }).single();
    expect(error).not.toBeNull();
  });

  it("keeps duplicate option text as separate options", async () => {
    const { data } = await student.from("questions").select("question_options(position, text_en)").eq("slug", `${P}-dup`).single();
    expect(data?.question_options.map((o) => o.position).sort()).toEqual(["A", "B", "C"]);
    expect(data?.question_options.filter((o) => o.text_en === "same text")).toHaveLength(2);
  });
});

describe("a question with no answer key", () => {
  it("can be answered but is never marked right or wrong, and nothing is recorded", async () => {
    const { data, error } = await student.rpc("submit_answer", { p_slug: `${P}-nokey`, p_selected: "B", p_mode: "practice" }).single();
    expect(error).toBeNull();
    expect(data).toMatchObject({ correct: null, is_correct: null });
    expect(await attemptsFor(unscoredId)).toEqual([]);
  });

  it("is returned in mock results without a score, and not recorded", async () => {
    const { data, error } = await student.rpc("grade_mock", {
      p_slugs: [`${P}-nokey`, `${P}-five`],
      p_answers: { [`${P}-nokey`]: "A", [`${P}-five`]: "C" },
    });
    expect(error).toBeNull();
    const bySlug = Object.fromEntries((data ?? []).map((r) => [r.slug, r]));
    expect(bySlug[`${P}-nokey`]).toMatchObject({ selected: "A", correct: null, is_correct: null });
    expect(bySlug[`${P}-five`]).toMatchObject({ selected: "C", correct: "E", is_correct: false });
    expect(await attemptsFor(unscoredId)).toEqual([]);
  });

  it("mock answers with letters a question doesn't have are ignored", async () => {
    const { data } = await student.rpc("grade_mock", { p_slugs: [`${P}-two`], p_answers: { [`${P}-two`]: "D" } });
    expect(data?.[0]).toMatchObject({ selected: null, correct: "B", is_correct: false });
  });
});

describe("release for practice", () => {
  it("released questions are visible to students without being marked reviewed", async () => {
    const { data } = await student.from("questions").select("slug, review_status, rights_status").like("slug", `${P}%`).order("slug");
    expect(data?.map((q) => q.slug)).not.toContain(`${P}-hidden`);
    expect(data).toHaveLength(5);
    for (const q of data ?? []) expect(q).toMatchObject({ review_status: "in_review", rights_status: "permission_pending" });
  });

  it("topic counts are computed in the database and only count what the user may see", async () => {
    const { data: mine } = await student.from("topic_question_counts").select("question_count").eq("topic", `${P}-topic`).single();
    const { data: staff } = await reviewer.from("topic_question_counts").select("question_count").eq("topic", `${P}-topic`).single();
    expect(mine?.question_count).toBe(5);
    expect(staff?.question_count).toBe(6);
  });
});

describe("provenance", () => {
  beforeAll(async () => {
    const p = await admin.from("question_provenance").insert({ question_id: fiveId, bank: "test", record: { note: "original" }, audit: null });
    if (p.error) throw p.error;
  });

  it("is hidden from students and readable by staff", async () => {
    expect((await student.from("question_provenance").select("bank").eq("question_id", fiveId)).data ?? []).toEqual([]);
    expect((await reviewer.from("question_provenance").select("bank").eq("question_id", fiveId)).data).toEqual([{ bank: "test" }]);
  });
});

describe("the imported General Medicine bank (when present locally)", async () => {
  const { count } = await admin.from("questions").select("slug", { count: "exact", head: true }).like("slug", "pa-general-medicine-5071-q%");
  it.skipIf(!count)("all 5,071 questions are visible to a student, bilingual, under the PA › General Medicine tree", async () => {
    const { count: visible } = await student
      .from("questions")
      .select("slug", { count: "exact", head: true })
      .like("slug", "pa-general-medicine-5071-q%");
    expect(visible).toBe(5071);
    const { count: missingRu } = await student
      .from("questions")
      .select("slug", { count: "exact", head: true })
      .like("slug", "pa-general-medicine-5071-q%")
      .is("stem_ru", null);
    expect(missingRu).toBe(0);
    const { data: counts } = await student.from("topic_question_counts").select("topic, question_count").like("topic", "pa-gm-%");
    expect((counts ?? []).reduce((n, c) => n + (c.question_count ?? 0), 0)).toBe(5071);
    const { data: root } = await student.from("topics").select("parent_slug").eq("slug", "pa-general-medicine").single();
    expect(root?.parent_slug).toBe("pa");
  });
});
