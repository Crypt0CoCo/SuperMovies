# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project

ReelRep: a film review platform POC. Users write reviews, the owner approves them manually, and approved reviewers receive ERC-20 tokens on Base Sepolia testnet (testnet only, never mainnet). Audience is ~10 friends. Deployed on Vercel. Planned later: Foundry, wagmi, viem.

[ROADMAP.md](ROADMAP.md) has the loop, the on-chain/off-chain boundary, the session-by-session build order (one session per day, don't work ahead), the hard boundaries and the deliberate POC compromises. Read it before starting a session.

Stack: Next.js 16 (App Router, React 19, TypeScript, Tailwind v4), Supabase (auth + Postgres), Drizzle ORM, TMDB movie API. The app lives in `reelrep/`; the git root is the parent `SuperMovies/` directory, which also has a stray `package.json`/`node_modules` from an early Supabase install — work inside `reelrep/`.

Next 16 differs from older versions. Before using a Next API, check `node_modules/next/dist/docs/` (e.g. `01-app/02-guides/upgrading/version-16.md`). Notably, `middleware.ts` is now `proxy.ts`.

## Rules

- This is a POC: prefer the simplest thing that works. No abstraction layers, no premature generalisation.
- Server Components by default; add `'use client'` only when genuinely needed.
- All DB access goes through Drizzle in server code. The Supabase JS client is for auth only, never for data.
- RLS is enabled with **no policies** on every table, intentionally. Drizzle uses direct Postgres credentials and bypasses RLS, so authorization is enforced in server code. Every new table gets RLS enabled with no policies.
- `reputation_events` is append-only: never UPDATE or DELETE it. Corrections are new rows with negative deltas.
- Mutations are Server Actions in `src/app/actions/`, validated with zod.

## Commands

Package manager is pnpm (`pnpm-lock.yaml`). Run from `reelrep/`:

```bash
pnpm dev          # dev server on http://localhost:3000
pnpm build
pnpm lint         # eslint (flat config, next core-web-vitals + typescript)
pnpm db:push      # drizzle-kit push schema to Supabase (loads .env.local via dotenv-cli)
pnpm db:studio    # drizzle studio
```

There is no test framework set up.

## Architecture

- **Database (Drizzle ORM + postgres-js)**: schema in `src/db/schema.ts`, client in `src/db/index.ts`. The runtime client uses `DATABASE_URL` (Supabase pooler, hence `prepare: false`); drizzle-kit uses `DIRECT_URL` (`drizzle.config.ts`). Schema changes are applied with `db:push`, not migrations. The `profiles`/`films`/`reviews` definitions are provisional (written while the DB was unreachable): reconcile with `drizzle-kit pull` before any `db:push`, or push may alter or drop live tables. Query helpers live in `src/db/queries/`.
- **Auth (Supabase SSR)**: `src/lib/supabase/server.ts` (Server Components/Actions, uses `cookies()`), `client.ts` (browser). Both use `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`. `src/proxy.ts` runs `updateSession` from `src/lib/supabase/middleware.ts` to refresh auth cookies on every request. Magic-link sign-in lands on `src/app/auth/callback/route.ts`, which accepts both `?code=` and `?token_hash=&type=`. `currentProfile()` in `src/lib/auth.ts` returns the signed-in user's `profiles` row (or null).
- **TMDB**: `src/lib/tmdb.ts` calls TMDB v3 server-side with `TMDB_READ_ACCESS_TOKEN` (Bearer), cached via `next: { revalidate: 86400 }`, and normalizes results to `{ tmdbId, title, year, posterPath }`.
- **Pages**: `/` (recent approved reviews), `/search` (TMDB search) → `/film/[tmdbId]` (DB row falling back to TMDB, `ReviewForm`, approved reviews), `/u/[handle]` (profile; the owner also sees pending/rejected), `/mod` (moderation queue, moderators only). Films are only stored in the DB once reviewed. The layout header calls `currentProfile()`, which is wrapped in React `cache()` so pages can call it again for free.
- **Review lists**: every query in `src/db/queries/reviews.ts` returns the same joined shape (`ReviewRow`: review + `author` + `film`), rendered by `src/components/ReviewCard.tsx`.
- **Reputation** (`src/lib/reputation.ts`, `src/app/actions/moderation.ts`): approving a review appends a `reputation_events` row (`BASE_POINTS × GRADE_MULTIPLIER[grade]`, tagged with the ISO `epoch_week`) and recomputes the cached `profiles.rep_score` and `tier` from `SUM(delta)`, all in one transaction. Approve/reject only act on `pending` reviews (the status check in the UPDATE's WHERE is the idempotency guard), and the author's profile row is locked `FOR UPDATE` before summing. Moderator access is `profiles.is_moderator`; grant it with `scripts/make-moderator.ts <email>`.
- Path alias `@/*` → `src/*`.

## Environment

`.env.local` (gitignored; `.env.example` is out of date) needs: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `DATABASE_URL`, `DIRECT_URL`, `TMDB_READ_ACCESS_TOKEN`.
