-- ============================================================================
-- Bug reports: members report problems from any page of the main app; admins
-- triage them in the admin app (/bugs).
--
-- Run with: psql "$POSTGRES_URL_NON_POOLING" -f supabase/bugs.sql
--
-- Additive only. RLS: a signed-in member can file reports as themselves and
-- read their own; status/notes are only changed by the admin app (service
-- role), so there is no update grant for members.
-- ============================================================================

create table if not exists public.bug_reports (
  id           bigint generated always as identity primary key,
  user_id      uuid references auth.users (id) on delete set null,
  title        text not null check (char_length(title) between 3 and 120),
  description  text not null check (char_length(description) between 5 and 2000),
  severity     text not null default 'medium' check (severity in ('low', 'medium', 'high')),
  page_url     text check (char_length(page_url) <= 500),
  user_agent   text check (char_length(user_agent) <= 400),
  status       text not null default 'open' check (status in ('open', 'in_progress', 'fixed', 'wont_fix')),
  admin_notes  text check (char_length(admin_notes) <= 2000),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists bug_reports_created_idx on public.bug_reports (created_at desc);

alter table public.bug_reports enable row level security;
revoke all on public.bug_reports from anon, authenticated;
grant select on public.bug_reports to authenticated;
grant insert (user_id, title, description, severity, page_url, user_agent)
  on public.bug_reports to authenticated;
grant usage on sequence public.bug_reports_id_seq to authenticated;

drop policy if exists "bug_reports_insert_own" on public.bug_reports;
create policy "bug_reports_insert_own"
  on public.bug_reports for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "bug_reports_read_own" on public.bug_reports;
create policy "bug_reports_read_own"
  on public.bug_reports for select to authenticated
  using ((select auth.uid()) = user_id);
