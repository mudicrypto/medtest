-- Support for importing reviewed bilingual question banks (first: Cardiology →
-- Medications). Applied to the LOCAL database; not yet to any live project.

-- 1. Topics can sit under a parent topic and a category, e.g.
--    Cardiology → Medications → "Statins, diuretics, …".
alter table public.topics
  add column parent_slug text references public.topics (slug),
  add column category_en text check (char_length(category_en) <= 100),
  add column category_ru text check (char_length(category_ru) <= 100);

-- 2. Explanations are optional: source banks may not include one, and we never
--    invent medical content. The app says so when an explanation is missing.
alter table public.question_keys alter column explanation_en drop not null;

-- 3. Source records that can't be imported as complete questions (truncated
--    text, missing or extra options, …). Kept unchanged for correction, and
--    never shown to students: only staff can read them, and only the local
--    import tool writes them.
create table public.question_import_issues (
  slug text primary key check (slug ~ '^[a-z0-9][a-z0-9-]{1,79}$'),
  batch text not null,
  topic text references public.topics (slug),
  source_ref text,
  issues text[] not null check (cardinality(issues) > 0),
  record jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.question_import_issues enable row level security;
create policy "Staff can read import issues" on public.question_import_issues for select to authenticated
  using ((select public.is_staff()));
