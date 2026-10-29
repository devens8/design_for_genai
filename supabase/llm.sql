-- ============================================================================
-- Week 7: LLM observability + configurable generation pipeline.
--
-- Run with: psql "$POSTGRES_URL_NON_POOLING" -f supabase/llm.sql
--
-- Purely additive (new tables only) so older graded deployments that share
-- this database keep working.
--
-- How the pieces fit:
--   llm_providers ─< llm_models            which APIs/models exist
--   prompt_chains ─< prompt_chain_steps    multi-step prompts; each step names a model
--   prompt_chain_mix                       weight per chain: which chain a new request uses
--   terms                                  NYC slang glossary injected into prompts ({{terms}})
--   generation_examples                    few-shot examples injected into prompts ({{examples}})
--   generation_requests ─< llm_responses   one request per "generate" click; one response per LLM call
--   allowed_signup_domains, whitelisted_emails   who may sign in to the main app
--
-- Security: config tables are readable by signed-in users (the generator reads
-- them). Logs and the signup allowlists are server-only: no grants to
-- anon/authenticated at all, so only the service-role key (server code) and
-- the admin app can touch them.
-- ============================================================================

create table if not exists public.llm_providers (
  id          bigint generated always as identity primary key,
  slug        text not null unique,          -- code dispatches on this ("gemini")
  name        text not null,
  base_url    text,
  notes       text,
  created_at  timestamptz not null default now()
);

create table if not exists public.llm_models (
  id           bigint generated always as identity primary key,
  provider_id  bigint not null references public.llm_providers (id) on delete restrict,
  name         text not null,                -- display name
  api_model_id text not null,                -- string sent to the provider API
  temperature  numeric(3, 2),
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  unique (provider_id, api_model_id)
);

create table if not exists public.prompt_chains (
  id           bigint generated always as identity primary key,
  slug         text not null unique,
  name         text not null,
  description  text,
  created_at   timestamptz not null default now()
);

create table if not exists public.prompt_chain_steps (
  id               bigint generated always as identity primary key,
  chain_id         bigint not null references public.prompt_chains (id) on delete cascade,
  step_order       int not null,
  name             text not null,
  llm_model_id     bigint not null references public.llm_models (id) on delete restrict,
  prompt_template  text not null,            -- {{neighborhood}} {{category}} {{notes}} {{terms}} {{examples}} {{previous_output}}
  expects_json     boolean not null default false,
  created_at       timestamptz not null default now(),
  unique (chain_id, step_order)
);

create table if not exists public.prompt_chain_mix (
  chain_id    bigint primary key references public.prompt_chains (id) on delete cascade,
  weight      int not null default 0 check (weight between 0 and 100),
  updated_at  timestamptz not null default now()
);

