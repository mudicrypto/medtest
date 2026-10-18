// Imports a bilingual question bank (medprep-staging-1 JSON) into the LOCAL
// database only. See docs/CONTENT_GUIDE.md.
//
//   pnpm content:import cardiology --dry-run   check the file, write nothing
//   pnpm content:import cardiology             import (one transaction: all or nothing)
//   pnpm content:import cardiology --verify    compare the database with the file
//
// Complete questions are imported for practice; incomplete ones go to the
// staff-only "needs correction" list (question_import_issues). Running it
// again after the source is corrected updates records in place, keyed by
// their stable IDs, so students' saved progress keeps matching.
import { execFileSync, execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { planImport, type ImportPlan, type StagingFile } from "../src/lib/content/staging-import";

// ── Banks this tool knows about ──────────────────────────────────────────────
const BANKS = {
  cardiology: {
    file: "content/private/cardiology/medprep_cardiology_draft_questions.json",
    parent: { slug: "cardiology", nameEn: "Cardiology" },
    firstSortOrder: 11, // straight after Cardiology (10)
    // The owner's statement, recorded at bank level. It is not a per-question review.
    attestation:
      "Owner attestation (2026-10-17): this question bank is medically reviewed, and commercial usage, translation and distribution rights are established.",
    source: {
      title: "Cardiology → Medications question banks (RU–EN)",
      evidence:
        "Owner attestation (2026-10-17): both question banks are medically reviewed, and all necessary commercial usage, translation and distribution rights are established. Supporting documents are held by the owner.",
      notes:
        "Source files: Serdechnye_glikozidy_nitraty_RU-EN.docx, Statiny_diuretiki_RU-EN.docx. " +
        'The staging file\'s own note read: "Staging only, not verified against app database schema. Do not publish or claim commercial rights." ' +
        "Its per-record status (pending_clinical_review, rights unverified) is kept in each question's review note.",
    },
  },
} as const;

type BankName = keyof typeof BANKS;

function fail(message: string): never {
  console.error(`\n✗ ${message}\n`);
  process.exit(1);
}

const args = process.argv.slice(2);
const bankName = args.find((a) => !a.startsWith("--")) as BankName | undefined;
if (!bankName || !(bankName in BANKS)) fail(`Usage: pnpm content:import <${Object.keys(BANKS).join("|")}> [--dry-run|--verify]`);
const bank = BANKS[bankName];
const mode = args.includes("--dry-run") ? "dry-run" : args.includes("--verify") ? "verify" : "import";

if (!existsSync(bank.file)) fail(`Source file not found: ${bank.file}\n  It's kept out of git; copy it there first.`);
const file = JSON.parse(readFileSync(bank.file, "utf8")) as StagingFile;
const plan = planImport(file, bank.parent, bank.attestation);

// ── Report ───────────────────────────────────────────────────────────────────
function report(p: ImportPlan) {
  const byTopic = (slug: string) => ({
    q: p.questions.filter((x) => x.topic === slug).length,
    i: p.issues.filter((x) => x.topic === slug).length,
  });
  console.log(`\n${bankName}: ${file.questions.length} records in ${bank.file}`);
  for (const t of p.topics) {
    const c = byTopic(t.slug);
    console.log(`  ${bank.parent.nameEn} › ${t.categoryEn} › ${t.nameEn}`);
    console.log(`    ${t.nameRu}`);
    console.log(`    topic ID ${t.slug}: ${c.q} complete, ${c.i} need correction`);
  }
  console.log(`  Complete questions (for practice): ${p.questions.length}`);
  console.log(`  Need correction (kept, hidden from students): ${p.issues.length}`);
  const counts = new Map<string, number>();
  for (const i of p.issues) for (const reason of i.issues) counts.set(reason, (counts.get(reason) ?? 0) + 1);
  for (const [reason, n] of counts) console.log(`    ${reason}: ${n}`);
  for (const n of p.notices) console.log(`  Note: ${n}`);
  if (p.errors.length) {
    console.log(`  Errors (nothing will be imported):`);
    for (const e of p.errors.slice(0, 50)) console.log(`    - ${e}`);
  }
}
report(plan);
if (plan.errors.length) fail("Validation failed.");
if (mode === "dry-run") {
  console.log("\nDry run only: nothing was written.\n");
  process.exit(0);
}

// ── Local database only ──────────────────────────────────────────────────────
let apiUrl = "";
try {
  const raw = execSync("pnpm exec supabase status -o json", { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  apiUrl = (JSON.parse(raw.replace(/^[^{]*/, "")) as { API_URL: string }).API_URL;
} catch {
  fail("The local database isn't running. Start Docker Desktop, then run: pnpm db:start");
}
if (!/^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?(\/|$)/.test(apiUrl)) fail(`Expected the local database, got ${apiUrl}. Nothing was changed.`);
const projectId = readFileSync("supabase/config.toml", "utf8").match(/^project_id\s*=\s*"([^"]+)"/m)?.[1];
if (!projectId) fail("Couldn't read project_id from supabase/config.toml.");
const container = `supabase_db_${projectId}`;

function psql(sql: string): string {
  return execFileSync("docker", ["exec", "-i", container, "psql", "-U", "postgres", "-d", "postgres", "-v", "ON_ERROR_STOP=1", "-q", "-t", "-A"], {
    input: sql,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  }).trim();
}

const TAG = "$medprep_payload$";
function literal(value: unknown) {
  const json = JSON.stringify(value);
  if (json.includes(TAG)) fail("The data contains a reserved marker; refusing to build the import.");
  return `${TAG}${json}${TAG}::jsonb`;
}

if (mode === "import") {
  const payload = {
    source: bank.source,
    topics: plan.topics.map((t, i) => ({
      slug: t.slug,
      name_en: t.nameEn,
      name_ru: t.nameRu,
      sort_order: bank.firstSortOrder + i,
      parent_slug: t.parentSlug,
      category_en: t.categoryEn,
    })),
    questions: plan.questions.map((q) => ({
      slug: q.slug,
      topic: q.topic,
      stem_en: q.stemEn,
      stem_ru: q.stemRu,
      source_ref: q.sourceRef,
      review_note: q.reviewNote,
      correct: q.correct,
      options: q.options.map((o) => ({ position: o.position, text_en: o.textEn, text_ru: o.textRu })),
    })),
    issues: plan.issues.map((i) => ({ slug: i.slug, batch: i.batch, topic: i.topic, source_ref: i.sourceRef, issues: i.issues, record: i.record })),
  };

  const result = psql(`
begin;
create temp table payload on commit drop as select ${literal(payload)} as doc;

-- The source, with the owner's attestation (bank level).
insert into public.content_sources (title, rights_status, permission_evidence, license_notes, created_by)
select s.title, 'licensed', s.evidence, s.notes, null
from payload, jsonb_to_record(doc -> 'source') s(title text, evidence text, notes text)
where not exists (select 1 from public.content_sources c where c.title = s.title);
update public.content_sources c set rights_status = 'licensed', permission_evidence = s.evidence, license_notes = s.notes
from payload, jsonb_to_record(doc -> 'source') s(title text, evidence text, notes text)
where c.title = s.title;

-- Topics under their parent and category.
insert into public.topics (slug, name_en, name_ru, sort_order, parent_slug, category_en)
select t.slug, t.name_en, t.name_ru, t.sort_order, t.parent_slug, t.category_en
from payload, jsonb_to_recordset(doc -> 'topics') t(slug text, name_en text, name_ru text, sort_order int, parent_slug text, category_en text)
on conflict (slug) do update set name_en = excluded.name_en, name_ru = excluded.name_ru, sort_order = excluded.sort_order,
  parent_slug = excluded.parent_slug, category_en = excluded.category_en;

-- Complete questions. Reviewer and review date stay empty: the review is the
-- owner's bank-level attestation, recorded in the review note.
create temp table incoming on commit drop as
select q.* from payload, jsonb_to_recordset(doc -> 'questions')
  q(slug text, topic text, stem_en text, stem_ru text, source_ref text, review_note text, correct text, options jsonb);

insert into public.questions as q (slug, topic, stem_en, stem_ru, origin, source_id, source_ref, rights_status, review_status, review_note)
select i.slug, i.topic, i.stem_en, i.stem_ru, 'adapted',
  (select c.id from public.content_sources c, payload where c.title = doc -> 'source' ->> 'title'),
  i.source_ref, 'licensed', 'approved', i.review_note
from incoming i
on conflict (slug) do update set topic = excluded.topic, stem_en = excluded.stem_en, stem_ru = excluded.stem_ru,
  origin = excluded.origin, source_id = excluded.source_id, source_ref = excluded.source_ref,
  rights_status = excluded.rights_status, review_status = excluded.review_status, review_note = excluded.review_note,
  reviewed_by = null, reviewed_at = null, version = q.version + 1
where (q.topic, q.stem_en, q.stem_ru, q.origin, q.source_id, q.source_ref, q.rights_status, q.review_status, q.review_note)
  is distinct from (excluded.topic, excluded.stem_en, excluded.stem_ru, excluded.origin, excluded.source_id,
    excluded.source_ref, excluded.rights_status, excluded.review_status, excluded.review_note);

delete from public.question_options o using public.questions q, incoming i where o.question_id = q.id and q.slug = i.slug;
insert into public.question_options (question_id, position, text_en, text_ru)
select q.id, o.position, o.text_en, o.text_ru
from incoming i join public.questions q on q.slug = i.slug
cross join jsonb_to_recordset(i.options) o(position text, text_en text, text_ru text);

-- Answer keys. No explanation is invented; one added later is kept.
insert into public.question_keys as k (question_id, correct, explanation_en)
select q.id, i.correct, null from incoming i join public.questions q on q.slug = i.slug
on conflict (question_id) do update set correct = excluded.correct;

-- Records that need correction: kept unchanged, never shown to students.
-- Records already replaced by a corrected version from a later block
-- (pnpm content:import-cardio-blocks) are left alone.
create temp table flagged on commit drop as
select f.* from payload, jsonb_to_recordset(doc -> 'issues')
  f(slug text, batch text, topic text, source_ref text, issues text[], record jsonb)
where not exists (
  select 1 from public.questions q join public.question_provenance p on p.question_id = q.id
  where q.slug = f.slug and p.bank = 'cardiology-blocks');
insert into public.question_import_issues (slug, batch, topic, source_ref, issues, record, updated_at)
select slug, batch, topic, source_ref, issues, record, now() from flagged
on conflict (slug) do update set batch = excluded.batch, topic = excluded.topic, source_ref = excluded.source_ref,
  issues = excluded.issues, record = excluded.record, updated_at = now();
-- A corrected record leaves the list; a question that has become incomplete leaves practice.
delete from public.question_import_issues x using incoming i where x.slug = i.slug;
update public.questions q set review_status = 'draft', reviewed_by = null, reviewed_at = null,
  review_note = 'Needs source correction: ' || array_to_string(f.issues, ', ')
from flagged f where q.slug = f.slug;

select json_build_object('questions', (select count(*) from incoming), 'issues', (select count(*) from flagged));
commit;
`);
  console.log(`\nImported into the LOCAL database: ${result}`);
}

// ── Verify: the database matches the file exactly ───────────────────────────
const slugs = [...plan.questions.map((q) => q.slug), ...plan.issues.map((i) => i.slug)];
// Flagged records that a later, corrected block has replaced (now in Practice).
const superseded = new Set<string>(
  JSON.parse(
    psql(`select coalesce(json_agg(q.slug), '[]') from public.questions q join public.question_provenance p on p.question_id = q.id
          where p.bank = 'cardiology-blocks' and q.slug = any (array(select jsonb_array_elements_text(${literal(plan.issues.map((i) => i.slug))})))`),
  ),
);
const rows = JSON.parse(
  psql(`
select json_build_object(
  'questions', coalesce((select json_agg(json_build_object(
      'slug', q.slug, 'topic', q.topic, 'stem_en', q.stem_en, 'stem_ru', q.stem_ru, 'source_ref', q.source_ref,
      'review_status', q.review_status, 'rights_status', q.rights_status, 'origin', q.origin,
      'reviewed_by', q.reviewed_by, 'reviewed_at', q.reviewed_at, 'explanation_en', k.explanation_en, 'correct', k.correct,
      'options', (select json_agg(json_build_object('position', o.position, 'text_en', o.text_en, 'text_ru', o.text_ru) order by o.position)
                  from public.question_options o where o.question_id = q.id)))
    from public.questions q left join public.question_keys k on k.question_id = q.id
    where q.slug = any (array(select jsonb_array_elements_text(${literal(slugs)})))), '[]'),
  'issues', coalesce((select json_agg(x.slug) from public.question_import_issues x where x.slug = any (array(select jsonb_array_elements_text(${literal(slugs)})))), '[]'),
  'topics', coalesce((select json_agg(json_build_object('slug', t.slug, 'name_en', t.name_en, 'name_ru', t.name_ru, 'parent_slug', t.parent_slug, 'category_en', t.category_en))
    from public.topics t where t.slug = any (array(select jsonb_array_elements_text(${literal(plan.topics.map((t) => t.slug))})))), '[]')
);`),
) as {
  questions: {
    slug: string;
    topic: string;
    stem_en: string;
    stem_ru: string;
    source_ref: string;
    review_status: string;
    rights_status: string;
    origin: string;
    reviewed_by: string | null;
    reviewed_at: string | null;
    explanation_en: string | null;
    correct: string;
    options: { position: string; text_en: string; text_ru: string }[] | null;
  }[];
  issues: string[];
  topics: { slug: string; name_en: string; name_ru: string; parent_slug: string; category_en: string }[];
};

const problems: string[] = [];
const badQuestions = new Set<string>();
const bySlug = new Map(rows.questions.map((q) => [q.slug, q]));
for (const p of plan.questions) {
  const q = bySlug.get(p.slug);
  if (!q) {
    problems.push(`${p.slug}: missing from the database`);
    badQuestions.add(p.slug);
    continue;
  }
  const same =
    q.topic === p.topic &&
    q.stem_en === p.stemEn &&
    q.stem_ru === p.stemRu &&
    q.source_ref === p.sourceRef &&
    q.correct === p.correct &&
    JSON.stringify(q.options) === JSON.stringify(p.options.map((o) => ({ position: o.position, text_en: o.textEn, text_ru: o.textRu })));
  const before = problems.length;
  if (!same) problems.push(`${p.slug}: differs from the file`);
  if (q.review_status !== "approved" || q.rights_status !== "licensed" || q.origin !== "adapted") problems.push(`${p.slug}: unexpected status`);
  if (q.reviewed_by !== null || q.reviewed_at !== null) problems.push(`${p.slug}: has a reviewer or review date (should be empty)`);
  if (problems.length > before) badQuestions.add(p.slug);
}
for (const i of plan.issues) {
  if (superseded.has(i.slug)) continue;
  if (!rows.issues.includes(i.slug)) problems.push(`${i.slug}: missing from the "needs correction" list`);
  const q = bySlug.get(i.slug);
  if (q && q.review_status === "approved") problems.push(`${i.slug}: needs correction but is visible to students`);
}
for (const t of plan.topics) {
  const row = rows.topics.find((x) => x.slug === t.slug);
  if (!row || row.name_en !== t.nameEn || row.name_ru !== t.nameRu || row.parent_slug !== t.parentSlug || row.category_en !== t.categoryEn) {
    problems.push(`topic ${t.slug}: differs from the file`);
  }
}

console.log(`\nVerification against the file:`);
console.log(`  ${plan.questions.length - badQuestions.size}/${plan.questions.length} questions identical (text, options, answer key, topic)`);
console.log(`  ${rows.issues.length}/${plan.issues.length - superseded.size} records on the "needs correction" list` +
  (superseded.size ? ` (${superseded.size} replaced by a corrected later block and now in Practice)` : ""));
console.log(`  ${plan.topics.length} topics under ${bank.parent.nameEn} › ${plan.topics[0]?.categoryEn}`);
if (problems.length) {
  for (const p of problems.slice(0, 30)) console.log(`  ✗ ${p}`);
  fail(`${problems.length} problem(s) found.`);
}
console.log("  ✓ Everything matches.\n");
