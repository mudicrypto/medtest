-- Milestone 3: question bank, provenance, secure grading.
--
-- Security model (docs/PROPOSAL.md §3–4):
--   * Students see only PUBLISHED questions: rights cleared, not retired, and
--     either medically approved or clearly-labelled demo content.
--   * Answer keys live in question_keys, which students can never select.
--     The only way to learn a key is to submit an answer through
--     submit_answer()/grade_mock(), which also records the attempt.
--   * Staff (reviewer, admin) can read everything; only admins can write
--     content. Reviewers change review status through set_review_status().

-- ─── Types ────────────────────────────────────────────────────────────────
create type public.content_origin as enum ('original_practice', 'official_verified', 'adapted', 'demo');
create type public.rights_status as enum ('owned', 'licensed', 'public_domain', 'permission_pending', 'not_cleared');
create type public.review_status as enum ('draft', 'in_review', 'approved', 'retired');
create type public.attempt_mode as enum ('practice', 'review', 'mock');

-- ─── Role helpers ─────────────────────────────────────────────────────────
-- security definer so they can read profiles regardless of the caller's RLS.
create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'admin');
$$;

create function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.profiles where id = (select auth.uid()) and role in ('admin', 'reviewer'));
$$;

-- ─── Topics ───────────────────────────────────────────────────────────────
create table public.topics (
  slug text primary key check (slug ~ '^[a-z0-9-]+$'),
  name_en text not null,
  name_ru text not null,
  sort_order int not null default 0
);

insert into public.topics (slug, name_en, name_ru, sort_order) values
  ('cardiology', 'Cardiology', 'Кардиология', 10),
  ('pulmonology', 'Pulmonology', 'Пульмонология', 20),
  ('gastroenterology', 'Gastroenterology', 'Гастроэнтерология', 30),
  ('endocrinology', 'Endocrinology', 'Эндокринология', 40),
  ('infectious-diseases', 'Infectious diseases', 'Инфекционные болезни', 50),
  ('neurology', 'Neurology', 'Неврология', 60),
  ('obstetrics', 'Obstetrics & gynaecology', 'Акушерство и гинекология', 70),
  ('pediatrics', 'Pediatrics', 'Педиатрия', 80),
  ('surgery', 'Surgery', 'Хирургия', 90);

-- ─── Content sources (provenance and rights evidence) ────────────────────
create table public.content_sources (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 200),
  publisher text,
  url text,
  rights_status public.rights_status not null,
  -- What permission exists and where the evidence is kept (letter, contract…).
  permission_evidence text,
  granted_by text,
  granted_on date,
  license_notes text,
  created_by uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);

-- ─── Questions ────────────────────────────────────────────────────────────
create table public.questions (
  id uuid primary key default gen_random_uuid(),
  -- Stable public identifier, e.g. "q-card-01" or the source's item number.
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{1,79}$'),
  topic text not null references public.topics (slug),
  stem_en text not null check (char_length(stem_en) between 10 and 4000),
  stem_ru text check (char_length(stem_ru) <= 4000),
  difficulty smallint not null default 2 check (difficulty between 1 and 3),
  key_terms jsonb not null default '[]'::jsonb check (jsonb_typeof(key_terms) = 'array'),
  origin public.content_origin not null,
  source_id uuid references public.content_sources (id) on delete restrict,
  source_ref text,
  rights_status public.rights_status not null,
  review_status public.review_status not null default 'draft',
  reviewed_by uuid references public.profiles (id) on delete set null,
  reviewed_at timestamptz,
  review_note text,
  version int not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Official or adapted material must cite a source.
  constraint official_needs_source check (origin not in ('official_verified', 'adapted') or source_id is not null)
);

create index questions_topic_idx on public.questions (topic);

create trigger questions_set_updated_at
  before update on public.questions
  for each row execute function public.set_updated_at();

