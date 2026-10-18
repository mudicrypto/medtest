-- Support for large source banks imported as-is (first: General Medicine
-- Primary Accreditation, 5,071 questions). Applied to the LOCAL database;
-- not yet to any live project.
--
-- 1. Questions may have any number of options from 1 to 13 (A–M): source
--    questions are never padded or trimmed to four.
-- 2. A question may have no answer key (the source marked none). It can be
--    shown and answered, but it is never marked right or wrong and never
--    counts towards scores, mistakes or review.
-- 3. An owner can release a bank for student practice before medical review
--    and rights confirmation are recorded. Released questions keep their real
--    review status ("in review") and the app says they aren't reviewed.
-- 4. Source-integrity flags (e.g. "option count differs") travel with each
--    question so the app can warn students; the full original record and its
--    audit entry are kept in a staff-only provenance table.

-- ─── Options A–M ─────────────────────────────────────────────────────────
alter table public.question_options drop constraint question_options_position_check;
alter table public.question_options add constraint question_options_position_check check (position ~ '^[A-M]$');
alter table public.question_keys drop constraint question_keys_correct_check;
alter table public.question_keys add constraint question_keys_correct_check check (correct ~ '^[A-M]$');
alter table public.attempts drop constraint attempts_selected_check;
alter table public.attempts add constraint attempts_selected_check check (selected ~ '^[A-M]$');

-- ─── Questions without an answer key ─────────────────────────────────────
alter table public.question_keys alter column correct drop not null;

-- ─── Release, scoring and integrity flags ────────────────────────────────
alter table public.questions
  add column practice_release boolean not null default false,
  add column scored boolean not null default true,
  add column source_flags text[] not null default '{}';
comment on column public.questions.practice_release is
  'Owner released this question for student practice before medical review / rights confirmation were recorded.';
comment on column public.questions.scored is
  'false when the source marks no correct answer: shown, never scored.';

-- Some source stems are a single word (e.g. "Heparin").
alter table public.questions drop constraint questions_stem_en_check;
alter table public.questions add constraint questions_stem_en_check check (char_length(stem_en) between 1 and 4000);

create or replace function public.is_published(q public.questions)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select q.review_status <> 'retired'
     and (
       (q.rights_status in ('owned', 'licensed', 'public_domain') and (q.review_status = 'approved' or q.origin = 'demo'))
       or q.practice_release
     );
$$;

-- ─── Provenance (staff only) ─────────────────────────────────────────────
create table public.question_provenance (
  question_id uuid primary key references public.questions (id) on delete cascade,
  bank text not null,
  record jsonb not null,
  audit jsonb,
  updated_at timestamptz not null default now()
);
alter table public.question_provenance enable row level security;
create policy "Staff can read provenance" on public.question_provenance for select to authenticated
  using ((select public.is_staff()));

-- ─── Question counts per topic ───────────────────────────────────────────
-- Counted in the database (the API returns at most 1,000 rows per request).
-- security_invoker: each user counts only the questions they may see.
create view public.topic_question_counts with (security_invoker = true) as
  select topic, count(*)::int as question_count from public.questions group by topic;
grant select on public.topic_question_counts to authenticated;

-- ─── Grading ─────────────────────────────────────────────────────────────
create or replace function public.submit_answer(p_slug text, p_selected text, p_mode public.attempt_mode default 'practice')
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
  if p_selected is null or p_selected !~ '^[A-M]$' then
    raise exception 'Invalid answer' using errcode = '22023';
  end if;

  select * into v_q from public.questions q where q.slug = p_slug;
  if not found or not (public.is_published(v_q) or public.is_staff()) then
    raise exception 'Question not available' using errcode = 'P0002';
  end if;
  if not exists (select 1 from public.question_options o where o.question_id = v_q.id and o.position = p_selected) then
    raise exception 'Invalid answer' using errcode = '22023';
  end if;

  select * into v_key from public.question_keys k where k.question_id = v_q.id;
  if not found then
    raise exception 'Question has no answer key' using errcode = 'P0002';
  end if;

  -- No marked answer in the source: nothing to grade, nothing recorded.
  if v_key.correct is null then
    return query select null::char(1), null::boolean, v_key.explanation_en, v_key.explanation_ru, v_key.tutor_hint, v_q.topic;
    return;
  end if;

  insert into public.attempts (user_id, question_id, selected, is_correct, mode)
  values (v_user, v_q.id, p_selected, p_selected = v_key.correct, p_mode);

  return query select v_key.correct, p_selected = v_key.correct, v_key.explanation_en, v_key.explanation_ru,
    v_key.tutor_hint, v_q.topic;
end;
$$;

-- Unanswered and unscored questions are returned for review but not recorded.
create or replace function public.grade_mock(p_slugs text[], p_answers jsonb)
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
    and k.correct is not null
    and exists (select 1 from public.question_options o where o.question_id = q.id and o.position = p_answers ->> q.slug);

  return query
  select q.slug,
    (select o.position from public.question_options o where o.question_id = q.id and o.position = p_answers ->> q.slug),
    k.correct,
    case when k.correct is null then null else coalesce((p_answers ->> q.slug) = k.correct, false) end,
    k.explanation_en,
    q.topic
  from public.questions q
  join public.question_keys k on k.question_id = q.id
  where q.slug = any (p_slugs)
    and (public.is_published(q) or public.is_staff());
end;
$$;
