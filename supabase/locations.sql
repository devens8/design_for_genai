-- ============================================================================
-- Field Archive — a curated set of REAL, established NYC locations.
--
-- This replaces the old `books` reading list. Unlike the AI-generated `vault`
-- dossiers (members-only), the Field Archive is the one intentionally PUBLIC
-- table: it's the teaser logged-out visitors can preview before they unlock
-- the vault.
--
-- Run with: psql "$POSTGRES_URL_NON_POOLING" -f supabase/locations.sql
-- ============================================================================

-- Retire books entirely (its RLS policy drops with the table).
drop table if exists public.books cascade;

create table if not exists public.locations (
  id           bigint generated always as identity primary key,
  name         text not null,
  neighborhood text not null,
  category     text not null,
  description  text not null,
  created_at   timestamptz not null default now()
);

-- Public read: this is the only table anonymous visitors may see.
alter table public.locations enable row level security;

drop policy if exists "locations_public_read" on public.locations;
create policy "locations_public_read"
  on public.locations
  for select
  to anon, authenticated
  using (true);

grant select on public.locations to anon, authenticated;

-- Seed real NYC spots (idempotent: only when the table is empty).
insert into public.locations (name, neighborhood, category, description)
select * from (values
  ('The Cloisters',             'Washington Heights', 'Culture',       'A medieval monastery transplanted above the Hudson — tapestries, gardens, and the quietest museum in Manhattan.'),
  ('Joe''s Pizza',              'West Village',       'Eats',          'The platonic NYC slice since 1975. Fold it, don''t overthink it, eat it standing on Carmine Street.'),
  ('Brooklyn Bridge Park',      'DUMBO',              'Views',         'Piers, lawns, and the single best skyline view in the city. Catch it at golden hour from Pier 1.'),
  ('McSorley''s Old Ale House', 'East Village',       'Nightlife',     'Open since 1854. Two choices: light or dark, served two mugs at a time, sawdust on the floor.'),
  ('Prospect Park',             'Park Slope',         'Outdoors',      'Olmsted and Vaux''s other park — wilder and less touristy than Central Park. The Long Meadow is unbeatable.'),
  ('The Strand',                'Union Square',       'Culture',       '18 miles of books. Dig through the dollar carts out front, then get lost in the basement review copies.'),
  ('Smorgasburg',               'Williamsburg',       'Eats',          'The country''s largest open-air food market, weekends only. Come hungry, bring cash, pace yourself.'),
  ('Roosevelt Island Tram',     'Midtown East',       'Cheap Thrills', 'An aerial commuter tram with skyline views for a subway swipe. The most underrated $2.90 in the city.'),
  ('Grand Central Terminal',    'Midtown',            'Culture',       'Look up at the backwards zodiac ceiling, then whisper into the corner of the Whispering Gallery downstairs.')
) as seed(name, neighborhood, category, description)
where not exists (select 1 from public.locations);