-- Publication rule, in one place.
create function public.is_published(q public.questions)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select q.rights_status in ('owned', 'licensed', 'public_domain')
     and q.review_status <> 'retired'
     and (q.review_status = 'approved' or q.origin = 'demo');
$$;

create table public.question_options (
  question_id uuid not null references public.questions (id) on delete cascade,
  position char(1) not null check (position in ('A', 'B', 'C', 'D')),
  text_en text not null check (char_length(text_en) between 1 and 1000),
  text_ru text check (char_length(text_ru) <= 1000),
  primary key (question_id, position)
);

-- 🔒 Answer keys. Students have no privileges on this table at all.
create table public.question_keys (
  question_id uuid primary key references public.questions (id) on delete cascade,
  correct char(1) not null check (correct in ('A', 'B', 'C', 'D')),
  explanation_en text not null check (char_length(explanation_en) between 1 and 8000),
  explanation_ru text check (char_length(explanation_ru) <= 8000),
  tutor_hint text,
  "references" text
);

-- ─── Attempts (every graded answer) ──────────────────────────────────────
create table public.attempts (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  question_id uuid not null references public.questions (id) on delete cascade,
  selected char(1) check (selected in ('A', 'B', 'C', 'D')),
  is_correct boolean not null,
  mode public.attempt_mode not null,
  answered_at timestamptz not null default now()
);

create index attempts_user_idx on public.attempts (user_id, answered_at desc);

-- ─── Row level security ──────────────────────────────────────────────────
alter table public.topics enable row level security;
alter table public.content_sources enable row level security;
alter table public.questions enable row level security;
alter table public.question_options enable row level security;
alter table public.question_keys enable row level security;
alter table public.attempts enable row level security;

revoke all on public.topics, public.content_sources, public.questions, public.question_options,
  public.question_keys, public.attempts from anon, authenticated;

-- Topics: readable by signed-in users; written only through migrations.
grant select on public.topics to authenticated;
create policy "Signed-in users can read topics" on public.topics for select to authenticated using (true);

-- Sources: staff read, admins write.
grant select, insert, update, delete on public.content_sources to authenticated;
create policy "Staff can read sources" on public.content_sources for select to authenticated using ((select public.is_staff()));
create policy "Admins can add sources" on public.content_sources for insert to authenticated with check ((select public.is_admin()));
create policy "Admins can edit sources" on public.content_sources for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admins can delete sources" on public.content_sources for delete to authenticated using ((select public.is_admin()));

-- Questions: students read published; staff read all; admins write.
grant select, insert, update, delete on public.questions to authenticated;
create policy "Students read published questions; staff read all" on public.questions for select to authenticated
  using (public.is_published(questions) or (select public.is_staff()));
create policy "Admins can add questions" on public.questions for insert to authenticated with check ((select public.is_admin()));
create policy "Admins can edit questions" on public.questions for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admins can delete questions" on public.questions for delete to authenticated using ((select public.is_admin()));

-- Options follow their question's visibility.
grant select, insert, update, delete on public.question_options to authenticated;
create policy "Options visible with their question" on public.question_options for select to authenticated
  using (exists (select 1 from public.questions q where q.id = question_id));
create policy "Admins can add options" on public.question_options for insert to authenticated with check ((select public.is_admin()));
create policy "Admins can edit options" on public.question_options for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admins can delete options" on public.question_options for delete to authenticated using ((select public.is_admin()));

-- Keys: staff only. (No policy for students = no rows, ever.)
grant select, insert, update, delete on public.question_keys to authenticated;
create policy "Staff can read keys" on public.question_keys for select to authenticated using ((select public.is_staff()));
create policy "Admins can add keys" on public.question_keys for insert to authenticated with check ((select public.is_admin()));
create policy "Admins can edit keys" on public.question_keys for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admins can delete keys" on public.question_keys for delete to authenticated using ((select public.is_admin()));

-- Attempts: users read their own; rows are written only by the grading functions.
grant select on public.attempts to authenticated;
create policy "Users read their own attempts" on public.attempts for select to authenticated using ((select auth.uid()) = user_id);

