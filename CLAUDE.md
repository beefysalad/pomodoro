# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Tempo (aka "StudyQuest") is a gamified Pomodoro study planner: Next.js 16 (App Router) + Prisma + PostgreSQL, authenticated with Clerk. Users organize **Subjects** → **Topics**, run focus-timer **Sessions** (Blitz/Focus/Deep), and earn XP, levels, and streaks. It also includes a flashcard/deck feature and a weekly leaderboard.

## Commands

- `npm run dev` — start dev server (Next.js, Turbopack)
- `npm run build` — `prisma generate && prisma migrate deploy && next build && tsx prisma/seed.ts` (runs migrations and seeds as part of build)
- `npm run lint` — ESLint (flat config, `eslint-config-next`)
- `npm run format` / `npm run format:check` — Prettier (no semicolons, single quotes, tailwind class sorting via `prettier-plugin-tailwindcss`)
- `npm run db:seed` — run `prisma/seed.ts` directly
- `npx prisma studio` — inspect the database
- `npx prisma migrate dev` — create/apply a migration in development (schema lives in `prisma/schema.prisma`, generated client outputs to `app/generated/prisma`, not the default `node_modules` location)
- `npm run test:e2e` — Playwright e2e tests (`tests/*.spec.ts`); starts the dev server automatically via `webServer` in `playwright.config.ts`
- `npm run test:e2e:ui` — Playwright UI mode
  - Run a single test file: `npx playwright test tests/example.spec.ts`
  - Run a single test by name: `npx playwright test -g "test name"`
- `npm run clean` / `npm run restore` — these move/restore leftover boilerplate sample pages (`app/docs`, `components/landing`, `components/dashboard`) into `_sample_content/`; they are boilerplate-scaffolding scripts, not relevant to normal feature work

## Architecture

### Auth: Clerk is the real auth system

- `proxy.ts` is the Next.js 16 middleware convention (replaces `middleware.ts`) and uses `clerkMiddleware`/`createRouteMatcher` to protect `/dashboard`, `/onboarding`, `/stats`, `/leaderboard`, `/subjects`, `/settings`, redirecting authenticated users away from `/`.
- API routes are protected with the `withAuth` wrapper in `lib/with-auth-guard.ts`: it reads the Clerk session, upserts a matching Prisma `User` row keyed by `clerkUserId` (creating one on first API call if it doesn't exist yet), and passes `{ user, params }` into the handler.
- **`lib/auth.ts` (NextAuth/Auth.js credentials setup) and `lib/routes.ts` (route-name constants like `/login`, `/register`) are unused leftovers from the original boilerplate this project was forked from.** There is no `/login` or `/register` route in `app/` — real sign-in/sign-up pages are `app/sign-in` and `app/sign-up` (Clerk components). Don't extend the NextAuth path; use the Clerk + `withAuth` pattern for anything auth-related.

### Data flow layering

Each domain (subjects, topics, sessions, flashcards, leaderboard, user, quote) follows the same three-layer pattern — check existing files in each layer before adding a new domain:

1. **`app/api/<resource>/route.ts`** (+ `[id]/route.ts` for item-level operations) — route handlers wrapped in `withAuth`, validate input with Zod schemas from `lib/schemas/`, call Prisma directly (no separate service/repository layer).
2. **`lib/api/<resource>.ts`** — client-side fetch wrappers around the shared `axios` instance (`lib/axios.ts`), one function per operation (`getX`, `createX`, `updateX`, `deleteX`), typed with a local interface mirroring the Prisma model.
3. **`hooks/use-<resource>.ts`** — TanStack Query hooks (`useQuery`/`useMutation`) wrapping the `lib/api` functions, with a `queryKeys` object per file and manual `invalidateQueries` in mutation `onSuccess`.

Pages under `app/` stay thin and compose hooks + components; business logic lives in `lib/`.

### Prisma specifics

- Generated client output is `app/generated/prisma` (not `node_modules/@prisma/client`) — import types from `@/app/generated/prisma/client`.
- Uses the `@prisma/adapter-pg` driver adapter (`lib/prisma.ts`), not the default Prisma engine connection.
- Key models: `User` (per-user timer duration prefs, `totalXP`, `streak`, `timezone`), `Subject` → `Topic` → `Session`, `WeeklyLeaderboardSnapshot` (weekly rank snapshots), `FlashcardDeck` → `Flashcard`.

### Timer & gamification logic

- `contexts/timer-context.tsx` (`TimerProvider`/`useTimer`) holds all client-side timer state (mode, remaining time, running/phase state machine: `idle → timer → rating → idle`) — it's a single global timer instance, not per-topic.
- `lib/progression.ts` has the pure functions for level curve (`getLevelFromXp`, `getLevelProgress`, XP = level² × 100 floor) and streak calculation (`getNextStreak`, which is timezone-aware via `Intl.DateTimeFormat` day-key comparison, not raw UTC day diff).
- Timer modes (`blitz`/`focus`/`deep`) and their default minutes/XP are defined in both `contexts/timer-context.tsx` and `lib/progression.ts` — keep them in sync if changing durations or XP values, and check the `User` model's per-user override fields (`blitzMinutes`, `focusMinutes`, etc.) too.

### Design system

The UI is dark-mode-only with a strict violet/streak-orange palette and `Geist Mono` as the only font. Full rules (color tokens, typography scale, glow-not-shadow conventions, spacing) are documented in `docs/DESIGN-SYSTEM.md` — read it before writing or reviewing UI code. Don't use default Tailwind shadows or non-mono fonts; use the semantic color classes (e.g. `text-violet-mid`) defined in `app/globals.css` rather than raw hex values.

`docs/agents.md` is a stale leftover from the original Next.js/Prisma boilerplate template (describes NextAuth-based login flow, references a `FEATURES.md` that doesn't exist in this repo) — prefer this CLAUDE.md over it.
