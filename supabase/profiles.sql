-- Assignment #3: profiles table + auth.users trigger + avatar storage bucket.
-- Run against Supabase with:
--   psql "$POSTGRES_URL_NON_POOLING" -f supabase/profiles.sql
--
-- RLS is intentionally left OFF per the assignment. The app talks to this
-- table with the authenticated/anon keys; avatar uploads go through the
-- service-role key (see lib/supabase/admin.js), so no storage policies needed.

-- 1. Profiles table. first_name / last_name are nullable so we can prompt the
--    user to fill them in after their first login.
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text,
  first_name  text,
  last_name   text,
  bio         text,
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Keep RLS off for now (assignment says this is fine).
alter table public.profiles disable row level security;

-- Make sure the app's keys can read/write the table while RLS is off.
grant select, insert, update, delete on public.profiles to anon, authenticated;

-- 2. Trigger: when a new auth user is created, insert a matching profile row.
--    Google OAuth hands us given_name / family_name in the user metadata, so we
--    pre-fill them when present; they stay NULL otherwise and the app prompts.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, first_name, last_name, avatar_url)
  values (
    new.id,
    new.email,
    nullif(coalesce(new.raw_user_meta_data ->> 'given_name',
                    new.raw_user_meta_data ->> 'first_name'), ''),
    nullif(coalesce(new.raw_user_meta_data ->> 'family_name',
                    new.raw_user_meta_data ->> 'last_name'), ''),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 3. Backfill: create profile rows for any users that already exist.
insert into public.profiles (id, email, first_name, last_name, avatar_url)
select
  u.id,
  u.email,
  nullif(coalesce(u.raw_user_meta_data ->> 'given_name',
                  u.raw_user_meta_data ->> 'first_name'), ''),
  nullif(coalesce(u.raw_user_meta_data ->> 'family_name',
                  u.raw_user_meta_data ->> 'last_name'), ''),
  u.raw_user_meta_data ->> 'avatar_url'
from auth.users u
on conflict (id) do nothing;

-- 4. Public storage bucket for profile photos. Public so getPublicUrl() works
--    for display; writes are performed server-side with the service-role key.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;