-- ─── Grading ─────────────────────────────────────────────────────────────
-- Grades one answer, records the attempt, and only then reveals the key.
create function public.submit_answer(p_slug text, p_selected text, p_mode public.attempt_mode default 'practice')
returns table (correct char(1), is_correct boolean, explanation_en text, explanation_ru text, tutor_hint text, topic text)
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_user uuid := (select auth.uid());
  v_q public.questions;
  v_key public.question_keys;
begin
  if v_user is null then
    raise exception 'Not signed in' using errcode = '42501';
  end if;
  if p_selected is null or p_selected not in ('A', 'B', 'C', 'D') then
    raise exception 'Invalid answer' using errcode = '22023';
  end if;

  select * into v_q from public.questions q where q.slug = p_slug;
  if not found or not (public.is_published(v_q) or public.is_staff()) then
    raise exception 'Question not available' using errcode = 'P0002';
  end if;

  select * into v_key from public.question_keys k where k.question_id = v_q.id;
  if not found then
    raise exception 'Question has no answer key' using errcode = 'P0002';
  end if;

  insert into public.attempts (user_id, question_id, selected, is_correct, mode)
  values (v_user, v_q.id, p_selected, p_selected = v_key.correct, p_mode);

  return query select v_key.correct, p_selected = v_key.correct, v_key.explanation_en, v_key.explanation_ru,
    v_key.tutor_hint, v_q.topic;
end;
$$;

-- Grades a whole mock exam at once. p_answers is {"slug": "A", ...}; slugs
-- without an answer are returned (so the student can review them) but not
-- recorded as attempts.
create function public.grade_mock(p_slugs text[], p_answers jsonb)
returns table (slug text, selected char(1), correct char(1), is_correct boolean, explanation_en text, topic text)
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_user uuid := (select auth.uid());
begin
  if v_user is null then
    raise exception 'Not signed in' using errcode = '42501';
  end if;
  if coalesce(array_length(p_slugs, 1), 0) = 0 or array_length(p_slugs, 1) > 300 then
    raise exception 'Invalid exam' using errcode = '22023';
  end if;

  insert into public.attempts (user_id, question_id, selected, is_correct, mode)
  select v_user, q.id, p_answers ->> q.slug, (p_answers ->> q.slug) = k.correct, 'mock'
  from public.questions q
  join public.question_keys k on k.question_id = q.id
  where q.slug = any (p_slugs)
    and (public.is_published(q) or public.is_staff())
    and (p_answers ->> q.slug) in ('A', 'B', 'C', 'D');

  return query
  select q.slug,
    (case when (p_answers ->> q.slug) in ('A', 'B', 'C', 'D') then p_answers ->> q.slug end)::char(1),
    k.correct,
    coalesce((p_answers ->> q.slug) = k.correct, false),
    k.explanation_en,
    q.topic
  from public.questions q
  join public.question_keys k on k.question_id = q.id
  where q.slug = any (p_slugs)
    and (public.is_published(q) or public.is_staff());
end;
$$;