create table if not exists public.terms (
  id          bigint generated always as identity primary key,
  term        text not null unique,
  definition  text not null,
  example     text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.generation_examples (
  id            bigint generated always as identity primary key,
  neighborhood  text not null,
  category      text not null,
  place_name    text not null,
  blurb         text not null,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists public.generation_requests (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid references auth.users (id) on delete set null,
  source         text not null default 'app',   -- 'app' | 'admin'
  chain_id       bigint references public.prompt_chains (id) on delete set null,
  neighborhood   text not null,
  category       text not null,
  notes          text,
  status         text not null default 'pending' check (status in ('pending', 'succeeded', 'failed')),
  error          text,
  generation_id  uuid references public.generations (id) on delete set null,
  duration_ms    int,
  created_at     timestamptz not null default now(),
  completed_at   timestamptz
);
create index if not exists generation_requests_created_idx on public.generation_requests (created_at desc);

create table if not exists public.llm_responses (
  id             uuid primary key default gen_random_uuid(),
  request_id     uuid not null references public.generation_requests (id) on delete cascade,
  step_id        bigint references public.prompt_chain_steps (id) on delete set null,
  llm_model_id   bigint references public.llm_models (id) on delete set null,
  step_order     int not null,
  api_model_id   text not null,
  attempt        int not null default 1,
  prompt         text not null,
  response_text  text,
  status         text not null check (status in ('succeeded', 'failed')),
  error          text,
  http_status    int,
  input_tokens   int,
  output_tokens  int,
  duration_ms    int,
  created_at     timestamptz not null default now()
);
create index if not exists llm_responses_request_idx on public.llm_responses (request_id);
create index if not exists llm_responses_created_idx on public.llm_responses (created_at desc);

create table if not exists public.allowed_signup_domains (
  id          bigint generated always as identity primary key,
  domain      text not null unique check (domain = lower(domain) and domain !~ '@'),
  created_at  timestamptz not null default now()
);

create table if not exists public.whitelisted_emails (
  id          bigint generated always as identity primary key,
  email       text not null unique check (email = lower(email) and email ~ '^[^@\s]+@[^@\s]+$'),
  note        text,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- RLS on every new table. Config: signed-in read. Everything else: no policies
-- and no grants, so only the service role can reach it.
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'llm_providers', 'llm_models', 'prompt_chains', 'prompt_chain_steps',
    'prompt_chain_mix', 'terms', 'generation_examples', 'generation_requests',
    'llm_responses', 'allowed_signup_domains', 'whitelisted_emails'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
  end loop;

  foreach t in array array[
    'llm_providers', 'llm_models', 'prompt_chains', 'prompt_chain_steps',
    'prompt_chain_mix', 'terms', 'generation_examples'
  ] loop
    execute format('grant select on public.%I to authenticated', t);
    execute format('drop policy if exists "%s_read" on public.%I', t, t);
    execute format('create policy "%s_read" on public.%I for select to authenticated using (true)', t, t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Seeds (idempotent).
-- ---------------------------------------------------------------------------
insert into public.llm_providers (slug, name, base_url, notes) values
  ('gemini', 'Google Gemini', 'https://generativelanguage.googleapis.com/v1beta/interactions',
   'Free tier via GEMINI_API_KEY. The only provider wired up in code.')
on conflict (slug) do nothing;

insert into public.llm_models (provider_id, name, api_model_id, temperature)
select p.id, m.name, m.api_model_id, m.temperature
from public.llm_providers p,
  (values ('Gemini Flash Lite', 'gemini-flash-lite-latest', 0.9::numeric),
          ('Gemini Flash', 'gemini-flash-latest', 0.7::numeric)) as m(name, api_model_id, temperature)
where p.slug = 'gemini'
on conflict (provider_id, api_model_id) do nothing;

insert into public.prompt_chains (slug, name, description) values
  ('classic', 'Classic one-shot', 'The original single prompt: pick a spot and write the dossier in one call.'),
  ('scout-then-write', 'Scout, then write', 'Step 1 brainstorms three real candidates and picks one; step 2 writes the dossier from those notes.')
on conflict (slug) do nothing;

insert into public.prompt_chain_mix (chain_id, weight)
select id, case slug when 'classic' then 70 else 30 end from public.prompt_chains
on conflict (chain_id) do nothing;

insert into public.prompt_chain_steps (chain_id, step_order, name, llm_model_id, prompt_template, expects_json)
select c.id, s.step_order, s.name, m.id, s.tpl, s.expects_json
from (values
  ('classic', 1, 'Write dossier', true, $tpl$You are a sharp, chronically-online New Yorker writing a single "dossier"
entry for a vault of under-the-radar NYC spots.

Recommend ONE specific, real place to visit in {{neighborhood}}, New York
that fits the vibe: "{{category}}".
{{notes}}
Pick a genuinely specific, nameable place (not a generic "a cafe in the area").

Local slang you may use sparingly, only where it fits naturally:
{{terms}}

Examples of the tone we want:
{{examples}}

Return ONLY a JSON object with exactly these keys:
  "place_name": the name of the spot (string)
  "blurb": a punchy pitch of 2-3 sentences and UNDER 60 words — what it is,
           why it's worth the trip, and one insider tip. Confident, a little
           witty, no hashtags, no emoji.
Do not wrap the JSON in markdown or code fences.$tpl$),
  ('scout-then-write', 1, 'Scout candidates', false, $tpl$You are a New York City local who knows every block.

List THREE specific, real, currently-open places in {{neighborhood}}, New York
that fit the vibe "{{category}}".
{{notes}}
For each: name, cross streets, and one concrete detail only a regular would know.
Then say which ONE is the most underrated pick and why, in one sentence.
Plain text, no markdown headings.$tpl$),
  ('scout-then-write', 2, 'Write dossier', true, $tpl$You write entries for NYC Vault, a members-only list of under-the-radar NYC spots.

Here are a scout's notes on {{neighborhood}} ({{category}}):
---
{{previous_output}}
---

Write the dossier for the scout's chosen pick.
Local slang you may use sparingly, only where it fits naturally:
{{terms}}

Examples of the tone we want:
{{examples}}

Return ONLY a JSON object with exactly these keys:
  "place_name": the name of the spot (string)
  "blurb": 2-3 sentences, UNDER 60 words — what it is, why it's worth the trip,
           and one insider tip. Confident, a little witty, no hashtags, no emoji.
Do not wrap the JSON in markdown or code fences.$tpl$)
) as s(chain_slug, step_order, name, expects_json, tpl)
join public.prompt_chains c on c.slug = s.chain_slug
join public.llm_models m on m.api_model_id = 'gemini-flash-lite-latest'
on conflict (chain_id, step_order) do nothing;

insert into public.terms (term, definition, example) values
  ('bodega', 'A corner deli/convenience store, usually with a cat.', 'Grab a chopped cheese at the bodega on the corner.'),
  ('schmear', 'A swipe of cream cheese on a bagel.', 'Everything bagel, scallion schmear, done.'),
  ('stoop', 'The front steps of a brownstone; prime hangout real estate.', 'Eat it on a stoop on 4th Street.'),
  ('the city', 'Manhattan, when said by anyone in the other four boroughs.', 'Worth the trip in from the city.'),
  ('slice joint', 'A no-frills pizza counter selling by the slice.', 'A cash-only slice joint with a line out the door.'),
  ('deadass', 'Seriously; for real.', 'Deadass the best dumplings in Flushing.'),
  ('bridge and tunnel', 'Visitors from outside Manhattan; a crowd descriptor.', 'Go on a Tuesday to skip the bridge-and-tunnel crowd.'),
  ('regular', 'Coffee with milk and sugar, in diner-speak.', 'Order a coffee, regular, and a buttered roll.')
on conflict (term) do nothing;

insert into public.generation_examples (neighborhood, category, place_name, blurb)
select * from (values
  ('East Village', 'Eats', 'Mamoun''s Falafel',
   'A falafel counter that has outlasted every trend on MacDougal since 1971. Five bucks gets you a sandwich that beats most $20 lunches. Insider tip: ask for the hot sauce on the side — it''s nuclear.'),
  ('Roosevelt Island', 'Views', 'Four Freedoms Park',
   'Louis Kahn''s granite tip of Roosevelt Island, where Manhattan''s skyline lines up like it was arranged for you. Silent, symmetrical, never crowded. Take the tram over, the F train back.')
) as seed(neighborhood, category, place_name, blurb)
where not exists (select 1 from public.generation_examples);

insert into public.allowed_signup_domains (domain) values ('columbia.edu'), ('barnard.edu')
on conflict (domain) do nothing;

-- Grandfather every existing member so turning on the allowlist locks nobody out.
insert into public.whitelisted_emails (email, note)
select lower(email), 'existing member (backfilled)' from public.profiles
where email is not null and email ~ '^[^@\s]+@[^@\s]+$'
on conflict (email) do nothing;
