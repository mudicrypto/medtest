-- Richer question model + duplicate-safe grading.
--
-- Classification: specialty → subject → topic → subtopic.
--   questions.topic (existing column, FK to public.topics) holds the SPECIALTY
--   slug; it keeps its name so existing data and policies are untouched.
-- Post-answer teaching content (option explanations, exam pearl) lives with
-- the answer key, so students only receive it after submitting.

insert into public.topics (slug, name_en, name_ru, sort_order)
values ('emergency-medicine', 'Emergency medicine', 'Неотложная медицина', 100)
on conflict (slug) do nothing;

comment on column public.questions.topic is 'Specialty slug (FK to topics). The finer levels are subject, clinical_topic and subtopic.';

alter table public.questions
  add column subject text not null default '' check (char_length(subject) <= 120),
  add column clinical_topic text not null default '' check (char_length(clinical_topic) <= 120),
  add column subtopic text check (char_length(subtopic) <= 120);

create index questions_clinical_topic_idx on public.questions (topic, clinical_topic);

alter table public.question_keys
  -- {"A": "why A is wrong", ...}; normally one entry per incorrect option.
  add column option_explanations jsonb not null default '{}'::jsonb check (jsonb_typeof(option_explanations) = 'object'),
  add column exam_pearl text check (char_length(exam_pearl) <= 2000);

-- A per-submission ID chosen by the browser. Re-sending the same submission
-- (double click, network retry) returns the original result instead of
-- recording a second attempt.
alter table public.attempts add column client_id uuid;
create unique index attempts_user_client_id_idx on public.attempts (user_id, client_id) where client_id is not null;

-- ─── Grading, now returning the full teaching content ────────────────────
drop function public.submit_answer(text, text, public.attempt_mode);

create function public.submit_answer(
  p_slug text,
  p_selected text,
  p_mode public.attempt_mode default 'practice',
  p_client_id uuid default null
)
returns table (
  correct char(1),
  is_correct boolean,
  selected char(1),
  explanation_en text,
  explanation_ru text,
  option_explanations jsonb,
  exam_pearl text,
  tutor_hint text,
  topic text,
  duplicate boolean
)
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_user uuid := (select auth.uid());
  v_q public.questions;
  v_key public.question_keys;
  v_prev public.attempts;
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

  -- Same submission again? Return what was recorded the first time.
  if p_client_id is not null then
    select * into v_prev from public.attempts a where a.user_id = v_user and a.client_id = p_client_id;
    if found then
      if v_prev.question_id <> v_q.id then
        raise exception 'Submission ID already used' using errcode = '23505';
      end if;
      return query select v_key.correct, v_prev.is_correct, v_prev.selected, v_key.explanation_en, v_key.explanation_ru,
        v_key.option_explanations, v_key.exam_pearl, v_key.tutor_hint, v_q.topic, true;
      return;
    end if;
  end if;

  insert into public.attempts (user_id, question_id, selected, is_correct, mode, client_id)
  values (v_user, v_q.id, p_selected, p_selected = v_key.correct, p_mode, p_client_id);

  return query select v_key.correct, p_selected = v_key.correct, p_selected::char(1), v_key.explanation_en,
    v_key.explanation_ru, v_key.option_explanations, v_key.exam_pearl, v_key.tutor_hint, v_q.topic, false;
end;
$$;

revoke execute on function public.submit_answer(text, text, public.attempt_mode, uuid) from public, anon;
grant execute on function public.submit_answer(text, text, public.attempt_mode, uuid) to authenticated;

-- ─── Import, with the new fields ─────────────────────────────────────────
-- Row JSON gains: specialty (stored in questions.topic), subject, topic
-- (stored in clinical_topic), subtopic, key.option_explanations, key.exam_pearl.
drop function public.import_questions(jsonb, uuid);

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
      slug, topic, subject, clinical_topic, subtopic, difficulty, stem_en, stem_ru, key_terms, origin, source_id,
      source_ref, rights_status, review_status, reviewed_by, reviewed_at, review_note
    ) values (
      r ->> 'slug', r ->> 'specialty', coalesce(r ->> 'subject', ''), coalesce(r ->> 'topic', ''),
      nullif(r ->> 'subtopic', ''), (r ->> 'difficulty')::smallint, r ->> 'stem_en', nullif(r ->> 'stem_ru', ''),
      coalesce(r -> 'key_terms', '[]'::jsonb), (r ->> 'origin')::public.content_origin, p_source,
      nullif(r ->> 'source_ref', ''), (r ->> 'rights_status')::public.rights_status, v_status,
      case when v_status = 'approved' then v_user end,
      case when v_status = 'approved' then now() end,
      nullif(r ->> 'review_note', '')
    )
    on conflict (slug) do update set
      topic = excluded.topic, subject = excluded.subject, clinical_topic = excluded.clinical_topic,
      subtopic = excluded.subtopic, difficulty = excluded.difficulty, stem_en = excluded.stem_en,
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

    insert into public.question_keys as k (
      question_id, correct, explanation_en, explanation_ru, tutor_hint, option_explanations, exam_pearl
    ) values (
      v_id, r -> 'key' ->> 'correct', r -> 'key' ->> 'explanation_en', nullif(r -> 'key' ->> 'explanation_ru', ''),
      nullif(r -> 'key' ->> 'tutor_hint', ''), coalesce(r -> 'key' -> 'option_explanations', '{}'::jsonb),
      nullif(r -> 'key' ->> 'exam_pearl', '')
    )
    on conflict (question_id) do update set
      correct = excluded.correct, explanation_en = excluded.explanation_en,
      explanation_ru = excluded.explanation_ru, tutor_hint = excluded.tutor_hint,
      option_explanations = excluded.option_explanations, exam_pearl = excluded.exam_pearl;

    return query select r ->> 'slug', case when v_existed then 'updated' else 'created' end;
  end loop;
end;
$$;

revoke execute on function public.import_questions(jsonb, uuid) from public, anon;
grant execute on function public.import_questions(jsonb, uuid) to authenticated;