-- Reviewers and admins change review status here, which stamps who and when.
create function public.set_review_status(p_slug text, p_status public.review_status, p_note text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_staff() then
    raise exception 'Only reviewers and admins can change review status' using errcode = '42501';
  end if;
  update public.questions
  set review_status = p_status,
      reviewed_by = (select auth.uid()),
      reviewed_at = now(),
      review_note = coalesce(p_note, review_note)
  where slug = p_slug;
  if not found then
    raise exception 'Question not found' using errcode = 'P0002';
  end if;
end;
$$;

revoke execute on function public.submit_answer(text, text, public.attempt_mode) from public, anon;
revoke execute on function public.grade_mock(text[], jsonb) from public, anon;
revoke execute on function public.set_review_status(text, public.review_status, text) from public, anon;
grant execute on function public.submit_answer(text, text, public.attempt_mode) to authenticated;
grant execute on function public.grade_mock(text[], jsonb) to authenticated;
grant execute on function public.set_review_status(text, public.review_status, text) to authenticated;

-- ─── Import ──────────────────────────────────────────────────────────────
-- Imports or updates many questions in ONE transaction: if any row fails,
-- nothing is saved. Rows are validated in the app first; the table
-- constraints are the final safety net. Admins only.
--
-- p_rows: [{ slug, topic, difficulty, stem_en, stem_ru, key_terms,
--            origin, rights_status, review_status, source_ref, review_note,
--            options: [{position, text_en, text_ru} ×4],
--            key: {correct, explanation_en, explanation_ru, tutor_hint} }]
create function public.import_questions(p_rows jsonb, p_source uuid default null)
returns table (slug text, action text)
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_user uuid := (select auth.uid());
  r jsonb;
  v_id uuid;
  v_existed boolean;
  v_status public.review_status;
begin
  if not public.is_admin() then
    raise exception 'Only admins can import questions' using errcode = '42501';
  end if;
  if jsonb_typeof(p_rows) <> 'array' or jsonb_array_length(p_rows) = 0 or jsonb_array_length(p_rows) > 5000 then
    raise exception 'Expected 1–5000 rows' using errcode = '22023';
  end if;

  for r in select * from jsonb_array_elements(p_rows) loop
    v_status := (r ->> 'review_status')::public.review_status;
    select exists (select 1 from public.questions q where q.slug = r ->> 'slug') into v_existed;

    insert into public.questions as q (
      slug, topic, difficulty, stem_en, stem_ru, key_terms, origin, source_id, source_ref,
      rights_status, review_status, reviewed_by, reviewed_at, review_note
    ) values (
      r ->> 'slug', r ->> 'topic', (r ->> 'difficulty')::smallint, r ->> 'stem_en', nullif(r ->> 'stem_ru', ''),
      coalesce(r -> 'key_terms', '[]'::jsonb), (r ->> 'origin')::public.content_origin, p_source,
      nullif(r ->> 'source_ref', ''), (r ->> 'rights_status')::public.rights_status, v_status,
      case when v_status = 'approved' then v_user end,
      case when v_status = 'approved' then now() end,
      nullif(r ->> 'review_note', '')
    )
    on conflict (slug) do update set
      topic = excluded.topic, difficulty = excluded.difficulty, stem_en = excluded.stem_en,
      stem_ru = excluded.stem_ru, key_terms = excluded.key_terms, origin = excluded.origin,
      source_id = coalesce(excluded.source_id, q.source_id), source_ref = excluded.source_ref,
      rights_status = excluded.rights_status, review_status = excluded.review_status,
      reviewed_by = excluded.reviewed_by, reviewed_at = excluded.reviewed_at,
      review_note = excluded.review_note, version = q.version + 1
    returning q.id into v_id;

    delete from public.question_options o where o.question_id = v_id;
    insert into public.question_options (question_id, position, text_en, text_ru)
    select v_id, o ->> 'position', o ->> 'text_en', nullif(o ->> 'text_ru', '')
    from jsonb_array_elements(r -> 'options') o;

    insert into public.question_keys as k (question_id, correct, explanation_en, explanation_ru, tutor_hint)
    values (v_id, r -> 'key' ->> 'correct', r -> 'key' ->> 'explanation_en',
      nullif(r -> 'key' ->> 'explanation_ru', ''), nullif(r -> 'key' ->> 'tutor_hint', ''))
    on conflict (question_id) do update set
      correct = excluded.correct, explanation_en = excluded.explanation_en,
      explanation_ru = excluded.explanation_ru, tutor_hint = excluded.tutor_hint;

    return query select r ->> 'slug', case when v_existed then 'updated' else 'created' end;
  end loop;
end;
$$;

revoke execute on function public.import_questions(jsonb, uuid) from public, anon;
grant execute on function public.import_questions(jsonb, uuid) to authenticated;
