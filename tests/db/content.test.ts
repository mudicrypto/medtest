// Question bank security tests against the LOCAL Supabase stack (seeded with
// the 18 demo questions by `pnpm db:reset`).
import { execSync } from "node:child_process";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "../../src/lib/supabase/database.types";

type Status = { API_URL: string; PUBLISHABLE_KEY: string; SECRET_KEY: string };
const status = JSON.parse(execSync("pnpm exec supabase status -o json", { encoding: "utf8" }).replace(/^[^{]*/, "")) as Status;

type Client = SupabaseClient<Database>;
const admin: Client = createClient<Database>(status.API_URL, status.SECRET_KEY, { auth: { persistSession: false } });

const run = Date.now();
const PREFIX = `t${run}`;
const created: string[] = [];

async function userWithRole(name: string, role: "student" | "reviewer" | "admin") {
  const email = `content-${name}-${run}@example.test`;
  const { data, error } = await admin.auth.admin.createUser({ email, password: "Testing123", email_confirm: true });
  if (error) throw error;
  created.push(data.user.id);
  if (role !== "student") await admin.from("profiles").update({ role }).eq("id", data.user.id);
  const client = createClient<Database>(status.API_URL, status.PUBLISHABLE_KEY, { auth: { persistSession: false } });
  const { error: e2 } = await client.auth.signInWithPassword({ email, password: "Testing123" });
  if (e2) throw e2;
  return { id: data.user.id, client };
}

function row(slug: string, overrides: Record<string, unknown> = {}) {
  return {
    slug,
    topic: "cardiology",
    difficulty: 2,
    stem_en: "Test question stem that is long enough?",
    stem_ru: null,
    key_terms: [],
    origin: "original_practice",
    rights_status: "owned",
    review_status: "in_review",
    source_ref: null,
    review_note: null,
    options: ["A", "B", "C", "D"].map((p) => ({ position: p, text_en: `Option ${p}`, text_ru: null })),
    key: { correct: "C", explanation_en: "Because C.", explanation_ru: null, tutor_hint: null },
    ...overrides,
  };
}

let student: Awaited<ReturnType<typeof userWithRole>>;
let reviewer: Awaited<ReturnType<typeof userWithRole>>;
let adminUser: Awaited<ReturnType<typeof userWithRole>>;

beforeAll(async () => {
  [student, reviewer, adminUser] = await Promise.all([
    userWithRole("student", "student"),
    userWithRole("reviewer", "reviewer"),
    userWithRole("admin", "admin"),
  ]);
});

afterAll(async () => {
  await admin.from("questions").delete().like("slug", `${PREFIX}%`);
  await admin.from("content_sources").delete().like("title", `${PREFIX}%`);
  for (const id of created) await admin.auth.admin.deleteUser(id);
});

describe("students", () => {
  it("can read published questions and their options", async () => {
    const { data } = await student.client.from("questions").select("slug, question_options(position)").like("slug", "q-%");
    expect(data?.length).toBe(18);
    expect(data?.every((q) => q.question_options.length === 4)).toBe(true);
  });

  it("can never read answer keys", async () => {
    const { data, error } = await student.client.from("question_keys").select("*");
    expect(error !== null || data?.length === 0).toBe(true);
  });

  it("can't see unreviewed questions or answer them", async () => {
    await adminUser.client.rpc("import_questions", { p_rows: [row(`${PREFIX}-hidden`)] as unknown as Json });
    const { data } = await student.client.from("questions").select("slug").eq("slug", `${PREFIX}-hidden`);
    expect(data).toEqual([]);
    const { error } = await student.client.rpc("submit_answer", { p_slug: `${PREFIX}-hidden`, p_selected: "A" });
    expect(error).not.toBeNull();
  });

  it("get the key only by submitting an answer, which is recorded", async () => {
    const { data, error } = await student.client.rpc("submit_answer", { p_slug: "q-card-01", p_selected: "A", p_mode: "practice" }).single();
    expect(error).toBeNull();
    expect(data).toMatchObject({ correct: "B", is_correct: false, topic: "cardiology" });
    expect(data?.explanation_en).toMatch(/inferior wall/);

    const { data: mine } = await student.client.from("attempts").select("selected, is_correct, mode");
    expect(mine).toEqual([{ selected: "A", is_correct: false, mode: "practice" }]);
  });

  it("can't see anyone else's attempts or write attempts directly", async () => {
    const { data } = await reviewer.client.from("attempts").select("id");
    expect(data).toEqual([]); // reviewer has none of their own
    const { data: q } = await admin.from("questions").select("id").eq("slug", "q-card-01").single();
    const ins = await student.client.from("attempts").insert({ user_id: student.id, question_id: q!.id, is_correct: true, mode: "practice" });
    expect(ins.error).not.toBeNull();
  });

  it("rejects invalid answers", async () => {
    const { error } = await student.client.rpc("submit_answer", { p_slug: "q-card-01", p_selected: "E" });
    expect(error).not.toBeNull();
  });

  it("can't change content, review status, or import", async () => {
    const upd = await student.client.from("questions").update({ stem_en: "hacked question text" }).eq("slug", "q-card-01").select();
    expect(upd.data ?? []).toEqual([]);
    const { data: still } = await admin.from("questions").select("stem_en").eq("slug", "q-card-01").single();
    expect(still?.stem_en).not.toBe("hacked question text");

    expect((await student.client.rpc("set_review_status", { p_slug: "q-card-01", p_status: "retired" })).error).not.toBeNull();
    expect((await student.client.rpc("import_questions", { p_rows: [row(`${PREFIX}-x`)] as unknown as Json })).error).not.toBeNull();
    expect((await student.client.from("content_sources").insert({ title: `${PREFIX} s`, rights_status: "owned" })).error).not.toBeNull();
  });

  it("mock grading records only answered questions and returns every key", async () => {
    const before = (await student.client.from("attempts").select("id")).data!.length;
    const { data, error } = await student.client.rpc("grade_mock", {
      p_slugs: ["q-pulm-02", "q-ped-02", "q-surg-01"],
      p_answers: { "q-pulm-02": "C", "q-ped-02": "B" },
    });
    expect(error).toBeNull();
    const bySlug = Object.fromEntries((data ?? []).map((r) => [r.slug, r]));
    expect(bySlug["q-pulm-02"]).toMatchObject({ selected: "C", correct: "C", is_correct: true });
    expect(bySlug["q-ped-02"]).toMatchObject({ selected: "B", correct: "A", is_correct: false });
    expect(bySlug["q-surg-01"]).toMatchObject({ selected: null, correct: "C", is_correct: false });
    const after = (await student.client.from("attempts").select("id")).data!.length;
    expect(after - before).toBe(2);
  });
});

describe("reviewers", () => {
  it("can read drafts and keys, and change review status", async () => {
    const { data: keys } = await reviewer.client.from("question_keys").select("correct").limit(1);
    expect(keys?.length).toBe(1);
    const { data: hidden } = await reviewer.client.from("questions").select("slug").eq("slug", `${PREFIX}-hidden`);
    expect(hidden?.length).toBe(1);

    const { error } = await reviewer.client.rpc("set_review_status", { p_slug: `${PREFIX}-hidden`, p_status: "approved", p_note: "Checked" });
    expect(error).toBeNull();
    const { data: q } = await admin.from("questions").select("review_status, reviewed_by, review_note").eq("slug", `${PREFIX}-hidden`).single();
    expect(q).toMatchObject({ review_status: "approved", reviewed_by: reviewer.id, review_note: "Checked" });

    // Approved + owned → now visible to students.
    const { data: visible } = await student.client.from("questions").select("slug").eq("slug", `${PREFIX}-hidden`);
    expect(visible?.length).toBe(1);
  });

  it("can't import or edit content directly", async () => {
    expect((await reviewer.client.rpc("import_questions", { p_rows: [row(`${PREFIX}-r`)] as unknown as Json })).error).not.toBeNull();
    const upd = await reviewer.client.from("question_keys").update({ correct: "A" }).neq("correct", "Z").select();
    expect(upd.data ?? []).toEqual([]);
  });
});

describe("admins and the publication rule", () => {
  it("import is all-or-nothing", async () => {
    const { error } = await adminUser.client.rpc("import_questions", {
      p_rows: [row(`${PREFIX}-ok`), row(`${PREFIX}-bad`, { topic: "astrology" })] as unknown as Json,
    });
    expect(error).not.toBeNull();
    const { data } = await admin.from("questions").select("slug").in("slug", [`${PREFIX}-ok`, `${PREFIX}-bad`]);
    expect(data).toEqual([]);
  });

  it("re-importing a slug updates it and bumps the version", async () => {
    const slug = `${PREFIX}-ver`;
    await adminUser.client.rpc("import_questions", { p_rows: [row(slug)] as unknown as Json });
    const { data } = await adminUser.client
      .rpc("import_questions", { p_rows: [row(slug, { stem_en: "An updated question stem here?" })] as unknown as Json });
    expect(data).toEqual([{ slug, action: "updated" }]);
    const { data: q } = await admin.from("questions").select("version, stem_en").eq("slug", slug).single();
    expect(q).toMatchObject({ version: 2, stem_en: "An updated question stem here?" });
  });

  it("approved questions stay hidden when rights aren't cleared", async () => {
    const slug = `${PREFIX}-rights`;
    await adminUser.client.rpc("import_questions", {
      p_rows: [row(slug, { review_status: "approved", rights_status: "permission_pending" })] as unknown as Json,
    });
    const { data } = await student.client.from("questions").select("slug").eq("slug", slug);
    expect(data).toEqual([]);
  });

  it("retired questions disappear for students, demo included", async () => {
    await adminUser.client.rpc("set_review_status", { p_slug: "q-obs-02", p_status: "retired" });
    const { data } = await student.client.from("questions").select("slug").eq("slug", "q-obs-02");
    expect(data).toEqual([]);
    await admin.from("questions").update({ review_status: "draft" }).eq("slug", "q-obs-02");
  });

  it("official material must cite a source", async () => {
    const { error } = await adminUser.client.rpc("import_questions", {
      p_rows: [row(`${PREFIX}-off`, { origin: "official_verified" })] as unknown as Json,
    });
    expect(error).not.toBeNull();

    const { data: src } = await adminUser.client
      .from("content_sources")
      .insert({ title: `${PREFIX} Sechenov bank`, rights_status: "licensed", granted_by: "Test" })
      .select("id")
      .single();
    const ok = await adminUser.client.rpc("import_questions", {
      p_rows: [row(`${PREFIX}-off`, { origin: "official_verified", rights_status: "licensed" })] as unknown as Json,
      p_source: src!.id,
    });
    expect(ok.error).toBeNull();
  });
});
