-- ============================================================================
-- Assignment #4: NYC Vault — AI-generated location dossiers + community votes.
--
-- Run against Supabase with:
--   psql "$POSTGRES_URL_NON_POOLING" -f supabase/vault.sql
--
-- Design notes
-- ------------
-- The "vault" is members-only: all content lives behind authentication, so the
-- RLS model is "any authenticated user may READ everything, but may only WRITE
-- rows they own." Anonymous visitors get nothing from these tables.
--
-- RLS is enabled on EVERY table in the public schema (assignment requirement),
-- with the strictest policies the app can tolerate:
--   * generations: read = any signed-in user; insert/delete = owner only; no update.
--   * votes:       read = any signed-in user (needed to tally scores);
--                  insert/update/delete = owner only; one vote per user per dossier.
--   * profiles:    read = any signed-in user (to show dossier authors);
--                  insert/update = own row only.
--   * books:       already RLS-enabled with public read (see schema.sql) — unchanged.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. generations — one row per AI-generated location dossier.
--    We store BOTH the user's prompt and the generated output (assignment
--    requirement: "save the prompts you used to generate the media").
-- ----------------------------------------------------------------------------
create table if not exists public.generations (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  prompt        text not null,                 -- full prompt sent to the model
  neighborhood  text not null,
  category      text not null,
  place_name    text not null,                 -- generated: the spot's name
  blurb         text not null,                 -- generated: the pitch / intel
  model         text not null default 'gemini-2.5-flash',
  created_at    timestamptz not null default now()
);

create index if not exists generations_created_idx
  on public.generations (created_at desc);
create index if not exists generations_user_idx
  on public.generations (user_id);

-- ----------------------------------------------------------------------------
-- 2. votes — one row per (user, dossier). value is +1 (upvote) or -1 (downvote).
--    The UNIQUE constraint enforces one vote per user per dossier; the app
--    upserts on it so a user can flip their vote.
-- ----------------------------------------------------------------------------
create table if not exists public.votes (
  id             uuid primary key default gen_random_uuid(),
  generation_id  uuid not null references public.generations (id) on delete cascade,
  user_id        uuid not null references auth.users (id) on delete cascade,
  value          smallint not null check (value in (-1, 1)),
  created_at     timestamptz not null default now(),
  unique (generation_id, user_id)
);

create index if not exists votes_generation_idx
  on public.votes (generation_id);
create index if not exists votes_user_idx
  on public.votes (user_id);

-- ----------------------------------------------------------------------------
-- 3. Table privileges. RLS controls *rows*; GRANTs control table *access* via
--    the Data API. The vault is members-only, so only `authenticated` gets in.
-- ----------------------------------------------------------------------------
grant select, insert, delete on public.generations to authenticated;
grant select, insert, update, delete on public.votes to authenticated;

-- Tighten profiles: it no longer needs anonymous access (vault is gated).
revoke all on public.profiles from anon;
grant select, insert, update on public.profiles to authenticated;

-- ----------------------------------------------------------------------------
-- 4. Row Level Security — generations
-- ----------------------------------------------------------------------------
alter table public.generations enable row level security;

drop policy if exists "generations_read" on public.generations;
create policy "generations_read"
  on public.generations
  for select
  to authenticated
  using (true);

drop policy if exists "generations_insert_own" on public.generations;
create policy "generations_insert_own"
  on public.generations
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "generations_delete_own" on public.generations;
create policy "generations_delete_own"
  on public.generations
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- ----------------------------------------------------------------------------
-- 5. Row Level Security — votes
-- ----------------------------------------------------------------------------
alter table public.votes enable row level security;

drop policy if exists "votes_read" on public.votes;
create policy "votes_read"
  on public.votes
  for select
  to authenticated
  using (true);

drop policy if exists "votes_insert_own" on public.votes;
create policy "votes_insert_own"
  on public.votes
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "votes_update_own" on public.votes;
create policy "votes_update_own"
  on public.votes
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "votes_delete_own" on public.votes;
create policy "votes_delete_own"
  on public.votes
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- ----------------------------------------------------------------------------
-- 6. Row Level Security — profiles (was previously OFF; turn it ON now)
-- ----------------------------------------------------------------------------
alter table public.profiles enable row level security;

drop policy if exists "profiles_read" on public.profiles;
create policy "profiles_read"
  on public.profiles
  for select
  to authenticated
  using (true);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles
  for insert
  to authenticated
  with check ((select auth.uid()) = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles
  for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- ----------------------------------------------------------------------------
-- 7. generation_feed — read-only view that tallies votes per dossier and joins
--    the author's profile. security_invoker = true so the caller's RLS applies
--    (no privilege escalation through the view).
-- ----------------------------------------------------------------------------
drop view if exists public.generation_feed;
create view public.generation_feed
  with (security_invoker = true) as
select
  g.id,
  g.user_id,
  g.prompt,
  g.neighborhood,
  g.category,
  g.place_name,
  g.blurb,
  g.model,
  g.created_at,
  coalesce(sum(v.value), 0)::int                               as score,
  coalesce(count(*) filter (where v.value = 1), 0)::int        as upvotes,
  coalesce(count(*) filter (where v.value = -1), 0)::int       as downvotes,
  p.first_name                                                 as author_first,
  p.last_name                                                  as author_last,
  p.avatar_url                                                 as author_avatar
from public.generations g
left join public.votes v on v.generation_id = g.id
left join public.profiles p on p.id = g.user_id
group by g.id, p.first_name, p.last_name, p.avatar_url;

grant select on public.generation_feed to authenticated;
