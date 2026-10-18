// Imports bilingual Cardiology question blocks (parsed from Word with
// scripts/parse-bilingual-docx.py) into the Cardiology specialty bank, LOCAL
// database only.
//
//   pnpm content:import-cardio-blocks --dry-run   compare with the bank, write nothing
//   pnpm content:import-cardio-blocks             import (one transaction), then verify
//   pnpm content:import-cardio-blocks --verify    compare the database with the blocks again
//
// Duplicates are never created:
// - A record whose ID (block + source number) already exists as a question
//   must match it exactly (Russian, English, options, answer). It's skipped;
//   a mismatch stops the import.
// - A record that exists only on the "needs correction" list replaces that
//   entry and becomes a question (same ID, so nothing else changes).
// - Any other record whose Russian question and options match an existing
//   Cardiology question is skipped as a duplicate.
// Texts, every available option and marked answers are copied exactly. No
// options or answers are invented: a question with no marked answer is shown
// but never scored, and source warnings (cut-off options) travel with it.
import { execFileSync, execSync } from "node:child_process";
import { readFileSync } from "node:fs";

const LETTERS = "ABCDEFGHIJKLM";
const DIR = "content/private/cardiology/blocks";

type Block = {
  file: string;
  idPrefix: string;
  topic: { slug: string; name_en: string; name_ru: string; category_en: string; category_ru: string; sort_order: number; existing?: boolean };
  // How review is recorded. "attested": part of the bank the owner confirmed as
  // medically reviewed and rights-cleared (2026-10-17). "released": released
  // for practice without a review/rights statement.
  review: "attested" | "released";
  source: { title: string; notesFromFile: boolean };
};

const BLOCKS: Block[] = [
  {
    // Same source as the existing "Cardiac glycosides…" topic: 81 records are
    // identical (skipped); 7 are cleaner versions of its "needs correction"
    // records and replace them in place (same IDs).
    file: `${DIR}/medications-glycosides.json`,
    idPrefix: "cardio-medications-01",
    topic: {
      slug: "cardio-medications-01",
      name_en: "Cardiac glycosides, nitrates, nitroglycerin, ACE inhibitors and cyclooxygenase inhibitors",
      name_ru: "Сердечные гликозиды, нитраты, нитроглицерин, ингибиторы АПФ, циклооксигеназы",
      category_en: "Medications",
      category_ru: "",
      sort_order: 11,
      existing: true,
    },
    review: "attested",
    source: { title: "Cardiology → Medications question banks (RU–EN)", notesFromFile: false },
  },
  {
    file: `${DIR}/healthcare-organization-1.json`,
    idPrefix: "cardio-healthcare-org-01",
    topic: {
      slug: "cardio-healthcare-org-01",
      name_en: "Healthcare organization — part 1",
      name_ru: "Организация здравоохранения — часть 1",
      category_en: "Healthcare Organization",
      category_ru: "Организация здравоохранения",
      sort_order: 16,
    },
    review: "released",
    source: { title: "Cardiology → Healthcare organization question block 1 (RU–EN)", notesFromFile: true },
  },
  {
    file: `${DIR}/pathology-arterial-hypertension.json`,
    idPrefix: "cardio-arterial-hypertension-01",
    topic: {
      slug: "cardio-arterial-hypertension-01",
      name_en: "Blood pressure pathology: arterial hypertension",
      name_ru: "Патология АД — артериальная гипертензия",
      category_en: "Cardiovascular pathology",
      category_ru: "Патологии ССС",
      sort_order: 14,
    },
    review: "released",
    source: { title: "Cardiology → Blood pressure pathology: arterial hypertension (RU–EN)", notesFromFile: true },
  },
  {
    file: `${DIR}/pathology-atherosclerosis-dyslipidemia.json`,
    idPrefix: "cardio-atherosclerosis-01",
    topic: {
      slug: "cardio-atherosclerosis-01",
      name_en: "Atherosclerosis and dyslipidemias",
      name_ru: "Атеросклероз и дислипидемии",
      category_en: "Cardiovascular pathology",
      category_ru: "Патологии ССС",
      sort_order: 15,
    },
    review: "released",
    source: { title: "Cardiology → Atherosclerosis and dyslipidemias (RU–EN)", notesFromFile: true },
  },
];

