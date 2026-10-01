# design_for_genai

A small Next.js (App Router) app deployed on Vercel.

- **Home** (`/`) — "Hello World" in a cursive font, with auth-aware navigation.
- **Reading list** (`/books`) — rows fetched from a Supabase `books` table.
- **Login** (`/login`) — Google OAuth sign-in.
- **Dashboard** (`/dashboard`) — **protected**; only visible when signed in.
- **Profile** (`/profile`) — **protected**; edit first/last name, bio, and upload
  a profile photo. New users are prompted here to complete their name.

**Live:** https://designforgenai.vercel.app

## Stack
- Next.js 15 (App Router) · React 19
- Supabase (Postgres + Auth + Storage)
  - `@supabase/ssr` — server/browser auth client wiring + session cookies
  - `@supabase/supabase-js` — Auth API calls + service-role storage uploads
- pnpm · deployed on Vercel (auto-deploys on push to `main`)

## Auth flow
- Google OAuth → redirect URI is **`/auth/callback`** (`app/auth/callback/route.js`),
  which exchanges the code for a session.
- `middleware.js` refreshes the session and guards `/profile` and `/dashboard`.
- On first login, a DB trigger inserts a `profiles` row; if the name is empty the
  callback sends the user to `/profile?welcome=1` to fill it in.
- Profile photos are uploaded to the Supabase **`avatars`** storage bucket
  (server-side, service-role key). Only the public URL is stored on the row —
  **no binary image data in the database.**

## Local development
```bash
pnpm install
vercel env pull        # writes .env.local with Supabase config
pnpm dev
```

## Database
- Reading list: [`supabase/schema.sql`](supabase/schema.sql)
- Profiles table, `auth.users` trigger, and avatars bucket:
  [`supabase/profiles.sql`](supabase/profiles.sql)

```bash
psql "$POSTGRES_URL_NON_POOLING" -f supabase/profiles.sql
```

## One-time setup (dashboards)
1. **Google Cloud** — create an OAuth 2.0 Client ID (Web application). Authorized
   redirect URI: `https://<project-ref>.supabase.co/auth/v1/callback`.
2. **Supabase → Authentication → Providers → Google** — enable it and paste the
   Google client ID + secret. Add the app's `/auth/callback` URL(s) under
   Authentication → URL Configuration → Redirect URLs.
3. **Vercel** — turn off Deployment Protection so the page is viewable in
   Incognito.
