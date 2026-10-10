-- Milestone 4: each student's progress, stored with their account.
-- Answers are already recorded in public.attempts by the grading functions.
-- These tables hold the rest. Every row belongs to one user, and row level
-- security lets users read and write only their own rows.

-- ─── Bookmarks ───────────────────────────────────────────────────────────
create table public.bookmarks (
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  question_id uuid not null references public.questions (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, question_id)
);

-- ─── Spaced-repetition cards (questions and terms) ───────────────────────
create type public.srs_item as enum ('question', 'term');

create table public.srs_cards (
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  item_type public.srs_item not null,
  -- Question slug or term id.
  item_id text not null check (item_id ~ '^[a-z0-9][a-z0-9-]{0,79}$'),
  due timestamptz not null,
  interval_days int not null default 0 check (interval_days between 0 and 36500),
  ease real not null default 2.5 check (ease between 1.3 and 5),
  reps int not null default 0 check (reps >= 0),
  lapses int not null default 0 check (lapses >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, item_type, item_id)
);

create index srs_cards_due_idx on public.srs_cards (user_id, due);

-- ─── Mock exam results ───────────────────────────────────────────────────
create table public.mock_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  blueprint_id text not null check (char_length(blueprint_id) <= 60),
  question_slugs text[] not null check (cardinality(question_slugs) between 1 and 300),
  answers jsonb not null default '{}'::jsonb,
  score int not null check (score >= 0),
  total int not null check (total > 0 and score <= total),
  passed boolean not null,
  duration_sec int not null check (duration_sec >= 0),
  submitted_at timestamptz not null default now()
);

create index mock_attempts_user_idx on public.mock_attempts (user_id, submitted_at desc);

-- ─── Row level security: own rows only ───────────────────────────────────
alter table public.bookmarks enable row level security;
alter table public.srs_cards enable row level security;
alter table public.mock_attempts enable row level security;

revoke all on public.bookmarks, public.srs_cards, public.mock_attempts from anon, authenticated;
grant select, insert, delete on public.bookmarks to authenticated;
grant select, insert, update, delete on public.srs_cards to authenticated;
grant select, insert on public.mock_attempts to authenticated;

create policy "Own bookmarks: read" on public.bookmarks for select to authenticated using ((select auth.uid()) = user_id);
create policy "Own bookmarks: add" on public.bookmarks for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Own bookmarks: remove" on public.bookmarks for delete to authenticated using ((select auth.uid()) = user_id);

create policy "Own cards: read" on public.srs_cards for select to authenticated using ((select auth.uid()) = user_id);
create policy "Own cards: add" on public.srs_cards for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Own cards: update" on public.srs_cards for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Own cards: remove" on public.srs_cards for delete to authenticated using ((select auth.uid()) = user_id);

create policy "Own mock results: read" on public.mock_attempts for select to authenticated using ((select auth.uid()) = user_id);
create policy "Own mock results: add" on public.mock_attempts for insert to authenticated with check ((select auth.uid()) = user_id);
