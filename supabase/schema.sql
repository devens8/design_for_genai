-- Reading-list table for the Assignment #2 list page.
-- Run against Supabase with:
--   psql "$POSTGRES_URL_NON_POOLING" -f supabase/schema.sql

create table if not exists public.books (
  id          bigint generated always as identity primary key,
  title       text not null,
  author      text not null,
  year        int,
  rating      numeric(2, 1),
  created_at  timestamptz not null default now()
);

-- Let the public (anon) key read rows via Row Level Security.
alter table public.books enable row level security;

drop policy if exists "public read access" on public.books;
create policy "public read access"
  on public.books
  for select
  to anon, authenticated
  using (true);

grant select on public.books to anon, authenticated;

-- Seed data (idempotent: only insert when the table is empty).
insert into public.books (title, author, year, rating)
select * from (values
  ('The Left Hand of Darkness', 'Ursula K. Le Guin', 1969, 4.8),
  ('Dune',                      'Frank Herbert',     1965, 4.7),
  ('Kindred',                   'Octavia E. Butler', 1979, 4.6),
  ('The Dispossessed',          'Ursula K. Le Guin', 1974, 4.5),
  ('Neuromancer',               'William Gibson',    1984, 4.3),
  ('A Wizard of Earthsea',      'Ursula K. Le Guin', 1968, 4.4),
  ('Snow Crash',                'Neal Stephenson',   1992, 4.2),
  ('The Fifth Season',          'N. K. Jemisin',     2015, 4.7)
) as seed(title, author, year, rating)
where not exists (select 1 from public.books);
