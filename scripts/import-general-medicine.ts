// Imports the bilingual General Medicine Primary Accreditation bank (5,071
// questions) into the LOCAL database only, as the owner instructed: every
// question, exactly as in the source, available in student Practice.
//
//   pnpm content:import-gm --dry-run   check the package, write nothing
//   pnpm content:import-gm             import (one transaction: all or nothing), then verify
//   pnpm content:import-gm --verify    compare the database with the package again
//
// Rules:
// - Russian and English texts, every option (1–13 per question, duplicates
//   included) and the PDF answer key are copied exactly. Nothing is padded,
//   trimmed, merged or invented.
// - No answer key in the source → the question is shown but never scored.
// - Review and rights are NOT claimed: questions stay "in review" with rights
//   "permission pending"; the owner's release for practice is recorded
//   separately (practice_release).
// - Source-integrity flags travel with each question (students see a note);
//   the full original record and its audit entry go to the staff-only
//   provenance table.
// - A separate topic tree: Primary Accreditation › General Medicine (31.05.01)
//   › discipline › topic. Nothing is linked to the Cardiology specialty bank.
import { execFileSync, execSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";

const PACKAGE = "content/private/general-medicine/bilingual";
const AUDIT = `${PACKAGE}/source_integrity_audit.json`;
const BANK = "general-medicine-pa-5071";
const RELEASED_ON = "2026-10-17";
const LETTERS = "ABCDEFGHIJKLM";
const SOURCE_TITLE = "General Medicine Primary Accreditation bank (5,071-question PDF)";

// English names for the 33 topics (Russian names are used exactly as supplied).
const TOPIC_EN: Record<string, string> = {
  "Cardiology|Артериальная гипертензия": "Arterial hypertension",
  "Cardiology|ИБС": "Coronary artery disease",
  "Cardiology|Инфаркт миокарда": "Myocardial infarction",
  "Cardiology|Нарушения сердечного ритма и проводимости": "Cardiac arrhythmias and conduction disorders",
  "Cardiology|ХСН": "Chronic heart failure",
  "Cardiology|Прочее / другие патологии": "Other cardiac conditions",
  "Cardiology|Кардиология": "Cardiology (general)",
  "Gastroenterology|Заболевания кишечника": "Intestinal diseases",
  "Gastroenterology|Заболевания печени и желчного пузыря": "Liver and gallbladder diseases",
  "Gastroenterology|Заболевания пищевода, желудка и 12 п.к.": "Diseases of the esophagus, stomach and duodenum",
  "Gastroenterology|Заболевания поджелудочной железы": "Pancreatic diseases",
  "Gastroenterology|Гастроэнтерология": "Gastroenterology (general)",
  "Pulmonology|Бронхиальная астма": "Bronchial asthma",
  "Pulmonology|ХОБЛ": "COPD",
  "Pulmonology|Пневмонии": "Pneumonia",
  "Pulmonology|Другие патологии (интерстициальный легочный фиброз, саркоидоз, плевриты, ТЭЛА и пр":
    "Other conditions (interstitial pulmonary fibrosis, sarcoidosis, pleurisy, pulmonary embolism, etc.)",
  "Pulmonology|Пульмонология": "Pulmonology (general)",
  "Clinical Pharmacology|Клиническая фармакология": "Clinical pharmacology",
  "Endocrinology|Эндокринология": "Endocrinology",
  "Hematology|Гематология": "Hematology",
  "Infectious Diseases|Инфекционные болезни": "Infectious diseases",
  "Medical Rehabilitation|Медицинская реабилитология": "Medical rehabilitation",
  "Nephrology|Нефрология": "Nephrology",
  "Neurology|Неврология": "Neurology",
  "Obstetrics and Gynecology|Акушерство и гинекология": "Obstetrics and gynecology",
  "Oncology and Radiation Therapy|Онкология, лучевая терапия": "Oncology and radiation therapy",
  "Ophthalmology|Офтальмология": "Ophthalmology",
  "Pediatrics|Педиатрия": "Pediatrics",
  "Public Health and Healthcare Management|Общественное здоровье и здравоохранение, экономика здравоохранения":
    "Public health and healthcare, healthcare economics",
  "Rheumatology|Ревматология": "Rheumatology",
  "Surgery|Хирургия": "Surgery",
  "Traumatology and Orthopedics|Травматология и ортопедия": "Traumatology and orthopedics",
  "Tuberculosis Medicine|Фтизиатрия": "Phthisiology (tuberculosis medicine)",
};

type Rec = {
  id: string;
  discipline_ru: string;
  discipline_en: string;
  topic_ru: string;
  source_question_number: number;
  source_page: number | null;
  question_ru: string;
  question_en: string;
  options_ru: string[];
  options_en: string[];
  correct_option_index: number | null;
  review_flags: string[];
  status: string;
  [k: string]: unknown;
};

function fail(message: string): never {
  console.error(`\n✗ ${message}\n`);
  process.exit(1);
}

const mode = process.argv.includes("--dry-run") ? "dry-run" : process.argv.includes("--verify") ? "verify" : "import";
if (!existsSync(PACKAGE)) fail(`Package not found: ${PACKAGE} (run scripts/translation-batches.py merge first).`);

// ── Load and plan ────────────────────────────────────────────────────────────
const files = readdirSync(PACKAGE).filter((f) => /^\d\d_.+\.json$/.test(f)).sort();
const records: (Rec & { _discipline: string })[] = [];
for (const f of files) {
  const doc = JSON.parse(readFileSync(`${PACKAGE}/${f}`, "utf8")) as { questions: Rec[] };
  const discipline = f.replace(/^\d\d_/, "").replace(/\.json$/, "");
  for (const q of doc.questions) records.push({ ...q, _discipline: discipline });
}
const audit = new Map(
  (JSON.parse(readFileSync(AUDIT, "utf8")) as { issues: { id: string }[] }).issues.map((i) => [i.id, i]),
);

const errors: string[] = [];
const ids = new Set<string>();
const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
const norm = (s: string) => s.trim().replace(/\s+/g, " ").toLowerCase();

type Topic = { slug: string; name_en: string; name_ru: string; parent_slug: string | null; sort_order: number };
const topics: Topic[] = [
  { slug: "pa", name_en: "Primary Accreditation", name_ru: "Первичная аккредитация (ПА)", parent_slug: null, sort_order: 1000 },
  { slug: "pa-general-medicine", name_en: "General Medicine (31.05.01)", name_ru: "Лечебное дело (31.05.01)", parent_slug: "pa", sort_order: 1001 },
];
const topicSlugOf = new Map<string, string>();
files.forEach((f, di) => {
  const discipline = f.replace(/^\d\d_/, "").replace(/\.json$/, "");
  const inFile = records.filter((r) => r._discipline === discipline);
  const dSlug = `pa-gm-${discipline}`;
  topics.push({ slug: dSlug, name_en: inFile[0].discipline_en, name_ru: inFile[0].discipline_ru, parent_slug: "pa-general-medicine", sort_order: 1100 + di * 50 });
  const names = [...new Set(inFile.map((r) => r.topic_ru))].sort((a, b) =>
    (TOPIC_EN[`${inFile[0].discipline_en}|${a}`] ?? a).localeCompare(TOPIC_EN[`${inFile[0].discipline_en}|${b}`] ?? b),
  );
  names.forEach((ru, ti) => {
    const en = TOPIC_EN[`${inFile[0].discipline_en}|${ru}`];
    if (!en) errors.push(`No English name for topic "${inFile[0].discipline_en} › ${ru}"`);
    const slug = `${dSlug}-${slugify(en ?? `topic-${ti}`)}`;
    topicSlugOf.set(`${discipline}|${ru}`, slug);
    topics.push({ slug, name_en: en ?? ru, name_ru: ru, parent_slug: dSlug, sort_order: 1100 + di * 50 + 1 + ti });
  });
});

const questions = records.map((r) => {
  if (ids.has(r.id)) errors.push(`Duplicate ID ${r.id}`);
  ids.add(r.id);
  if (!/^[a-z0-9][a-z0-9-]{1,79}$/.test(r.id)) errors.push(`Invalid ID ${r.id}`);
  const n = r.options_ru.length;
  if (n < 1 || n > LETTERS.length) errors.push(`${r.id}: ${n} options (supported: 1–${LETTERS.length})`);
  if (r.options_en?.length !== n) errors.push(`${r.id}: ${r.options_en?.length} English options vs ${n} Russian`);
  if (!r.question_ru?.trim() || !r.question_en?.trim()) errors.push(`${r.id}: missing question text`);
  if ([...r.options_ru, ...(r.options_en ?? [])].some((o) => !o?.trim())) errors.push(`${r.id}: empty option`);
  const k = r.correct_option_index;
  if (k !== null && !(Number.isInteger(k) && k >= 0 && k < n)) errors.push(`${r.id}: answer index ${k} out of range`);
  const flags = [...r.review_flags];
  if (new Set(r.options_ru.map(norm)).size !== n && !flags.includes("duplicate_option_text")) flags.push("duplicate_option_text");
  return {
    slug: r.id,
    topic: topicSlugOf.get(`${r._discipline}|${r.topic_ru}`)!,
    stem_en: r.question_en,
    stem_ru: r.question_ru,
    source_ref: `5071-question PDF · question ${r.source_question_number}${r.source_page ? ` (page ${r.source_page})` : ""}`,
    scored: k !== null,
    source_flags: flags,
    review_note:
      `Released by the owner for student practice on ${RELEASED_ON}, before medical review or rights confirmation. ` +
      `PDF answer key is the master. English: AI translation by Claude, not clinically reviewed. Source status: ${r.status}.`,
    correct: k === null ? null : LETTERS[k],
    options: r.options_ru.map((ru, i) => ({ position: LETTERS[i], text_ru: ru, text_en: r.options_en[i] })),
    record: Object.fromEntries(Object.entries(r).filter(([key]) => !key.startsWith("_"))),
    audit: audit.get(r.id) ?? null,
  };
});

console.log(`\nGeneral Medicine bank: ${records.length} questions in ${files.length} discipline files`);
console.log(`  topics: 2 levels (Primary Accreditation › General Medicine), ${files.length} disciplines, ${topics.length - 2 - files.length} topics`);
console.log(`  option counts: ${JSON.stringify(Object.fromEntries([...new Set(records.map((r) => r.options_ru.length))].sort((a, b) => a - b).map((n) => [n, records.filter((r) => r.options_ru.length === n).length])))}`);
console.log(`  without an answer key (shown, not scored): ${questions.filter((q) => !q.scored).length}`);
console.log(`  with source-integrity flags (shown with a note): ${questions.filter((q) => q.source_flags.length).length}`);
console.log(`  with an audit entry (kept in provenance): ${questions.filter((q) => q.audit).length}`);
if (records.length !== 5071) errors.push(`Expected 5,071 questions, found ${records.length}`);
if (errors.length) {
  for (const e of errors.slice(0, 40)) console.log(`  ✗ ${e}`);
  fail(`${errors.length} validation error(s); nothing was written.`);
}
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
const container = `supabase_db_${projectId}`;

function psql(sql: string): string {
  return execFileSync("docker", ["exec", "-i", container, "psql", "-U", "postgres", "-d", "postgres", "-v", "ON_ERROR_STOP=1", "-q", "-t", "-A"], {
    input: sql,
    encoding: "utf8",
    maxBuffer: 256 * 1024 * 1024,
  }).trim();
}
const TAG = "$medprep_gm$";
const literal = (v: unknown) => {
  const json = JSON.stringify(v);
  if (json.includes(TAG)) fail("The data contains a reserved marker; refusing to build the import.");
  return `${TAG}${json}${TAG}::jsonb`;
};

if (mode === "import") {
  const result = psql(`
begin;
create temp table payload on commit drop as select ${literal({ topics, questions })} as doc;

insert into public.content_sources (title, rights_status, license_notes, created_by)
select ${literal(SOURCE_TITLE)} #>> '{}', 'permission_pending',
  'Master source: the 5,071-question PDF (questions, options, marked answers). The Word document supplied the topic taxonomy only. ' ||
  'English translated by Claude (AI), not clinically reviewed. Released by the owner for student practice on ${RELEASED_ON}; ' ||
  'medical review and rights are not yet recorded.', null
where not exists (select 1 from public.content_sources where title = ${literal(SOURCE_TITLE)} #>> '{}');

insert into public.topics (slug, name_en, name_ru, parent_slug, sort_order)
select t.slug, t.name_en, t.name_ru, t.parent_slug, t.sort_order
from payload, jsonb_to_recordset(doc -> 'topics') t(slug text, name_en text, name_ru text, parent_slug text, sort_order int)
order by t.sort_order
on conflict (slug) do update set name_en = excluded.name_en, name_ru = excluded.name_ru,
  parent_slug = excluded.parent_slug, sort_order = excluded.sort_order;

create temp table incoming on commit drop as
select q.* from payload, jsonb_to_recordset(doc -> 'questions') q(
  slug text, topic text, stem_en text, stem_ru text, source_ref text, scored boolean, source_flags text[],
  review_note text, correct text, options jsonb, record jsonb, audit jsonb);

insert into public.questions as q (slug, topic, stem_en, stem_ru, origin, source_id, source_ref, rights_status,
  review_status, review_note, practice_release, scored, source_flags)
select i.slug, i.topic, i.stem_en, i.stem_ru, 'adapted',
  (select c.id from public.content_sources c where c.title = ${literal(SOURCE_TITLE)} #>> '{}'),
  i.source_ref, 'permission_pending', 'in_review', i.review_note, true, i.scored, i.source_flags
from incoming i
on conflict (slug) do update set topic = excluded.topic, stem_en = excluded.stem_en, stem_ru = excluded.stem_ru,
  origin = excluded.origin, source_id = excluded.source_id, source_ref = excluded.source_ref,
  rights_status = excluded.rights_status, review_status = excluded.review_status, review_note = excluded.review_note,
  practice_release = excluded.practice_release, scored = excluded.scored, source_flags = excluded.source_flags,
  reviewed_by = null, reviewed_at = null, version = q.version + 1
where (q.topic, q.stem_en, q.stem_ru, q.source_ref, q.review_note, q.practice_release, q.scored, q.source_flags)
  is distinct from (excluded.topic, excluded.stem_en, excluded.stem_ru, excluded.source_ref, excluded.review_note,
    excluded.practice_release, excluded.scored, excluded.source_flags);

delete from public.question_options o using public.questions q, incoming i where o.question_id = q.id and q.slug = i.slug;
insert into public.question_options (question_id, position, text_en, text_ru)
select q.id, o.position, o.text_en, o.text_ru
from incoming i join public.questions q on q.slug = i.slug
cross join jsonb_to_recordset(i.options) o(position text, text_en text, text_ru text);

insert into public.question_keys as k (question_id, correct, explanation_en)
select q.id, i.correct, null from incoming i join public.questions q on q.slug = i.slug
on conflict (question_id) do update set correct = excluded.correct;

insert into public.question_provenance as p (question_id, bank, record, audit, updated_at)
select q.id, '${BANK}', i.record, i.audit, now() from incoming i join public.questions q on q.slug = i.slug
on conflict (question_id) do update set bank = excluded.bank, record = excluded.record, audit = excluded.audit, updated_at = now();

select json_build_object('questions', (select count(*) from incoming), 'topics', jsonb_array_length((select doc -> 'topics' from payload)));
commit;
`);
  console.log(`\nImported into the LOCAL database: ${result}`);
}

// ── Verify: every question in the database matches the package exactly ─────
const db = JSON.parse(
  psql(`
select json_build_object(
  'questions', (select json_agg(json_build_object(
      'slug', q.slug, 'topic', q.topic, 'stem_en', q.stem_en, 'stem_ru', q.stem_ru, 'source_ref', q.source_ref,
      'scored', q.scored, 'released', q.practice_release, 'published', public.is_published(q), 'flags', q.source_flags,
      'correct', k.correct, 'provenance', (p.question_id is not null),
      'options', (select json_agg(json_build_object('position', o.position, 'text_ru', o.text_ru, 'text_en', o.text_en) order by o.position)
                  from public.question_options o where o.question_id = q.id)))
    from public.questions q left join public.question_keys k on k.question_id = q.id
    left join public.question_provenance p on p.question_id = q.id
    where q.slug like 'pa-general-medicine-5071-q%'),
  'topics', (select json_agg(json_build_object('slug', slug, 'name_en', name_en, 'name_ru', name_ru, 'parent_slug', parent_slug))
    from public.topics where slug = 'pa' or slug like 'pa-%')
);`),
) as {
  questions: {
    slug: string; topic: string; stem_en: string; stem_ru: string; source_ref: string; scored: boolean; released: boolean;
    published: boolean; flags: string[]; correct: string | null; provenance: boolean;
    options: { position: string; text_ru: string; text_en: string }[];
  }[] | null;
  topics: { slug: string; name_en: string; name_ru: string; parent_slug: string | null }[] | null;
};

const problems: string[] = [];
const bySlug = new Map((db.questions ?? []).map((q) => [q.slug, q]));
let identical = 0;
for (const p of questions) {
  const q = bySlug.get(p.slug);
  if (!q) {
    problems.push(`${p.slug}: missing`);
    continue;
  }
  const ok =
    q.topic === p.topic &&
    q.stem_en === p.stem_en &&
    q.stem_ru === p.stem_ru &&
    q.source_ref === p.source_ref &&
    q.correct === p.correct &&
    q.scored === p.scored &&
    JSON.stringify(q.flags) === JSON.stringify(p.source_flags) &&
    JSON.stringify(q.options) === JSON.stringify(p.options);
  if (!ok) problems.push(`${p.slug}: differs from the package`);
  else identical++;
  if (!q.published || !q.released) problems.push(`${p.slug}: not available to students`);
  if (!q.provenance) problems.push(`${p.slug}: no provenance record`);
}
const extra = (db.questions ?? []).length - questions.length;
if (extra) problems.push(`${extra} unexpected extra General Medicine questions in the database`);
for (const t of topics) {
  const row = (db.topics ?? []).find((x) => x.slug === t.slug);
  if (!row || row.name_en !== t.name_en || row.name_ru !== t.name_ru || row.parent_slug !== t.parent_slug) problems.push(`topic ${t.slug}: differs`);
}
const optionTotal = questions.reduce((n, q) => n + q.options.length, 0);
console.log(`\nVerification against the package:`);
console.log(`  General Medicine questions in the database: ${(db.questions ?? []).length} (expected ${questions.length})`);
console.log(`  identical (RU + EN text, every option in both languages, answer key, topic, flags): ${identical}/${questions.length}`);
console.log(`  options: ${optionTotal} in the package, ${(db.questions ?? []).reduce((n, q) => n + (q.options?.length ?? 0), 0)} in the database`);
console.log(`  available to students: ${(db.questions ?? []).filter((q) => q.published).length}/${questions.length}`);
console.log(`  scored / not scored (no key): ${(db.questions ?? []).filter((q) => q.scored).length} / ${(db.questions ?? []).filter((q) => !q.scored).length}`);
console.log(`  provenance records: ${(db.questions ?? []).filter((q) => q.provenance).length}/${questions.length}`);
console.log(`  topics: ${topics.length} (${(db.topics ?? []).length} in the database)`);
if (problems.length) {
  for (const p of problems.slice(0, 30)) console.log(`  ✗ ${p}`);
  fail(`${problems.length} problem(s) found.`);
}
console.log("  ✓ Everything matches.\n");
