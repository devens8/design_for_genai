# NYC Vault

A dark, high-tech "vault" of **AI-generated NYC location dossiers** that signed-in
users generate and the community rates. Built with Next.js (App Router) + Supabase,
deployed on Vercel.

- **Home** (`/`) — the "vault door": authenticate to unlock, or preview the archive.
- **Field Archive** (`/locations`) — **public**; curated real NYC spots from a
  Supabase `locations` table. The teaser logged-out visitors can browse.
- **The Vault** (`/vault`) — **protected**; feed of AI-generated location dossiers
  with up/down voting and a Latest / Top-rated (leaderboard) toggle.
- **Generate** (`/generate`) — **protected**; pick a neighborhood + category and
  Gemini writes a new dossier, saved to the database (prompt included).
- **Login** (`/login`) — Google OAuth "secure terminal".
- **Control Room** (`/dashboard`) & **Profile** (`/profile`) — **protected**.

**Live:** https://designforgenai.vercel.app

## Stack
- Next.js 15 (App Router) · React 19
- Supabase (Postgres + Auth + Storage) with **Row Level Security on every table**
  - `@supabase/ssr` — server/browser auth client wiring + session cookies
  - `@supabase/supabase-js` — Auth API calls + service-role storage uploads
- Google **Gemini** (Interactions API, `gemini-3.8-flash`) for generation
- pnpm · deployed on Vercel (auto-deploys on push to `main`)

## Data model & RLS
The vault is members-only: any authenticated user may **read** everything, but may
only **write rows they own**. Anonymous visitors see only the public `locations`.

| Table         | Read                | Write                                   |
|---------------|---------------------|-----------------------------------------|
| `locations`   | public (anon)       | seed data only                          |
| `generations` | authenticated       | insert/delete **own** rows              |
| `votes`       | authenticated       | insert/update/delete **own** vote (one per dossier) |
| `profiles`    | authenticated       | insert/update **own** row               |

- `generations` stores both the **prompt** and the generated place name + blurb.
- `votes` has a `unique (generation_id, user_id)` constraint — one vote per user
  per dossier; the app upserts so a user can flip or clear their vote.
- `generation_feed` is a `security_invoker` view that tallies scores and joins the
  author's profile — used for the feed and leaderboard.

## Auth flow
- Google OAuth → redirect URI is **`/auth/callback`** (`app/auth/callback/route.js`).
- `middleware.js` refreshes the session and guards `/vault`, `/generate`,
  `/profile`, `/dashboard`.
- On first login a DB trigger inserts a `profiles` row; if the name is empty the
  callback sends the user to `/profile?welcome=1`.
- Profile photos go to the Supabase **`avatars`** storage bucket (service-role
  key); only the public URL is stored — no binary image data in the database.

## Local development
```bash
pnpm install
vercel env pull                 # writes .env.local with Supabase config
echo 'GEMINI_API_KEY=...' >> .env.local   # free key: https://aistudio.google.com/apikey
pnpm dev
```

## Database setup
Run the SQL files against Supabase (in order):
```bash
psql "$POSTGRES_URL_NON_POOLING" -f supabase/profiles.sql    # profiles + trigger + avatars bucket
psql "$POSTGRES_URL_NON_POOLING" -f supabase/locations.sql   # public Field Archive (replaces books)
psql "$POSTGRES_URL_NON_POOLING" -f supabase/vault.sql       # generations + votes + RLS + feed view
```

## One-time setup (dashboards)
1. **Google Cloud** — create an OAuth 2.0 Client ID (Web application). Authorized
   redirect URI: `https://<project-ref>.supabase.co/auth/v1/callback`.
2. **Supabase → Authentication → Providers → Google** — enable it and paste the
   Google client ID + secret. Add the app's `/auth/callback` URL(s) under
   Authentication → URL Configuration → Redirect URLs.
3. **Vercel** — add `GEMINI_API_KEY` under Settings → Environment Variables, and
   turn off Deployment Protection so the page is viewable in Incognito.
