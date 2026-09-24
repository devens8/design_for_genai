# design_for_genai

A small Next.js (App Router) app deployed on Vercel.

- **Home** (`/`) — "Hello World" centered in a cursive font (Dancing Script).
- **Reading list** (`/books`) — rows fetched from a Supabase `books` table and rendered as cards.

**Live:** https://designforgenai.vercel.app

## Stack
- Next.js 15 (App Router) · React 19
- Supabase (Postgres) via the `@supabase/supabase-js` client
- pnpm · deployed on Vercel (auto-deploys on push to `main`)

## Local development
```bash
pnpm install
vercel env pull        # writes .env.local with Supabase config
pnpm dev
```

Requires `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (see `.env.local`).

## Database
Schema and seed data live in [`supabase/schema.sql`](supabase/schema.sql):
```bash
psql "$POSTGRES_URL_NON_POOLING" -f supabase/schema.sql
```