type Rec = {
  source_question_number: number;
  question_ru: string;
  question_en: string;
  options_ru: string[];
  options_en: string[];
  correct_option_index: number | null;
  source_warnings_ru: string[];
  source_warnings_en: string[];
};
type Doc = { source_file: string; title: string; notes: string[]; questions: Rec[] };

function fail(message: string): never {
  console.error(`\n✗ ${message}\n`);
  process.exit(1);
}

const mode = process.argv.includes("--dry-run") ? "dry-run" : process.argv.includes("--verify") ? "verify" : "import";

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
const container = `supabase_db_${projectId}`;
function psql(sql: string): string {
  return execFileSync("docker", ["exec", "-i", container, "psql", "-U", "postgres", "-d", "postgres", "-v", "ON_ERROR_STOP=1", "-q", "-t", "-A"], {
    input: sql,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  }).trim();
}
const TAG = "$medprep_cb$";
const literal = (v: unknown) => {
  const json = JSON.stringify(v);
  if (json.includes(TAG)) fail("The data contains a reserved marker; refusing to build the import.");
  return `${TAG}${json}${TAG}::jsonb`;
};

// ── What's already in the Cardiology specialty bank ─────────────────────────
type Existing = { slug: string; ru: string; en: string; opts_ru: string[]; opts_en: string[]; key: string | null };
function loadBank() {
  return JSON.parse(
    psql(`select json_build_object(
      'questions', coalesce((select json_agg(json_build_object('slug', q.slug, 'ru', q.stem_ru, 'en', q.stem_en, 'key', k.correct,
        'opts_ru', (select json_agg(o.text_ru order by o.position) from public.question_options o where o.question_id = q.id),
        'opts_en', (select json_agg(o.text_en order by o.position) from public.question_options o where o.question_id = q.id)))
        from public.questions q left join public.question_keys k on k.question_id = q.id
        where q.slug like 'cardio-%'), '[]'),
      'issues', coalesce((select json_agg(slug) from public.question_import_issues where slug like 'cardio-%'), '[]'));`),
  ) as { questions: Existing[]; issues: string[] };
}
const norm = (s: string) => s.toLowerCase().replace(/[\s.,:;«»"']+/g, " ").trim();
const fingerprint = (ru: string, opts: string[]) => [ru, ...opts].map(norm).join("|");

const bank = loadBank();
const bySlug = new Map(bank.questions.map((q) => [q.slug, q]));
const byContent = new Map(bank.questions.map((q) => [fingerprint(q.ru, q.opts_ru ?? []), q.slug]));
const issueSlugs = new Set(bank.issues);

type Planned = {
  slug: string;
  topic: string;
  stem_en: string;
  stem_ru: string;
  source_ref: string;
  review_note: string;
  attested: boolean;
  scored: boolean;
  source_flags: string[];
  correct: string | null;
  options: { position: string; text_ru: string; text_en: string }[];
  record: Rec & { source_file: string };
  action: "new" | "promote";
};

const planned: Planned[] = [];
const report: Record<string, Record<string, number>> = {};
const conflicts: string[] = [];
const blocks = BLOCKS.map((b) => ({ ...b, doc: JSON.parse(readFileSync(b.file, "utf8")) as Doc }));

for (const b of blocks) {
  const r: Record<string, number> = {};
  const bump = (k: string) => (r[k] = (r[k] ?? 0) + 1);
  for (const q of b.doc.questions) {
    const slug = `${b.idPrefix}-q${String(q.source_question_number).padStart(4, "0")}`;
    const key = q.correct_option_index === null ? null : LETTERS[q.correct_option_index];
    const existing = bySlug.get(slug);
    if (q.options_ru.length < 1 || q.options_ru.length > LETTERS.length || q.options_en.length !== q.options_ru.length) {
      conflicts.push(`${slug}: unsupported option count`);
      continue;
    }
    if (existing) {
      const same =
        existing.ru === q.question_ru &&
        existing.en === q.question_en &&
        JSON.stringify(existing.opts_ru) === JSON.stringify(q.options_ru) &&
        JSON.stringify(existing.opts_en) === JSON.stringify(q.options_en) &&
        existing.key === key;
      if (same) bump("already in the bank, identical (skipped)");
      else conflicts.push(`${slug}: already in the bank but differs from the new file`);
      continue;
    }
    const dupOf = byContent.get(fingerprint(q.question_ru, q.options_ru));
    if (dupOf) {
      bump(`duplicate of an existing question (skipped)`);
      continue;
    }
    // Also catch the same question appearing twice within or across the new files.
    byContent.set(fingerprint(q.question_ru, q.options_ru), slug);
    const action = issueSlugs.has(slug) ? "promote" : "new";
    bump(action === "promote" ? "replaces its 'needs correction' entry (now in Practice)" : "new question");
    const flags: string[] = [];
    if (q.source_warnings_en.length) flags.push("options_cut_off_in_source");
    if (key === null) flags.push("answer_not_marked_in_source");
    const attested = b.review === "attested";
    planned.push({
      slug,
      topic: b.topic.slug,
      stem_en: q.question_en,
      stem_ru: q.question_ru,
      source_ref: `${b.doc.source_file} · question ${q.source_question_number}`,
      review_note:
        (attested
          ? "Owner attestation (2026-10-17): this question bank is medically reviewed, and commercial usage, translation and distribution rights are established. No individual reviewer or review date is recorded."
          : "Released by the owner for student practice on 2026-10-18, before medical review or rights confirmation were recorded.") +
        (q.source_warnings_en.length ? ` Source warning: ${q.source_warnings_en.join(" ")}` : "") +
        (key === null ? " No answer is marked in the source, so the question is not scored." : ""),
      attested,
      scored: key !== null,
      source_flags: flags,
      correct: key,
      options: q.options_ru.map((ru, i) => ({ position: LETTERS[i], text_ru: ru, text_en: q.options_en[i] })),
      record: { ...q, source_file: b.doc.source_file },
      action,
    });
  }
  report[`${b.topic.category_en} › ${b.topic.name_en} (${b.doc.questions.length} in the file)`] = r;
}

console.log("\nCompared with the Cardiology specialty bank:");
for (const [name, r] of Object.entries(report)) {
  console.log(`  ${name}`);
  for (const [k, v] of Object.entries(r)) console.log(`    ${String(v).padStart(4)}  ${k}`);
}
if (conflicts.length) {
  for (const c of conflicts) console.log(`  ✗ ${c}`);
  fail(`${conflicts.length} conflict(s); nothing was written.`);
}
const newCount = planned.filter((p) => p.action === "new").length;
const promoteCount = planned.filter((p) => p.action === "promote").length;
console.log(`  To write: ${newCount} new questions, ${promoteCount} moved from "needs correction" into Practice.`);
console.log(`    not scored (no marked answer): ${planned.filter((p) => !p.scored).length}; with source warnings: ${planned.filter((p) => p.source_flags.includes("options_cut_off_in_source")).length}`);
if (mode === "dry-run") {
  console.log("\nDry run only: nothing was written.\n");
  process.exit(0);
}

if (mode === "import") {
  const topics = blocks.map((b) => b.topic);
  const sources = blocks
    .filter((b) => b.source.notesFromFile)
    .map((b) => ({
      title: b.source.title,
      notes: `Source file: ${b.doc.source_file}. Released by the owner for student practice on 2026-10-18; medical review and rights not yet recorded. Notes from the file: ${b.doc.notes.join(" ")}`,
    }));
  const sourceTitleOf = Object.fromEntries(blocks.map((b) => [b.topic.slug, b.source.title]));
  const result = psql(`
begin;
create temp table payload on commit drop as select ${literal({ topics, sources, planned, sourceTitleOf })} as doc;

insert into public.content_sources (title, rights_status, license_notes, created_by)
select s.title, 'permission_pending', s.notes, null
from payload, jsonb_to_recordset(doc -> 'sources') s(title text, notes text)
where not exists (select 1 from public.content_sources c where c.title = s.title);

insert into public.topics (slug, name_en, name_ru, parent_slug, category_en, category_ru, sort_order)
select t.slug, t.name_en, t.name_ru, 'cardiology', t.category_en, t.category_ru, t.sort_order
from payload, jsonb_to_recordset(doc -> 'topics') t(slug text, name_en text, name_ru text, category_en text, category_ru text, sort_order int)
on conflict (slug) do nothing;

create temp table incoming on commit drop as
select p.* from payload, jsonb_to_recordset(doc -> 'planned') p(
  slug text, topic text, stem_en text, stem_ru text, source_ref text, review_note text, attested boolean,
  scored boolean, source_flags text[], correct text, options jsonb, record jsonb, action text);

insert into public.questions (slug, topic, stem_en, stem_ru, origin, source_id, source_ref, rights_status,
  review_status, review_note, practice_release, scored, source_flags)
select i.slug, i.topic, i.stem_en, i.stem_ru, 'adapted',
  (select c.id from public.content_sources c, payload where c.title = doc -> 'sourceTitleOf' ->> i.topic),
  i.source_ref,
  case when i.attested then 'licensed' else 'permission_pending' end::public.rights_status,
  case when i.attested then 'approved' else 'in_review' end::public.review_status,
  i.review_note, not i.attested, i.scored, i.source_flags
from incoming i;

insert into public.question_options (question_id, position, text_en, text_ru)
select q.id, o.position, o.text_en, o.text_ru
from incoming i join public.questions q on q.slug = i.slug
cross join jsonb_to_recordset(i.options) o(position text, text_en text, text_ru text);

insert into public.question_keys (question_id, correct, explanation_en)
select q.id, i.correct, null from incoming i join public.questions q on q.slug = i.slug;

insert into public.question_provenance (question_id, bank, record, audit)
select q.id, 'cardiology-blocks', i.record, null from incoming i join public.questions q on q.slug = i.slug;

-- Records now in Practice leave the "needs correction" list.
delete from public.question_import_issues x using incoming i where x.slug = i.slug and i.action = 'promote';

select json_build_object('inserted', (select count(*) from incoming));
commit;
`);
  console.log(`\nImported into the LOCAL database: ${result}`);
}

// ── Verify ───────────────────────────────────────────────────────────────────
const after = loadBank();
const afterBySlug = new Map(after.questions.map((q) => [q.slug, q]));
const problems: string[] = [];
let checked = 0;
for (const b of blocks) {
  for (const q of b.doc.questions) {
    const slug = `${b.idPrefix}-q${String(q.source_question_number).padStart(4, "0")}`;
    const e = afterBySlug.get(slug) ?? [...afterBySlug.values()].find((x) => fingerprint(x.ru, x.opts_ru ?? []) === fingerprint(q.question_ru, q.options_ru));
    if (!e) {
      problems.push(`${slug}: not in the bank`);
      continue;
    }
    const key = q.correct_option_index === null ? null : LETTERS[q.correct_option_index];
    if (e.ru !== q.question_ru || e.en !== q.question_en || JSON.stringify(e.opts_ru) !== JSON.stringify(q.options_ru) ||
        JSON.stringify(e.opts_en) !== JSON.stringify(q.options_en) || e.key !== key) problems.push(`${slug}: differs from the file`);
    else checked++;
  }
}
const fps = after.questions.map((q) => fingerprint(q.ru, q.opts_ru ?? []));
const dupGroups = fps.length - new Set(fps).size;
const visible = Number(psql(`select count(*) from public.questions q where q.slug like 'cardio-%' and public.is_published(q)`));
const total = after.questions.length;
console.log(`\nVerification:`);
console.log(`  records from the two files present in the bank and identical (RU, EN, options, answer): ${checked}/${blocks.reduce((n, b) => n + b.doc.questions.length, 0)}`);
console.log(`  Cardiology specialty bank: ${total} questions, ${visible} visible in student Practice, ${after.issues.length} on the "needs correction" list`);
console.log(`  duplicate questions in the bank (same Russian text and options): ${dupGroups}`);
if (problems.length || dupGroups) {
  for (const p of problems.slice(0, 20)) console.log(`  ✗ ${p}`);
  fail(`${problems.length + dupGroups} problem(s) found.`);
}
console.log("  ✓ Everything matches.\n");
