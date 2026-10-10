-- Milestone 2: student profiles.
-- One row per account, created automatically at sign-up.
-- Security model (docs/PROPOSAL.md §4):
--   * a signed-in user can read and edit only their own row;
--   * the `role` column can never be changed by the user (column privileges),
--     only by the server with the service key or by an admin migration;
--   * signed-out visitors (`anon`) can read nothing.

create type public.user_role as enum ('student', 'reviewer', 'admin');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '' check (char_length(display_name) <= 80),
  role public.user_role not null default 'student',
  show_russian boolean not null default true,
  target_exam_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'One row per user account. Users may edit only display_name, show_russian and target_exam_date.';

alter table public.profiles enable row level security;

create policy "Users can read their own profile"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- No insert or delete policies: rows are created by the trigger below and
-- removed when the auth user is deleted.

-- Table and column privileges. Supabase grants everything on public tables by
-- default, so start from nothing and grant back only what is needed.
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (display_name, show_russian, target_exam_date) on public.profiles to authenticated;

-- Keep updated_at current.
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Create a profile whenever a new auth user is created.
-- `security definer` lets it insert even though users have no insert privilege.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    left(
      coalesce(
        nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
        split_part(new.email, '@', 1),
        'Student'
      ),
      80
    )
  );
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
