-- ============================================================================
-- Week 5: "Saved" — a personal want-to-go list of vault dossiers.
--
-- Run with: psql "$POSTGRES_URL_NON_POOLING" -f supabase/saves.sql
--
-- Purely additive (new table only) so older graded deployments that share this
-- database keep working. RLS: a user can only see and change their own saves.
-- ============================================================================

create table if not exists public.saves (
  user_id        uuid not null references auth.users (id) on delete cascade,
  generation_id  uuid not null references public.generations (id) on delete cascade,
  created_at     timestamptz not null default now(),
  primary key (user_id, generation_id)
);

create index if not exists saves_generation_idx on public.saves (generation_id);

revoke all on public.saves from anon;
grant select, insert, delete on public.saves to authenticated;

alter table public.saves enable row level security;

drop policy if exists "saves_read_own" on public.saves;
create policy "saves_read_own"
  on public.saves
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "saves_insert_own" on public.saves;
create policy "saves_insert_own"
  on public.saves
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "saves_delete_own" on public.saves;
create policy "saves_delete_own"
  on public.saves
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);
