// Terminology table: content, visibility and permissions. Runs against the
// LOCAL Supabase stack (`pnpm db:start`; the migration adds the 20 demo terms).
import { execSync } from "node:child_process";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../src/lib/supabase/database.types";

type Status = { API_URL: string; PUBLISHABLE_KEY: string; SECRET_KEY: string };
const status = JSON.parse(execSync("pnpm exec supabase status -o json", { encoding: "utf8" }).replace(/^[^{]*/, "")) as Status;
const admin = createClient<Database>(status.API_URL, status.SECRET_KEY, { auth: { persistSession: false } });
const anon = () => createClient<Database>(status.API_URL, status.PUBLISHABLE_KEY, { auth: { persistSession: false } });

const run = Date.now();
const userIds: string[] = [];
const PREFIX = `tt${run}`;

async function signedIn(name: string, role: "student" | "reviewer" = "student") {
  const email = `terms-${name}-${run}@example.test`;
  const { data, error } = await admin.auth.admin.createUser({ email, password: "Testing123", email_confirm: true });
  if (error) throw error;
  userIds.push(data.user.id);
  if (role !== "student") await admin.from("profiles").update({ role }).eq("id", data.user.id);
  const client = anon();
  await client.auth.signInWithPassword({ email, password: "Testing123" });
  return { id: data.user.id, client };
}

let student: { id: string; client: SupabaseClient<Database> };
let reviewer: { id: string; client: SupabaseClient<Database> };

beforeAll(async () => {
  [student, reviewer] = await Promise.all([signedIn("student"), signedIn("reviewer", "reviewer")]);
});

afterAll(async () => {
  await admin.from("terms").delete().like("id", `${PREFIX}%`);
  for (const id of userIds) await admin.auth.admin.deleteUser(id);
});

describe("the 20 existing terminology cards", () => {
  it("are in the database with their original IDs t-01 … t-20", async () => {
    const { data } = await student.client.from("terms").select("id").like("id", "t-%").order("id");
    expect(data?.map((t) => t.id)).toEqual(Array.from({ length: 20 }, (_, i) => `t-${String(i + 1).padStart(2, "0")}`));
  });

  it("keep their original content and are labelled demo / unreviewed", async () => {
    const { data } = await student.client.from("terms").select("*").in("id", ["t-01", "t-02", "t-12"]).order("id");
    expect(data).toMatchObject([
      { id: "t-01", ru: "одышка", translit: "a-DYSH-ka", en: "shortness of breath (dyspnoea)", topic: "pulmonology", example_ru: "Пациент жалуется на одышку при ходьбе." },
      { id: "t-02", ru: "жалобы", en: "complaints (presenting symptoms)", topic: null }, // "general" vocabulary
      { id: "t-12", ru: "желтуха", en: "jaundice", topic: "gastroenterology" },
    ]);
    for (const t of data ?? []) expect(t).toMatchObject({ origin: "demo", review_status: "draft", rights_status: "owned" });
  });

  it("keep matching a student's saved term progress", async () => {
    // Review progress for terms is stored against the term ID.
    await student.client.from("srs_cards").insert({ user_id: student.id, item_type: "term", item_id: "t-05", due: new Date().toISOString() });
    const { data: cards } = await student.client.from("srs_cards").select("item_id").eq("item_type", "term");
    const { data: term } = await student.client.from("terms").select("ru").eq("id", cards![0].item_id).single();
    expect(term?.ru).toBe("сердцебиение");
  });
});

describe("permissions", () => {
  it("signed-out visitors can read nothing", async () => {
    const { data, error } = await anon().from("terms").select("id");
    expect(error !== null || data?.length === 0).toBe(true);
  });

  it("students can't add, change or delete terms", async () => {
    expect((await student.client.from("terms").insert({ id: `${PREFIX}-x`, ru: "х", en: "x", origin: "demo", rights_status: "owned" })).error).not.toBeNull();

    await student.client.from("terms").update({ en: "hacked" }).eq("id", "t-01");
    await student.client.from("terms").delete().eq("id", "t-01");
    const { data } = await admin.from("terms").select("en").eq("id", "t-01").single();
    expect(data?.en).toBe("shortness of breath (dyspnoea)");
  });

  it("reviewers can read but not change terms", async () => {
    await reviewer.client.from("terms").update({ en: "changed" }).eq("id", "t-02");
    const { data } = await admin.from("terms").select("en").eq("id", "t-02").single();
    expect(data?.en).toBe("complaints (presenting symptoms)");
  });
});

describe("students only see publishable terms", () => {
  const term = (suffix: string, extra: Partial<Database["public"]["Tables"]["terms"]["Insert"]>) => ({
    id: `${PREFIX}-${suffix}`,
    ru: "термин",
    en: "term",
    origin: "original_practice" as const,
    rights_status: "owned" as const,
    review_status: "approved" as const,
    ...extra,
  });

  beforeAll(async () => {
    const { error } = await admin.from("terms").insert([
      term("approved", {}),
      term("in-review", { review_status: "in_review" }),
      term("no-rights", { rights_status: "permission_pending" }),
      term("retired-demo", { origin: "demo", review_status: "retired" }),
    ]);
    if (error) throw error;
  });

  it("approved terms with cleared rights are visible; unreviewed, rights-pending and retired ones are not", async () => {
    const { data } = await student.client.from("terms").select("id").like("id", `${PREFIX}%`);
    expect(data?.map((t) => t.id)).toEqual([`${PREFIX}-approved`]);
  });

  it("reviewers can see all of them", async () => {
    const { data } = await reviewer.client.from("terms").select("id").like("id", `${PREFIX}%`);
    expect(data).toHaveLength(4);
  });
});
