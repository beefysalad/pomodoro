# Backend service/repository layering

## Problem

Every API route in `app/api/**/route.ts` currently mixes four concerns in one function body: Clerk auth (via `withAuth`), Zod validation, ownership checks, and raw Prisma calls (including multi-step transactions like the session XP/streak update). There is no repository or service abstraction. This makes routes hard to unit test, duplicates ownership-check logic across files (`assertOwnedDeck`, `assertOwnedTopic`, `assertOwnedCard` are near-identical local helpers), and duplicates error-response boilerplate (~15 routes each hand-roll `try/catch` + `console.error` + a generic 500 JSON body).

Two concrete defects found during discovery, fixed as part of this work:

- `app/api/topics/[topicId]/flashcards/route.ts` is dead duplicate code — byte-for-byte the same logic as `app/api/decks/[deckId]/flashcards/route.ts`, reads `params.topicId` as if it were a deck id, and nothing in the frontend references it. Deleted during the flashcard migration.
- Ownership-check failures inconsistently return `403 "not found or unauthorized"` in some routes and `404 "not found"` in others for the same class of check. Nothing in the frontend branches on the specific status code (verified via grep across `lib/api` and `hooks`). Standardized to `404` via `NotFoundError`.

## Goals

- Introduce a `repository` layer (plain functions, one file per Prisma model) that owns all Prisma access and nothing else.
- Introduce a `service` layer (plain functions, one file per domain) that owns business rules: ownership/auth checks, XP/streak math, position/slug calculation, transaction boundaries.
- Routes become thin: parse input with existing `lib/schemas/*` Zod schemas → call one service function → shape the JSON response.
- Replace ad-hoc per-route error handling with typed domain errors mapped centrally to HTTP status codes.
- Add unit tests for every service, mocking the repository layer.
- Migrate every domain in one pass (subjects, topics, sessions, flashcard decks, flashcards, user, leaderboard, plus the Clerk webhook's user-upsert logic).

## Non-goals

- `app/api/quote/route.ts` — zero DB access (external fetch + in-memory cache only). No repository/service; left as-is.
- `app/api/integrations/spotify/*` — zero DB access (cookie-based PKCE OAuth flow only). No repository/service; left as-is.
- No change to the Zod schemas in `lib/schemas/*`, to `lib/progression.ts`'s pure functions, or to the client-side `lib/api/*.ts` / `hooks/use-*.ts` layers — this is a server-side-only refactor. Response JSON shapes stay the same so the client layers don't need changes.
- No behavior changes beyond the two defects listed above.

## Directory layout

```
lib/
  errors.ts                     # NotFoundError, ForbiddenError
  api-errors.ts                 # toErrorResponse(error, logLabel) -> NextResponse
  db.ts                         # export type Db = typeof prisma | Prisma.TransactionClient
  repositories/
    subject-repository.ts
    topic-repository.ts
    session-repository.ts
    flashcard-deck-repository.ts
    flashcard-repository.ts
    user-repository.ts
    leaderboard-repository.ts
  services/
    subject-service.ts
    subject-service.test.ts
    topic-service.ts
    topic-service.test.ts
    session-service.ts
    session-service.test.ts
    flashcard-deck-service.ts
    flashcard-deck-service.test.ts
    flashcard-service.ts
    flashcard-service.test.ts
    user-service.ts
    user-service.test.ts
    leaderboard-service.ts
    leaderboard-service.test.ts
```

## Conventions

### Repository layer

- One file per Prisma model. Exported plain functions only — no classes.
- Every function takes `db: Db` as its first argument (no default). Callers always pass either the shared `prisma` singleton or a `tx` handed down from a service's `prisma.$transaction(...)` call. This lets the same function run standalone or inside a transaction.
- Functions are named after what they do, not generic CRUD verbs where a more specific name reads better: `findById`, `findManyByUserId`, `findLastByPosition`, `create`, `update`, `updateMany`, `delete`, plus flow-specific ones like `lockForUpdate` (the raw-SQL `FOR UPDATE` read used by session creation).
- No business logic, no auth/ownership decisions, no thrown domain errors — a repository function returns `null`/`[]` when nothing matches, full stop.
- Example signature: `findById(db: Db, id: string): Promise<Subject | null>`.

### Service layer

- One file per domain. Exported plain functions only.
- Owns:
  - **Ownership/auth checks** — replaces the scattered `assertOwned*` helpers. A service function fetches via repository, checks `row.userId === userId` (or the equivalent nested check), and throws `NotFoundError` if it doesn't match. This centralizes what today are 5 near-duplicate `assertOwned*` functions into one pattern per domain.
  - **Business rules** — XP/streak calculation (delegates to existing `lib/progression.ts`), position calculation for new rows, slug generation (delegates to existing `lib/helper`), timezone resolution.
  - **Transaction boundaries** — a service function that needs atomicity opens `prisma.$transaction(async (tx) => { ...calls repo fns with tx... })` itself and passes `tx` to every repository call inside it. Repositories never open their own transactions.
- Functions are named after the use case: `createSubject`, `reorderSubjects`, `recordSession`, `updateTopicStatus`.

### Error handling

```ts
// lib/errors.ts
export class NotFoundError extends Error {}
export class ForbiddenError extends Error {}
```

```ts
// lib/api-errors.ts
export function toErrorResponse(error: unknown, logLabel: string): NextResponse {
  if (error instanceof z.ZodError) {
    return NextResponse.json({ error: 'Invalid request', issues: error.issues }, { status: 400 })
  }
  if (error instanceof NotFoundError) {
    return NextResponse.json({ error: error.message }, { status: 404 })
  }
  if (error instanceof ForbiddenError) {
    return NextResponse.json({ error: error.message }, { status: 403 })
  }
  console.error(logLabel, error)
  return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
}
```

`lib/with-auth-guard.ts`'s existing catch clause (which today always returns a generic 500) is changed to call `toErrorResponse(error, 'API error')`. Every route wrapped in `withAuth` can therefore drop its own `try/catch` entirely — the route body does its work and lets errors propagate; `withAuth` catches and maps them. This is a net deletion of boilerplate across all ~15 `withAuth`-wrapped routes, not a relocation of it.

`quote` and `webhooks/clerk` are not wrapped in `withAuth` and keep their own error handling: `quote` because its error path returns a cached-fallback JSON body rather than a `{ error }` shape, `webhooks/clerk` because it intentionally returns plain-text `Response` objects per Svix convention. `webhooks/clerk`'s Prisma calls do move to `user-repository.ts` / `user-service.ts` for consistency, but its `try/catch`-to-`Response` mapping stays bespoke.

### Validation

Zod parsing (using the existing schemas in `lib/schemas/*`) stays in the route layer, before the service call. Services receive already-shape-validated plain objects and focus purely on business rules.

## Domain scope

| Domain | Repository | Service | Routes migrated |
|---|---|---|---|
| subject | `subject-repository.ts` | `subject-service.ts` | `subjects/route.ts`, `subjects/[id]/route.ts`, `subjects/reorder/route.ts` |
| topic | `topic-repository.ts` | `topic-service.ts` | `subjects/[id]/topics/route.ts`, `subjects/[id]/topics/[topicId]/route.ts` |
| session | `session-repository.ts` | `session-service.ts` | `sessions/route.ts` |
| flashcard-deck | `flashcard-deck-repository.ts` | `flashcard-deck-service.ts` | `subjects/[id]/decks/route.ts`, `subjects/[id]/decks/[deckId]/route.ts` |
| flashcard | `flashcard-repository.ts` | `flashcard-service.ts` | `decks/[deckId]/flashcards/route.ts`, `decks/[deckId]/flashcards/[cardId]/route.ts` — `topics/[topicId]/flashcards/route.ts` deleted (dead duplicate) |
| user | `user-repository.ts` | `user-service.ts` | `user/route.ts`, `webhooks/clerk/route.ts` (Prisma calls only), `lib/with-auth-guard.ts`'s upsert-on-first-call |
| leaderboard | `leaderboard-repository.ts` | `leaderboard-service.ts` | `leaderboard/route.ts` |
| quote | — | — | not migrated (no DB access) |
| spotify integration | — | — | not migrated (no DB access) |

### Domain-specific notes

- **session**: `session-service.recordSession(userId, input, timezoneHeader)` verifies topic ownership via `topic-repository.findByIdWithSubject`, then opens one `prisma.$transaction`, calling `user-repository.lockForUpdate(tx, userId)` (the existing raw-SQL `FOR UPDATE` query), `session-repository.create(tx, ...)`, `topic-repository.incrementStats(tx, ...)`, and `user-repository.update(tx, ...)` in sequence — preserving today's locking behavior exactly.
- **leaderboard**: the in-memory cache (`leaderboardCache`, `cachedAt`, `CACHE_TTL_MS`) moves into `leaderboard-repository.ts` as an implementation detail of two functions, `getTopUsers()` and `getWeeklySnapshots(weekStart)` — caching is a data-fetching concern. `leaderboard-service.ts` keeps the pure computation (`rankWithTies`, `getDisplayName`, `getCurrentWeekStartUtc`) and assembles the response shape.
- **subject reorder**: `subject-service.reorderSubjects(userId, updates)` opens the transaction and calls `subject-repository.updateMany(tx, ...)` once per update, matching today's `prisma.$transaction([...])` behavior.
- **user**: `withAuth`'s inline upsert-on-first-call logic (in `lib/with-auth-guard.ts`) calls `user-repository.findByClerkId` / `user-repository.upsert` instead of calling `prisma` directly — this is the one place a repository is called from outside a service, since `withAuth` is infrastructure, not a domain route.

## Testing

- Add **Vitest** as a new devDependency (`vitest.config.ts`, `npm run test:unit` script). Runs alongside the existing `test:e2e` Playwright config without conflict (different script name, different file glob — Vitest picks up `*.test.ts`, Playwright picks up `tests/*.spec.ts`).
- Every service file gets a colocated `<domain>-service.test.ts` that mocks its repository module(s) with `vi.mock('@/lib/repositories/<domain>-repository')` and asserts business rules in isolation (no real DB):
  - Ownership checks throw `NotFoundError` for rows belonging to another user or that don't exist.
  - `session-service`: XP awarded matches `MODE_XP[mode]`, streak/level math matches `lib/progression.ts` expectations, the transaction calls repo functions in the right order.
  - `subject-service`: position calculation for new rows, reorder passes through all updates.
  - `flashcard-service`/`flashcard-deck-service`: choice de-duplication and the 6-choice cap.
  - `leaderboard-service`: `rankWithTies` tie-breaking, `getDisplayName` fallback to email-local-part.
- Repositories are not unit tested directly (they're thin Prisma wrappers with no branching logic); they're covered by existing Playwright e2e tests exercising the full routes.

## Migration order

One PR-sized phase at a time, each independently shippable and covered by the existing Playwright e2e suite plus new service unit tests:

1. **Foundation** — `lib/errors.ts`, `lib/api-errors.ts`, `lib/db.ts`, Vitest setup, update `lib/with-auth-guard.ts`'s catch clause and its inline upsert to use `user-repository`.
2. **user** — `user-repository.ts`, `user-service.ts`; migrate `user/route.ts` and the Prisma calls in `webhooks/clerk/route.ts`.
3. **subject** — migrate `subjects/route.ts`, `subjects/[id]/route.ts`, `subjects/reorder/route.ts`.
4. **topic** — migrate `subjects/[id]/topics/route.ts`, `subjects/[id]/topics/[topicId]/route.ts`.
5. **session** — migrate `sessions/route.ts` (the transactional flow).
6. **flashcard-deck** — migrate `subjects/[id]/decks/route.ts`, `subjects/[id]/decks/[deckId]/route.ts`.
7. **flashcard** — migrate `decks/[deckId]/flashcards/route.ts`, `decks/[deckId]/flashcards/[cardId]/route.ts`; delete `topics/[topicId]/flashcards/route.ts`.
8. **leaderboard** — migrate `leaderboard/route.ts`.

Each phase: write repository → write service + unit tests → migrate route(s) → run `npm run lint`, `npm run test:unit`, `npm run test:e2e` before moving to the next phase.
