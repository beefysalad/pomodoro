# Backend Service/Repository Layering Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Introduce a repository layer (Prisma access) and a service layer (business rules, ownership checks, transactions) between every API route and Prisma, replacing inline Prisma calls, duplicated ownership-check helpers, and ad-hoc per-route error handling.

**Architecture:** Plain function modules — `lib/repositories/<domain>-repository.ts` (thin Prisma wrappers taking a `Db` first argument) and `lib/services/<domain>-service.ts` (ownership checks throwing typed errors, business math, transaction boundaries). Routes parse with existing Zod schemas, call one service function, and shape the response. `lib/with-auth-guard.ts`'s existing catch clause maps thrown errors to HTTP responses via a shared helper, so routes no longer need their own try/catch.

**Tech Stack:** Next.js 16 App Router, Prisma 7 (`@prisma/adapter-pg`, generated client at `app/generated/prisma`), Zod 4, Vitest (new) for unit tests, existing Playwright e2e suite.

## Global Constraints

- Every repository function's first parameter is `db: Db` (`lib/db.ts`), never a default — callers always pass `prisma` or a `tx`.
- Every service function's first parameter is `userId: string` where the operation is user-scoped.
- No route keeps its own `try/catch` once wrapped in `withAuth` — errors propagate and `withAuth`'s catch calls `toErrorResponse`.
- `quote` and `spotify` integration routes are out of scope — do not touch them.
- Response JSON shapes must stay byte-identical to today's, except: (1) ownership-check failures return `404` instead of the previous mix of `403`/`404`, (2) `app/api/topics/[topicId]/flashcards/route.ts` is deleted (dead duplicate, verified unreferenced).
- No file in this plan uses the literal type `any` — this repo's ESLint config (`eslint-config-next/typescript`) enforces `@typescript-eslint/no-explicit-any` as an error with zero existing precedent for `any` or `eslint-disable` anywhere in the codebase. Every test file that needs a fake Prisma-shaped object defines a local `function fake<T>(partial: Partial<T>): T { return partial as T }` and calls it as `fake<ModelType>({...})` instead of `{...} as any`. `lib/db.ts`'s `ExtractTx` type uses `options?: infer O` (an inferred, unnamed type parameter), never `any`.
- Full spec: `docs/superpowers/specs/2026-07-09-backend-service-repository-layering-design.md`.

---

### Task 1: Add Vitest and verify the test runner works

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`

**Interfaces:**
- Produces: `npm run test:unit` script that runs Vitest against `lib/**/*.test.ts`.

- [ ] **Step 1: Install Vitest**

Run: `npm install -D vitest`

- [ ] **Step 2: Create the Vitest config**

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['lib/**/*.test.ts'],
    passWithNoTests: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
})
```

- [ ] **Step 3: Add the `test:unit` script**

In `package.json`, add to `"scripts"` (keep every existing script as-is):

```json
"test:unit": "vitest run",
```

- [ ] **Step 4: Verify the config loads**

Run: `npm run test:unit`
Expected: `No test files found, exiting with code 0` (or equivalent Vitest "no tests" message) — a non-error exit confirms `passWithNoTests` and the config are wired correctly. There are no `*.test.ts` files yet, so this is expected, not a failure.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json vitest.config.ts
git commit -m "chore: add vitest for service-layer unit tests"
```

---

### Task 2: Add typed errors and the central error-response mapper

**Files:**
- Create: `lib/errors.ts`
- Create: `lib/api-errors.ts`
- Test: `lib/api-errors.test.ts`

**Interfaces:**
- Produces: `NotFoundError`, `ForbiddenError` (both `extends Error`) from `@/lib/errors`; `toErrorResponse(error: unknown, logLabel: string): NextResponse` from `@/lib/api-errors`.

- [ ] **Step 1: Write the failing test**

```ts
// lib/api-errors.test.ts
import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { toErrorResponse } from './api-errors'
import { NotFoundError, ForbiddenError } from './errors'

describe('toErrorResponse', () => {
  it('maps a ZodError to 400 with issues', async () => {
    const schema = z.object({ name: z.string().min(1) })
    const result = schema.safeParse({ name: '' })
    if (result.success) throw new Error('expected parse to fail')

    const response = toErrorResponse(result.error, 'test')
    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toBe('Invalid request')
    expect(Array.isArray(body.issues)).toBe(true)
  })

  it('maps NotFoundError to 404', async () => {
    const response = toErrorResponse(new NotFoundError('Subject not found'), 'test')
    expect(response.status).toBe(404)
    const body = await response.json()
    expect(body.error).toBe('Subject not found')
  })

  it('maps ForbiddenError to 403', async () => {
    const response = toErrorResponse(new ForbiddenError('Not your subject'), 'test')
    expect(response.status).toBe(403)
    const body = await response.json()
    expect(body.error).toBe('Not your subject')
  })

  it('maps unknown errors to 500 and logs them under the given label', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const response = toErrorResponse(new Error('boom'), 'test label')
    expect(response.status).toBe(500)
    const body = await response.json()
    expect(body.error).toBe('Internal Server Error')
    expect(consoleSpy).toHaveBeenCalledWith('test label', expect.any(Error))
    consoleSpy.mockRestore()
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test:unit -- lib/api-errors.test.ts`
Expected: FAIL — `Cannot find module './api-errors'` (and `./errors`) since neither file exists yet.

- [ ] **Step 3: Write `lib/errors.ts`**

```ts
// lib/errors.ts
export class NotFoundError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'NotFoundError'
  }
}

export class ForbiddenError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ForbiddenError'
  }
}
```

- [ ] **Step 4: Write `lib/api-errors.ts`**

```ts
// lib/api-errors.ts
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { NotFoundError, ForbiddenError } from '@/lib/errors'

export function toErrorResponse(error: unknown, logLabel: string): NextResponse {
  if (error instanceof z.ZodError) {
    return NextResponse.json(
      { error: 'Invalid request', issues: error.issues },
      { status: 400 }
    )
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

- [ ] **Step 5: Run the test to verify it passes**

Run: `npm run test:unit -- lib/api-errors.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 6: Commit**

```bash
git add lib/errors.ts lib/api-errors.ts lib/api-errors.test.ts
git commit -m "feat: add typed domain errors and central error-response mapper"
```

---

### Task 3: Add the `Db` transaction-aware type helper

**Files:**
- Create: `lib/db.ts`

**Interfaces:**
- Consumes: `prisma` default export from `@/lib/prisma` (already exists).
- Produces: `export type Db` from `@/lib/db` — accepted as the first parameter of every repository function in later tasks. `Db` is `typeof prisma | <the type of prisma's interactive-transaction client>`, so the same repository function works whether called with the shared `prisma` singleton or a `tx` handed down from `prisma.$transaction(async (tx) => ...)`.

- [ ] **Step 1: Write `lib/db.ts`**

```ts
// lib/db.ts
import prisma from './prisma'

// Extracts the type of the `tx` parameter from prisma.$transaction's
// interactive-callback overload, so Db covers both the shared client and a
// transaction client without depending on Prisma's internal type names.
type TransactionCallback<T> = (tx: T) => Promise<unknown>
// options is inferred (not typed `any`/`unknown`) — that's what keeps the
// overload match working; typing it explicitly breaks the inference.
type ExtractTx<F> = F extends (fn: TransactionCallback<infer T>, options?: infer O) => unknown
  ? T
  : never

export type Db = typeof prisma | ExtractTx<typeof prisma.$transaction>
```

- [ ] **Step 2: Verify it compiles and is usable both ways**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: no errors related to `lib/db.ts`.

- [ ] **Step 3: Commit**

```bash
git add lib/db.ts
git commit -m "feat: add Db type covering both the shared prisma client and transactions"
```

---

### Task 4: User data layer — repository + service + tests

**Files:**
- Create: `lib/repositories/user-repository.ts`
- Create: `lib/services/user-service.ts`
- Test: `lib/services/user-service.test.ts`

**Interfaces:**
- Consumes: `Db` from `@/lib/db`; `User` type from `@/app/generated/prisma/client`.
- Produces (repository, used by Task 5's `withAuth` update, Task 6's routes, and Task 11's session service):
  - `findById(db: Db, id: string): Promise<User | null>`
  - `findByClerkId(db: Db, clerkUserId: string): Promise<User | null>`
  - `upsertByClerkId(db: Db, input: UpsertUserInput): Promise<User>` where `UpsertUserInput = { clerkUserId: string; email: string; firstName: string | null; lastName: string | null }`
  - `createByClerkId(db: Db, input: UpsertUserInput): Promise<User>`
  - `updateByClerkId(db: Db, clerkUserId: string, data: { email: string; firstName: string | null; lastName: string | null }): Promise<User>`
  - `deleteByClerkId(db: Db, clerkUserId: string): Promise<User>`
  - `updatePreferences(db: Db, id: string, data: UpdatePreferencesInput): Promise<User>` where `UpdatePreferencesInput = Partial<{ onboarded: boolean; timezone: string; blitzMinutes: number; focusMinutes: number; deepMinutes: number; shortBreakMinutes: number; longBreakMinutes: number; hasSeenTutorial: boolean }>`
  - `updateProgression(db: Db, id: string, data: UpdateProgressionInput): Promise<User>` where `UpdateProgressionInput = { totalXP: number; streak: number; lastStudiedAt: Date; timezone?: string }`
  - `lockForUpdate(db: Db, userId: string): Promise<LockedUserRow | null>` where `LockedUserRow = { totalXP: number; streak: number; lastStudiedAt: Date | null; timezone: string }`
- Produces (service): `updateUserPreferences(userId: string, input: UpdatePreferencesInput): Promise<User>`

- [ ] **Step 1: Write the failing test**

```ts
// lib/services/user-service.test.ts
import { describe, expect, it, vi, beforeEach } from 'vitest'
import prisma from '@/lib/prisma'
import * as userRepository from '@/lib/repositories/user-repository'
import { updateUserPreferences } from './user-service'
import type { User } from '@/app/generated/prisma/client'

vi.mock('@/lib/prisma', () => ({ default: {} }))
vi.mock('@/lib/repositories/user-repository')

// Builds a fake of T from a partial shape without using `any` — every test
// file in this plan that needs a fake Prisma-shaped object uses this same
// helper, imported or redefined locally per file.
function fake<T>(partial: Partial<T>): T {
  return partial as T
}

describe('updateUserPreferences', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('passes the input through to the repository with the shared prisma client', async () => {
    const fakeUser = fake<User>({ id: 'user_1' })
    vi.mocked(userRepository.updatePreferences).mockResolvedValue(fakeUser)

    const result = await updateUserPreferences('user_1', {
      onboarded: true,
      timezone: 'America/New_York',
    })

    expect(userRepository.updatePreferences).toHaveBeenCalledWith(prisma, 'user_1', {
      onboarded: true,
      timezone: 'America/New_York',
    })
    expect(result).toBe(fakeUser)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test:unit -- lib/services/user-service.test.ts`
Expected: FAIL — `Cannot find module './user-service'`

- [ ] **Step 3: Write `lib/repositories/user-repository.ts`**

```ts
// lib/repositories/user-repository.ts
import type { User } from '@/app/generated/prisma/client'
import type { Db } from '@/lib/db'

export interface UpsertUserInput {
  clerkUserId: string
  email: string
  firstName: string | null
  lastName: string | null
}

export function findById(db: Db, id: string): Promise<User | null> {
  return db.user.findUnique({ where: { id } })
}

export function findByClerkId(db: Db, clerkUserId: string): Promise<User | null> {
  return db.user.findUnique({ where: { clerkUserId } })
}

export function upsertByClerkId(db: Db, input: UpsertUserInput): Promise<User> {
  return db.user.upsert({
    where: { clerkUserId: input.clerkUserId },
    update: {
      email: input.email,
      firstName: input.firstName,
      lastName: input.lastName,
    },
    create: input,
  })
}

export function createByClerkId(db: Db, input: UpsertUserInput): Promise<User> {
  return db.user.create({ data: input })
}

export function updateByClerkId(
  db: Db,
  clerkUserId: string,
  data: { email: string; firstName: string | null; lastName: string | null }
): Promise<User> {
  return db.user.update({ where: { clerkUserId }, data })
}

export function deleteByClerkId(db: Db, clerkUserId: string): Promise<User> {
  return db.user.delete({ where: { clerkUserId } })
}

export interface UpdatePreferencesInput {
  onboarded?: boolean
  timezone?: string
  blitzMinutes?: number
  focusMinutes?: number
  deepMinutes?: number
  shortBreakMinutes?: number
  longBreakMinutes?: number
  hasSeenTutorial?: boolean
}

export function updatePreferences(db: Db, id: string, data: UpdatePreferencesInput): Promise<User> {
  return db.user.update({ where: { id }, data })
}

export interface UpdateProgressionInput {
  totalXP: number
  streak: number
  lastStudiedAt: Date
  timezone?: string
}

export function updateProgression(db: Db, id: string, data: UpdateProgressionInput): Promise<User> {
  return db.user.update({ where: { id }, data })
}

export interface LockedUserRow {
  totalXP: number
  streak: number
  lastStudiedAt: Date | null
  timezone: string
}

export async function lockForUpdate(db: Db, userId: string): Promise<LockedUserRow | null> {
  const rows = await db.$queryRaw<LockedUserRow[]>`
    SELECT "totalXP", streak, "lastStudiedAt", timezone
    FROM "User"
    WHERE id = ${userId}
    FOR UPDATE
  `
  return rows[0] ?? null
}
```

- [ ] **Step 4: Write `lib/services/user-service.ts`**

```ts
// lib/services/user-service.ts
import prisma from '@/lib/prisma'
import * as userRepository from '@/lib/repositories/user-repository'
import type { User } from '@/app/generated/prisma/client'
import type { UpdatePreferencesInput } from '@/lib/repositories/user-repository'

export async function updateUserPreferences(
  userId: string,
  input: UpdatePreferencesInput
): Promise<User> {
  return userRepository.updatePreferences(prisma, userId, input)
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npm run test:unit -- lib/services/user-service.test.ts`
Expected: PASS (1 test)

- [ ] **Step 6: Commit**

```bash
git add lib/repositories/user-repository.ts lib/services/user-service.ts lib/services/user-service.test.ts
git commit -m "feat: add user repository and service layer"
```

---

### Task 5: Wire the user data layer into `withAuth` and the error mapper

**Files:**
- Modify: `lib/with-auth-guard.ts`

**Interfaces:**
- Consumes: `userRepository.findByClerkId`, `userRepository.upsertByClerkId` (Task 4); `toErrorResponse` (Task 2).
- Produces: same `withAuth`/`AuthContext`/`WithAuthOptions` exports as before — no signature change, only internal implementation changes. Every route wrapped in `withAuth` can now drop its own `try/catch`, since thrown errors (including `NotFoundError`/`ForbiddenError`/`ZodError`) are mapped by `toErrorResponse` here.

- [ ] **Step 1: Replace the direct Prisma calls and the generic catch-all**

Full replacement for `lib/with-auth-guard.ts`:

```ts
import { auth, currentUser } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import prisma from './prisma'
import { User } from '@/app/generated/prisma/client'
import { checkRateLimit, type RateLimitConfig } from './rate-limit'
import * as userRepository from './repositories/user-repository'
import { toErrorResponse } from './api-errors'

export interface AuthContext {
  user: User
  params: Record<string, string>
}

export interface WithAuthOptions {
  rateLimit?: RateLimitConfig
}

export function withAuth(
  handler: (req: NextRequest, context: AuthContext) => Promise<NextResponse>,
  options?: WithAuthOptions
) {
  return async (
    req: NextRequest,
    context: {
      params?: Promise<Record<string, string>> | Record<string, string>
    }
  ): Promise<NextResponse> => {
    try {
      const { userId: clerkUserId } = await auth()

      if (!clerkUserId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const user = await userRepository.findByClerkId(prisma, clerkUserId)

      let resolvedUser = user
      if (!resolvedUser) {
        const clerkProfile = await currentUser()
        const email = clerkProfile?.emailAddresses?.[0]?.emailAddress

        if (!email) {
          return NextResponse.json(
            { error: 'User email not available from Clerk' },
            { status: 400 }
          )
        }

        resolvedUser = await userRepository.upsertByClerkId(prisma, {
          clerkUserId,
          email,
          firstName: clerkProfile?.firstName ?? null,
          lastName: clerkProfile?.lastName ?? null,
        })
      }

      if (options?.rateLimit) {
        const routeKey = `${req.method}:${req.nextUrl.pathname}`
        const result = await checkRateLimit(
          `${resolvedUser.id}:${routeKey}`,
          options.rateLimit
        )

        if (!result.allowed) {
          return NextResponse.json(
            { error: 'Too many requests. Please slow down.' },
            {
              status: 429,
              headers: { 'Retry-After': String(result.retryAfterSeconds) },
            }
          )
        }
      }

      const resolvedParams =
        context?.params instanceof Promise
          ? await context.params
          : context?.params || {}

      const authContext: AuthContext = {
        user: resolvedUser,
        params: resolvedParams,
      }

      return await handler(req, authContext)
    } catch (error) {
      return toErrorResponse(error, 'Auth helper error')
    }
  }
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: no errors.

- [ ] **Step 3: Lint**

Run: `npm run lint`
Expected: no new errors.

- [ ] **Step 4: Commit**

```bash
git add lib/with-auth-guard.ts
git commit -m "refactor: route withAuth's user lookup through user-repository and centralize error mapping"
```

---

### Task 6: Migrate `/api/user` and the Clerk webhook to the user data layer

**Files:**
- Modify: `app/api/user/route.ts`
- Modify: `app/api/webhooks/clerk/route.ts`

**Interfaces:**
- Consumes: `updateUserPreferences` (Task 4 service); `userRepository.createByClerkId`, `updateByClerkId`, `deleteByClerkId` (Task 4 repository).

- [ ] **Step 1: Rewrite `app/api/user/route.ts`**

```ts
import { withAuth, AuthContext } from '@/lib/with-auth-guard'
import { NextRequest, NextResponse } from 'next/server'
import { UpdateUserSchemaApi } from '@/lib/schemas/user'
import { DEFAULT_MUTATION_RATE_LIMIT } from '@/lib/rate-limit'
import { updateUserPreferences } from '@/lib/services/user-service'

export const GET = withAuth(async (req: NextRequest, { user }: AuthContext) => {
  return NextResponse.json({ user })
})

export const PATCH = withAuth(
  async (req: NextRequest, { user }: AuthContext) => {
    const body = await req.json()
    const parsed = UpdateUserSchemaApi.parse(body)
    const updatedUser = await updateUserPreferences(user.id, parsed)
    return NextResponse.json({ user: updatedUser })
  },
  { rateLimit: DEFAULT_MUTATION_RATE_LIMIT }
)
```

- [ ] **Step 2: Rewrite `app/api/webhooks/clerk/route.ts`**

Only the three `prisma.user.*` calls change (to `userRepository.*`); the Svix verification and plain-`Response` error handling stay exactly as-is:

```ts
import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import prisma from '@/lib/prisma'
import * as userRepository from '@/lib/repositories/user-repository'

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

  if (!WEBHOOK_SECRET) {
    throw new Error(
      'Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local'
    )
  }

  const headerPayload = await headers()
  const svix_id = headerPayload.get('svix-id')
  const svix_timestamp = headerPayload.get('svix-timestamp')
  const svix_signature = headerPayload.get('svix-signature')

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occured -- no svix headers', { status: 400 })
  }

  const body = await req.text()
  const wh = new Webhook(WEBHOOK_SECRET)
  let evt: WebhookEvent

  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent
  } catch (err) {
    console.error('Error verifying webhook:', err)
    return new Response('Error occured', { status: 400 })
  }

  const eventType = evt.type

  if (eventType === 'user.created') {
    const { id: clerkUserId, email_addresses, last_name, first_name } = evt.data
    const email = email_addresses[0]?.email_address

    if (!clerkUserId || !email) {
      return new Response('Error: Missing clerk ID or email', { status: 400 })
    }

    try {
      await userRepository.createByClerkId(prisma, {
        clerkUserId,
        email,
        firstName: first_name ?? '',
        lastName: last_name ?? '',
      })
    } catch (error) {
      console.error('Error creating user in database:', error)
      return new Response('Error creating user', { status: 500 })
    }
  }

  if (eventType === 'user.updated') {
    const { id: clerkUserId, email_addresses, last_name, first_name } = evt.data
    const email = email_addresses?.[0]?.email_address

    if (!clerkUserId || !email) {
      return new Response('Error: Missing clerk ID or email', { status: 400 })
    }

    try {
      await userRepository.updateByClerkId(prisma, clerkUserId, {
        email,
        firstName: first_name ?? '',
        lastName: last_name ?? '',
      })
    } catch (error) {
      console.error('Error updating user in database:', error)
      return new Response('Error updating user', { status: 500 })
    }
  }

  if (eventType === 'user.deleted') {
    const { id: clerkUserId } = evt.data

    if (!clerkUserId) {
      return new Response('Error: Missing clerk ID', { status: 400 })
    }

    try {
      await userRepository.deleteByClerkId(prisma, clerkUserId)
    } catch (error) {
      console.error('Error deleting user from database:', error)
      return new Response('Error deleting user', { status: 500 })
    }
  }

  return new Response('', { status: 200 })
}
```

- [ ] **Step 3: Verify and lint**

Run: `npx tsc --noEmit -p tsconfig.json && npm run lint`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/api/user/route.ts app/api/webhooks/clerk/route.ts
git commit -m "refactor: migrate /api/user and clerk webhook to the user data layer"
```

---

### Task 7: Subject data layer — repository + service + tests

**Files:**
- Create: `lib/repositories/subject-repository.ts`
- Create: `lib/services/subject-service.ts`
- Test: `lib/services/subject-service.test.ts`

**Interfaces:**
- Consumes: `Db` (Task 3); `generateUniqueSlug` from `@/lib/helper` (existing); `SUBJECT_COLORS` from `@/lib/schemas/subject` (existing); `NotFoundError` (Task 2).
- Produces (repository):
  - `findManyByUserId(db: Db, userId: string): Promise<Subject[]>`
  - `findById(db: Db, id: string): Promise<Subject | null>`
  - `findLastPositionByUserId(db: Db, userId: string): Promise<{ position: number } | null>`
  - `create(db: Db, data: CreateSubjectInput): Promise<Subject>` where `CreateSubjectInput = { name: string; userId: string; color: string; position: number; slug: string }`
  - `updatePosition(db: Db, id: string, userId: string, position: number)` — **not** `async`; must return the Prisma call directly (see comment in Step 3) so it can be batched by `prisma.$transaction([...])`.
  - `deleteByIdForUser(db: Db, id: string, userId: string): Promise<Subject>`
- Produces (service, consumed by Task 8's routes and re-used by Task 9's/Task 13's `assertOwnedSubject`):
  - `listSubjects(userId: string): Promise<Subject[]>`
  - `createSubject(userId: string, input: { name: string; color?: string }): Promise<Subject>`
  - `reorderSubjects(userId: string, updates: Array<{ id: string; position: number }>): Promise<void>`
  - `deleteSubject(userId: string, subjectId: string): Promise<void>`
  - `assertOwnedSubject(userId: string, subjectId: string): Promise<Subject>` — throws `NotFoundError('Subject not found or unauthorized')` if the subject doesn't exist or belongs to another user.

- [ ] **Step 1: Write the failing tests**

```ts
// lib/services/subject-service.test.ts
import { describe, expect, it, vi, beforeEach } from 'vitest'
import prisma from '@/lib/prisma'
import * as subjectRepository from '@/lib/repositories/subject-repository'
import * as helper from '@/lib/helper'
import { NotFoundError } from '@/lib/errors'
import {
  createSubject,
  reorderSubjects,
  deleteSubject,
  assertOwnedSubject,
} from './subject-service'
import type { Subject } from '@/app/generated/prisma/client'

vi.mock('@/lib/prisma', () => ({
  default: { $transaction: vi.fn((ops) => Promise.all(ops)) },
}))
vi.mock('@/lib/repositories/subject-repository')
vi.mock('@/lib/helper')

// Builds a fake of T from a partial shape without using `any` — every test
// file in this plan that needs a fake Prisma-shaped object uses this same
// helper, redefined locally per file.
function fake<T>(partial: Partial<T>): T {
  return partial as T
}

describe('assertOwnedSubject', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('throws NotFoundError when the subject belongs to another user', async () => {
    vi.mocked(subjectRepository.findById).mockResolvedValue(
      fake<Subject>({ id: 'subj_1', userId: 'someone_else' })
    )

    await expect(assertOwnedSubject('user_1', 'subj_1')).rejects.toThrow(NotFoundError)
  })

  it('throws NotFoundError when the subject does not exist', async () => {
    vi.mocked(subjectRepository.findById).mockResolvedValue(null)

    await expect(assertOwnedSubject('user_1', 'subj_1')).rejects.toThrow(NotFoundError)
  })

  it('returns the subject when it belongs to the user', async () => {
    const fakeSubject = fake<Subject>({ id: 'subj_1', userId: 'user_1' })
    vi.mocked(subjectRepository.findById).mockResolvedValue(fakeSubject)

    await expect(assertOwnedSubject('user_1', 'subj_1')).resolves.toBe(fakeSubject)
  })
})

describe('createSubject', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('positions the new subject after the current last one and generates a slug', async () => {
    vi.mocked(subjectRepository.findLastPositionByUserId).mockResolvedValue({ position: 2 })
    vi.mocked(helper.generateUniqueSlug).mockResolvedValue('algebra')
    const fakeSubject = fake<Subject>({ id: 'subj_1' })
    vi.mocked(subjectRepository.create).mockResolvedValue(fakeSubject)

    const result = await createSubject('user_1', { name: 'Algebra', color: '#EF4444' })

    expect(subjectRepository.create).toHaveBeenCalledWith(prisma, {
      name: 'Algebra',
      userId: 'user_1',
      color: '#EF4444',
      position: 3,
      slug: 'algebra',
    })
    expect(result).toBe(fakeSubject)
  })

  it('defaults new subjects to position 0 when the user has none yet', async () => {
    vi.mocked(subjectRepository.findLastPositionByUserId).mockResolvedValue(null)
    vi.mocked(helper.generateUniqueSlug).mockResolvedValue('biology')
    vi.mocked(subjectRepository.create).mockResolvedValue(fake<Subject>({ id: 'subj_2' }))

    await createSubject('user_1', { name: 'Biology', color: '#10B981' })

    expect(subjectRepository.create).toHaveBeenCalledWith(
      prisma,
      expect.objectContaining({ position: 0 })
    )
  })
})

describe('reorderSubjects', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('updates every subject position scoped to the owning user inside one transaction', async () => {
    vi.mocked(subjectRepository.updatePosition).mockResolvedValue(fake<{ count: number }>({ count: 1 }))

    await reorderSubjects('user_1', [
      { id: 'subj_1', position: 0 },
      { id: 'subj_2', position: 1 },
    ])

    expect(subjectRepository.updatePosition).toHaveBeenCalledWith(prisma, 'subj_1', 'user_1', 0)
    expect(subjectRepository.updatePosition).toHaveBeenCalledWith(prisma, 'subj_2', 'user_1', 1)
    expect(prisma.$transaction).toHaveBeenCalled()
  })
})

describe('deleteSubject', () => {
  it('deletes scoped to the owning user', async () => {
    vi.mocked(subjectRepository.deleteByIdForUser).mockResolvedValue(fake<Subject>({ id: 'subj_1' }))

    await deleteSubject('user_1', 'subj_1')

    expect(subjectRepository.deleteByIdForUser).toHaveBeenCalledWith(prisma, 'subj_1', 'user_1')
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm run test:unit -- lib/services/subject-service.test.ts`
Expected: FAIL — `Cannot find module './subject-service'`

- [ ] **Step 3: Write `lib/repositories/subject-repository.ts`**

```ts
// lib/repositories/subject-repository.ts
import type { Subject } from '@/app/generated/prisma/client'
import type { Db } from '@/lib/db'

export function findManyByUserId(db: Db, userId: string): Promise<Subject[]> {
  return db.subject.findMany({
    where: { userId },
    orderBy: { position: 'asc' },
  })
}

export function findById(db: Db, id: string): Promise<Subject | null> {
  return db.subject.findUnique({ where: { id } })
}

export function findLastPositionByUserId(db: Db, userId: string) {
  return db.subject.findFirst({
    where: { userId },
    orderBy: { position: 'desc' },
    select: { position: true },
  })
}

export interface CreateSubjectInput {
  name: string
  userId: string
  color: string
  position: number
  slug: string
}

export function create(db: Db, data: CreateSubjectInput): Promise<Subject> {
  return db.subject.create({ data })
}

// Not async — must return the Prisma call's lazy PrismaPromise directly
// (no await) so callers can batch it inside prisma.$transaction([...]).
// Wrapping this in an async function would execute it immediately and
// break the atomicity of a batched reorder.
export function updatePosition(db: Db, id: string, userId: string, position: number) {
  return db.subject.updateMany({
    where: { id, userId },
    data: { position },
  })
}

export function deleteByIdForUser(db: Db, id: string, userId: string): Promise<Subject> {
  return db.subject.delete({ where: { id, userId } })
}
```

- [ ] **Step 4: Write `lib/services/subject-service.ts`**

```ts
// lib/services/subject-service.ts
import prisma from '@/lib/prisma'
import * as subjectRepository from '@/lib/repositories/subject-repository'
import { generateUniqueSlug } from '@/lib/helper'
import { SUBJECT_COLORS } from '@/lib/schemas/subject'
import { NotFoundError } from '@/lib/errors'
import type { Subject } from '@/app/generated/prisma/client'

export async function assertOwnedSubject(userId: string, subjectId: string): Promise<Subject> {
  const subject = await subjectRepository.findById(prisma, subjectId)
  if (!subject || subject.userId !== userId) {
    throw new NotFoundError('Subject not found or unauthorized')
  }
  return subject
}

export function listSubjects(userId: string): Promise<Subject[]> {
  return subjectRepository.findManyByUserId(prisma, userId)
}

export interface CreateSubjectInput {
  name: string
  color?: string
}

export async function createSubject(userId: string, input: CreateSubjectInput): Promise<Subject> {
  const color = input.color || SUBJECT_COLORS[Math.floor(Math.random() * SUBJECT_COLORS.length)]

  const lastSubject = await subjectRepository.findLastPositionByUserId(prisma, userId)
  const slug = await generateUniqueSlug(input.name)
  const newPosition = lastSubject ? lastSubject.position + 1 : 0

  return subjectRepository.create(prisma, {
    name: input.name,
    userId,
    color,
    position: newPosition,
    slug,
  })
}

export interface ReorderUpdate {
  id: string
  position: number
}

export async function reorderSubjects(userId: string, updates: ReorderUpdate[]): Promise<void> {
  await prisma.$transaction(
    updates.map((update) => subjectRepository.updatePosition(prisma, update.id, userId, update.position))
  )
}

export async function deleteSubject(userId: string, subjectId: string): Promise<void> {
  await subjectRepository.deleteByIdForUser(prisma, subjectId, userId)
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npm run test:unit -- lib/services/subject-service.test.ts`
Expected: PASS (7 tests)

- [ ] **Step 6: Commit**

```bash
git add lib/repositories/subject-repository.ts lib/services/subject-service.ts lib/services/subject-service.test.ts
git commit -m "feat: add subject repository and service layer"
```

---

### Task 8: Migrate subject routes

**Files:**
- Modify: `app/api/subjects/route.ts`
- Modify: `app/api/subjects/[id]/route.ts`
- Modify: `app/api/subjects/reorder/route.ts`

**Interfaces:**
- Consumes: `listSubjects`, `createSubject`, `reorderSubjects`, `deleteSubject` (Task 7 service).

- [ ] **Step 1: Rewrite `app/api/subjects/route.ts`**

```ts
import { withAuth, AuthContext } from '@/lib/with-auth-guard'
import { NextRequest, NextResponse } from 'next/server'
import { CreateSubjectSchemaApi } from '@/lib/schemas/subject'
import { DEFAULT_MUTATION_RATE_LIMIT } from '@/lib/rate-limit'
import { listSubjects, createSubject } from '@/lib/services/subject-service'

export const GET = withAuth(async (req: NextRequest, { user }: AuthContext) => {
  const subjects = await listSubjects(user.id)
  return NextResponse.json({ subjects })
})

export const POST = withAuth(
  async (req: NextRequest, { user }: AuthContext) => {
    const body = await req.json()
    const parsed = CreateSubjectSchemaApi.parse(body)
    const subject = await createSubject(user.id, parsed)
    return NextResponse.json({ subject })
  },
  { rateLimit: DEFAULT_MUTATION_RATE_LIMIT }
)
```

- [ ] **Step 2: Rewrite `app/api/subjects/[id]/route.ts`**

```ts
import { withAuth, AuthContext } from '@/lib/with-auth-guard'
import { NextRequest, NextResponse } from 'next/server'
import { DEFAULT_MUTATION_RATE_LIMIT } from '@/lib/rate-limit'
import { deleteSubject } from '@/lib/services/subject-service'

export const DELETE = withAuth(
  async (req: NextRequest, { user, params }: AuthContext) => {
    const id = params?.id
    if (!id) {
      return NextResponse.json({ error: 'Subject ID is required' }, { status: 400 })
    }

    await deleteSubject(user.id, id)
    return NextResponse.json({ success: true })
  },
  { rateLimit: DEFAULT_MUTATION_RATE_LIMIT }
)
```

- [ ] **Step 3: Rewrite `app/api/subjects/reorder/route.ts`**

```ts
import { withAuth, AuthContext } from '@/lib/with-auth-guard'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { DEFAULT_MUTATION_RATE_LIMIT } from '@/lib/rate-limit'
import { reorderSubjects } from '@/lib/services/subject-service'

const ReorderSchemaApi = z.object({
  updates: z.array(
    z.object({
      id: z.string(),
      position: z.number(),
    })
  ),
})

export const PATCH = withAuth(
  async (req: NextRequest, { user }: AuthContext) => {
    const body = await req.json()
    const { updates } = ReorderSchemaApi.parse(body)
    await reorderSubjects(user.id, updates)
    return NextResponse.json({ success: true })
  },
  { rateLimit: DEFAULT_MUTATION_RATE_LIMIT }
)
```

- [ ] **Step 4: Verify and lint**

Run: `npx tsc --noEmit -p tsconfig.json && npm run lint`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add app/api/subjects
git commit -m "refactor: migrate subject routes to the service/repository layers"
```

---

### Task 9: Topic data layer — repository + service + tests

**Files:**
- Create: `lib/repositories/topic-repository.ts`
- Create: `lib/services/topic-service.ts`
- Test: `lib/services/topic-service.test.ts`

**Interfaces:**
- Consumes: `Db` (Task 3); `TopicStatus` from `@/lib/topic-status` (existing); `assertOwnedSubject(userId: string, subjectId: string): Promise<Subject>` from `@/lib/services/subject-service` (Task 7) — throws `NotFoundError` if not owned.
- Produces (repository):
  - `findManyBySubjectId(db: Db, subjectId: string)` — returns topics with `_count: { sessions: number }` included.
  - `findById(db: Db, id: string): Promise<Topic | null>`
  - `findByIdWithSubject(db: Db, id: string)` — returns the topic with `subject: { userId: string, ... }` included.
  - `findLastPositionBySubjectId(db: Db, subjectId: string)`
  - `create(db: Db, data: CreateTopicInput): Promise<Topic>` where `CreateTopicInput = { name: string; subjectId: string; position: number }`
  - `update(db: Db, id: string, data: UpdateTopicInput): Promise<Topic>` where `UpdateTopicInput = { name?: string; position?: number; lastRating?: number | null; status?: TopicStatus; statusUpdatedAt?: Date; doneAt?: Date | null }`
  - `deleteById(db: Db, id: string): Promise<Topic>`
  - `incrementSessionStats(db: Db, topicId: string, input: { duration: number; rating: number; now: Date }): Promise<Topic>` — used by Task 11's session service.
- Produces (service):
  - `listTopicsForSubject(userId: string, subjectId: string): Promise<{ subject: Subject; topics: TopicWithCount[] }>`
  - `createTopic(userId: string, subjectId: string, input: { name: string }): Promise<Topic>`
  - `updateTopic(userId: string, subjectId: string, topicId: string, input: { name?: string; position?: number; lastRating?: number | null; status?: TopicStatus }): Promise<Topic>`
  - `deleteTopic(userId: string, subjectId: string, topicId: string): Promise<void>`

- [ ] **Step 1: Write the failing tests**

```ts
// lib/services/topic-service.test.ts
import { describe, expect, it, vi, beforeEach } from 'vitest'
import prisma from '@/lib/prisma'
import * as topicRepository from '@/lib/repositories/topic-repository'
import * as subjectRepository from '@/lib/repositories/subject-repository'
import { NotFoundError } from '@/lib/errors'
import { createTopic, updateTopic, deleteTopic } from './topic-service'
import type { Topic, Subject } from '@/app/generated/prisma/client'

vi.mock('@/lib/prisma', () => ({ default: {} }))
vi.mock('@/lib/repositories/topic-repository')
vi.mock('@/lib/repositories/subject-repository')

// Builds a fake of T from a partial shape without using `any` — every test
// file in this plan that needs a fake Prisma-shaped object uses this same
// helper, redefined locally per file.
function fake<T>(partial: Partial<T>): T {
  return partial as T
}

type TopicWithSubject = NonNullable<
  Awaited<ReturnType<typeof topicRepository.findByIdWithSubject>>
>

describe('createTopic', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('throws NotFoundError when the subject does not belong to the user', async () => {
    vi.mocked(subjectRepository.findById).mockResolvedValue(
      fake<Subject>({ id: 'subj_1', userId: 'someone_else' })
    )

    await expect(createTopic('user_1', 'subj_1', { name: 'Chapter 1' })).rejects.toThrow(
      NotFoundError
    )
  })

  it('positions the new topic after the current last one', async () => {
    vi.mocked(subjectRepository.findById).mockResolvedValue(
      fake<Subject>({ id: 'subj_1', userId: 'user_1' })
    )
    vi.mocked(topicRepository.findLastPositionBySubjectId).mockResolvedValue({ position: 4 })
    const fakeTopic = fake<Topic>({ id: 'topic_1' })
    vi.mocked(topicRepository.create).mockResolvedValue(fakeTopic)

    const result = await createTopic('user_1', 'subj_1', { name: 'Chapter 2' })

    expect(topicRepository.create).toHaveBeenCalledWith(prisma, {
      name: 'Chapter 2',
      subjectId: 'subj_1',
      position: 5,
    })
    expect(result).toBe(fakeTopic)
  })
})

describe('updateTopic', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('throws NotFoundError when the topic belongs to a different subject', async () => {
    vi.mocked(topicRepository.findByIdWithSubject).mockResolvedValue(
      fake<TopicWithSubject>({
        id: 'topic_1',
        subjectId: 'subj_other',
        subject: fake<Subject>({ userId: 'user_1' }),
      })
    )

    await expect(
      updateTopic('user_1', 'subj_1', 'topic_1', { name: 'Renamed' })
    ).rejects.toThrow(NotFoundError)
  })

  it('stamps statusUpdatedAt and doneAt when status moves to DONE', async () => {
    vi.mocked(topicRepository.findByIdWithSubject).mockResolvedValue(
      fake<TopicWithSubject>({
        id: 'topic_1',
        subjectId: 'subj_1',
        subject: fake<Subject>({ userId: 'user_1' }),
      })
    )
    vi.mocked(topicRepository.update).mockResolvedValue(fake<Topic>({ id: 'topic_1' }))

    await updateTopic('user_1', 'subj_1', 'topic_1', { status: 'DONE' })

    expect(topicRepository.update).toHaveBeenCalledWith(
      prisma,
      'topic_1',
      expect.objectContaining({ status: 'DONE', doneAt: expect.any(Date) })
    )
  })

  it('clears doneAt when status moves to a non-DONE state', async () => {
    vi.mocked(topicRepository.findByIdWithSubject).mockResolvedValue(
      fake<TopicWithSubject>({
        id: 'topic_1',
        subjectId: 'subj_1',
        subject: fake<Subject>({ userId: 'user_1' }),
      })
    )
    vi.mocked(topicRepository.update).mockResolvedValue(fake<Topic>({ id: 'topic_1' }))

    await updateTopic('user_1', 'subj_1', 'topic_1', { status: 'IN_PROGRESS' })

    expect(topicRepository.update).toHaveBeenCalledWith(
      prisma,
      'topic_1',
      expect.objectContaining({ status: 'IN_PROGRESS', doneAt: null })
    )
  })
})

describe('deleteTopic', () => {
  it('deletes after confirming ownership', async () => {
    vi.mocked(topicRepository.findByIdWithSubject).mockResolvedValue(
      fake<TopicWithSubject>({
        id: 'topic_1',
        subjectId: 'subj_1',
        subject: fake<Subject>({ userId: 'user_1' }),
      })
    )
    vi.mocked(topicRepository.deleteById).mockResolvedValue(fake<Topic>({ id: 'topic_1' }))

    await deleteTopic('user_1', 'subj_1', 'topic_1')

    expect(topicRepository.deleteById).toHaveBeenCalledWith(prisma, 'topic_1')
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm run test:unit -- lib/services/topic-service.test.ts`
Expected: FAIL — `Cannot find module './topic-service'`

- [ ] **Step 3: Write `lib/repositories/topic-repository.ts`**

```ts
// lib/repositories/topic-repository.ts
import type { Topic } from '@/app/generated/prisma/client'
import type { Db } from '@/lib/db'
import type { TopicStatus } from '@/lib/topic-status'

export function findManyBySubjectId(db: Db, subjectId: string) {
  return db.topic.findMany({
    where: { subjectId },
    orderBy: { position: 'asc' },
    include: {
      _count: { select: { sessions: true } },
    },
  })
}

export function findById(db: Db, id: string): Promise<Topic | null> {
  return db.topic.findUnique({ where: { id } })
}

export function findByIdWithSubject(db: Db, id: string) {
  return db.topic.findUnique({
    where: { id },
    include: { subject: true },
  })
}

export function findLastPositionBySubjectId(db: Db, subjectId: string) {
  return db.topic.findFirst({
    where: { subjectId },
    orderBy: { position: 'desc' },
    select: { position: true },
  })
}

export interface CreateTopicInput {
  name: string
  subjectId: string
  position: number
}

export function create(db: Db, data: CreateTopicInput): Promise<Topic> {
  return db.topic.create({ data })
}

export interface UpdateTopicInput {
  name?: string
  position?: number
  lastRating?: number | null
  status?: TopicStatus
  statusUpdatedAt?: Date
  doneAt?: Date | null
}

export function update(db: Db, id: string, data: UpdateTopicInput): Promise<Topic> {
  return db.topic.update({ where: { id }, data })
}

export function deleteById(db: Db, id: string): Promise<Topic> {
  return db.topic.delete({ where: { id } })
}

export interface IncrementSessionStatsInput {
  duration: number
  rating: number
  now: Date
}

export function incrementSessionStats(
  db: Db,
  topicId: string,
  input: IncrementSessionStatsInput
): Promise<Topic> {
  return db.topic.update({
    where: { id: topicId },
    data: {
      sessionCount: { increment: 1 },
      totalTime: { increment: input.duration },
      lastRating: input.rating,
      status: 'IN_PROGRESS',
      statusUpdatedAt: input.now,
      doneAt: null,
    },
  })
}
```

- [ ] **Step 4: Write `lib/services/topic-service.ts`**

```ts
// lib/services/topic-service.ts
import prisma from '@/lib/prisma'
import * as topicRepository from '@/lib/repositories/topic-repository'
import { assertOwnedSubject } from '@/lib/services/subject-service'
import { NotFoundError } from '@/lib/errors'
import type { TopicStatus } from '@/lib/topic-status'

async function assertOwnedTopic(userId: string, subjectId: string, topicId: string) {
  const topic = await topicRepository.findByIdWithSubject(prisma, topicId)
  if (!topic || topic.subjectId !== subjectId || topic.subject.userId !== userId) {
    throw new NotFoundError('Topic not found or unauthorized')
  }
  return topic
}

export async function listTopicsForSubject(userId: string, subjectId: string) {
  const subject = await assertOwnedSubject(userId, subjectId)
  const topics = await topicRepository.findManyBySubjectId(prisma, subjectId)
  return { subject, topics }
}

export interface CreateTopicInput {
  name: string
}

export async function createTopic(userId: string, subjectId: string, input: CreateTopicInput) {
  await assertOwnedSubject(userId, subjectId)

  const lastTopic = await topicRepository.findLastPositionBySubjectId(prisma, subjectId)
  const newPosition = lastTopic ? lastTopic.position + 1 : 0

  return topicRepository.create(prisma, {
    name: input.name,
    subjectId,
    position: newPosition,
  })
}

export interface UpdateTopicInput {
  name?: string
  position?: number
  lastRating?: number | null
  status?: TopicStatus
}

export async function updateTopic(
  userId: string,
  subjectId: string,
  topicId: string,
  input: UpdateTopicInput
) {
  await assertOwnedTopic(userId, subjectId, topicId)

  const statusUpdate =
    input.status === undefined
      ? {}
      : {
          status: input.status,
          statusUpdatedAt: new Date(),
          doneAt: input.status === 'DONE' ? new Date() : null,
        }

  return topicRepository.update(prisma, topicId, {
    ...input,
    ...statusUpdate,
  })
}

export async function deleteTopic(userId: string, subjectId: string, topicId: string) {
  await assertOwnedTopic(userId, subjectId, topicId)
  await topicRepository.deleteById(prisma, topicId)
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npm run test:unit -- lib/services/topic-service.test.ts`
Expected: PASS (6 tests)

- [ ] **Step 6: Commit**

```bash
git add lib/repositories/topic-repository.ts lib/services/topic-service.ts lib/services/topic-service.test.ts
git commit -m "feat: add topic repository and service layer"
```

---

### Task 10: Migrate topic routes

**Files:**
- Modify: `app/api/subjects/[id]/topics/route.ts`
- Modify: `app/api/subjects/[id]/topics/[topicId]/route.ts`

**Interfaces:**
- Consumes: `listTopicsForSubject`, `createTopic`, `updateTopic`, `deleteTopic` (Task 9 service).

- [ ] **Step 1: Rewrite `app/api/subjects/[id]/topics/route.ts`**

The original response shape wraps the subject with its topics AND returns `topics` at the top level (`{ subject: {...subject, topics}, topics }`); the original per-topic `.map()` that rebuilt `_count`/`totalTime` was a no-op (it only re-read fields already on the object), so this drops it and uses the repository's topics directly:

```ts
import { withAuth, AuthContext } from '@/lib/with-auth-guard'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { DEFAULT_MUTATION_RATE_LIMIT } from '@/lib/rate-limit'
import { listTopicsForSubject, createTopic } from '@/lib/services/topic-service'

const CreateTopicSchema = z.object({
  name: z.string().min(1),
})

export const GET = withAuth(
  async (req: NextRequest, { user, params }: AuthContext) => {
    const subjectId = params?.id
    if (!subjectId) {
      return NextResponse.json({ error: 'Subject ID is required' }, { status: 400 })
    }

    const { subject, topics } = await listTopicsForSubject(user.id, subjectId)
    return NextResponse.json({
      subject: { ...subject, topics },
      topics,
    })
  }
)

export const POST = withAuth(
  async (req: NextRequest, { user, params }: AuthContext) => {
    const subjectId = params?.id
    if (!subjectId) {
      return NextResponse.json({ error: 'Subject ID is required' }, { status: 400 })
    }

    const body = await req.json()
    const parsed = CreateTopicSchema.parse(body)
    const topic = await createTopic(user.id, subjectId, parsed)
    return NextResponse.json({ topic })
  },
  { rateLimit: DEFAULT_MUTATION_RATE_LIMIT }
)
```

- [ ] **Step 2: Rewrite `app/api/subjects/[id]/topics/[topicId]/route.ts`**

```ts
import { withAuth, AuthContext } from '@/lib/with-auth-guard'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { TOPIC_STATUSES } from '@/lib/topic-status'
import { DEFAULT_MUTATION_RATE_LIMIT } from '@/lib/rate-limit'
import { updateTopic, deleteTopic } from '@/lib/services/topic-service'

const UpdateTopicSchema = z.object({
  name: z.string().min(1).optional(),
  position: z.number().int().nonnegative().optional(),
  lastRating: z.number().int().min(1).max(3).nullable().optional(),
  status: z.enum(TOPIC_STATUSES).optional(),
})

export const PATCH = withAuth(
  async (req: NextRequest, { user, params }: AuthContext) => {
    const subjectId = params?.id
    const topicId = params?.topicId
    if (!subjectId || !topicId) {
      return NextResponse.json({ error: 'Topic not found or unauthorized' }, { status: 404 })
    }

    const body = await req.json()
    const parsed = UpdateTopicSchema.parse(body)
    const topic = await updateTopic(user.id, subjectId, topicId, parsed)
    return NextResponse.json({ topic })
  },
  { rateLimit: DEFAULT_MUTATION_RATE_LIMIT }
)

export const DELETE = withAuth(
  async (req: NextRequest, { user, params }: AuthContext) => {
    const subjectId = params?.id
    const topicId = params?.topicId
    if (!subjectId || !topicId) {
      return NextResponse.json({ error: 'Topic not found or unauthorized' }, { status: 404 })
    }

    await deleteTopic(user.id, subjectId, topicId)
    return NextResponse.json({ success: true })
  },
  { rateLimit: DEFAULT_MUTATION_RATE_LIMIT }
)
```

- [ ] **Step 3: Verify and lint**

Run: `npx tsc --noEmit -p tsconfig.json && npm run lint`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/api/subjects
git commit -m "refactor: migrate topic routes to the service/repository layers"
```

---

### Task 11: Session data layer — repository + service + tests

**Files:**
- Create: `lib/repositories/session-repository.ts`
- Create: `lib/services/session-service.ts`
- Test: `lib/services/session-service.test.ts`

**Interfaces:**
- Consumes: `topicRepository.findByIdWithSubject` (Task 9), `topicRepository.incrementSessionStats` (Task 9), `userRepository.lockForUpdate`/`updateProgression` (Task 4), `getLevelFromXp`/`getNextStreak`/`MODE_XP` from `@/lib/progression` (existing, unchanged), `NotFoundError` (Task 2).
- Produces:
  - `create(db: Db, data: CreateSessionInput): Promise<Session>` (repository) where `CreateSessionInput = { userId: string; topicId: string; mode: 'blitz' | 'focus' | 'deep'; duration: number; xpEarned: number; rating: number }`
  - `resolveTimezone(candidate: string | null, fallback: string): string` (service, exported for the unit test)
  - `recordSession(userId: string, input: { topicId: string; mode: 'blitz' | 'focus' | 'deep'; duration: number; rating: number }, timezoneHeader: string | null): Promise<{ session: Session; xpAwarded: number; newTotalXP: number; previousLevel: number; newLevel: number; nextStreak: number }>` (service) — consumed by Task 12's route.

- [ ] **Step 1: Write the failing tests**

```ts
// lib/services/session-service.test.ts
import { describe, expect, it, vi, beforeEach } from 'vitest'
import prisma from '@/lib/prisma'
import * as sessionRepository from '@/lib/repositories/session-repository'
import * as topicRepository from '@/lib/repositories/topic-repository'
import * as userRepository from '@/lib/repositories/user-repository'
import { NotFoundError } from '@/lib/errors'
import { recordSession, resolveTimezone } from './session-service'
import type { Db } from '@/lib/db'
import type { Topic, Subject, Session } from '@/app/generated/prisma/client'

vi.mock('@/lib/prisma', () => ({
  default: { $transaction: vi.fn() },
}))
vi.mock('@/lib/repositories/session-repository')
vi.mock('@/lib/repositories/topic-repository')
vi.mock('@/lib/repositories/user-repository')

// Builds a fake of T from a partial shape without using `any` — every test
// file in this plan that needs a fake Prisma-shaped object uses this same
// helper, redefined locally per file.
function fake<T>(partial: Partial<T>): T {
  return partial as T
}

type TopicWithSubject = NonNullable<
  Awaited<ReturnType<typeof topicRepository.findByIdWithSubject>>
>

const FAKE_TX = fake<Db>({})

// Typed stand-in for prisma.$transaction's interactive-callback overload, so
// mockImplementation below never needs an `any`-typed parameter.
function runWithFakeTx<T>(fn: (tx: Db) => Promise<T>): Promise<T> {
  return fn(FAKE_TX)
}

describe('resolveTimezone', () => {
  it('returns the candidate when it is a valid IANA timezone', () => {
    expect(resolveTimezone('America/New_York', 'UTC')).toBe('America/New_York')
  })

  it('falls back when the candidate is not a valid timezone', () => {
    expect(resolveTimezone('Not/A/Zone', 'UTC')).toBe('UTC')
  })

  it('falls back when there is no candidate', () => {
    expect(resolveTimezone(null, 'America/Chicago')).toBe('America/Chicago')
  })
})

describe('recordSession', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(prisma.$transaction).mockImplementation(runWithFakeTx as typeof prisma.$transaction)
  })

  it('throws NotFoundError when the topic does not belong to the user', async () => {
    vi.mocked(topicRepository.findByIdWithSubject).mockResolvedValue(
      fake<TopicWithSubject>({
        id: 'topic_1',
        subject: fake<Subject>({ userId: 'someone_else' }),
      })
    )

    await expect(
      recordSession('user_1', { topicId: 'topic_1', mode: 'focus', duration: 1500, rating: 2 }, null)
    ).rejects.toThrow(NotFoundError)

    expect(prisma.$transaction).not.toHaveBeenCalled()
  })

  it('awards MODE_XP for the mode and computes the new level/streak from the locked row', async () => {
    vi.mocked(topicRepository.findByIdWithSubject).mockResolvedValue(
      fake<TopicWithSubject>({
        id: 'topic_1',
        subject: fake<Subject>({ userId: 'user_1' }),
      })
    )
    vi.mocked(userRepository.lockForUpdate).mockResolvedValue({
      totalXP: 90,
      streak: 2,
      lastStudiedAt: null,
      timezone: 'UTC',
    })
    vi.mocked(sessionRepository.create).mockResolvedValue(fake<Session>({ id: 'session_1' }))
    vi.mocked(topicRepository.incrementSessionStats).mockResolvedValue(fake<Topic>({ id: 'topic_1' }))
    vi.mocked(userRepository.updateProgression).mockResolvedValue(fake<Awaited<ReturnType<typeof userRepository.updateProgression>>>({ id: 'user_1' }))

    const result = await recordSession(
      'user_1',
      { topicId: 'topic_1', mode: 'focus', duration: 1500, rating: 3 },
      null
    )

    expect(result.xpAwarded).toBe(25)
    expect(result.newTotalXP).toBe(115)
    expect(result.previousLevel).toBe(1)
    expect(result.newLevel).toBe(2)
    expect(result.nextStreak).toBe(1)

    expect(sessionRepository.create).toHaveBeenCalledWith(FAKE_TX, {
      userId: 'user_1',
      topicId: 'topic_1',
      mode: 'focus',
      duration: 1500,
      xpEarned: 25,
      rating: 3,
    })
    expect(topicRepository.incrementSessionStats).toHaveBeenCalledWith(
      FAKE_TX,
      'topic_1',
      expect.objectContaining({ duration: 1500, rating: 3 })
    )
    expect(userRepository.updateProgression).toHaveBeenCalledWith(
      FAKE_TX,
      'user_1',
      expect.objectContaining({ totalXP: 115, streak: 1 })
    )
  })

  it('throws when the locked user row is missing', async () => {
    vi.mocked(topicRepository.findByIdWithSubject).mockResolvedValue(
      fake<TopicWithSubject>({
        id: 'topic_1',
        subject: fake<Subject>({ userId: 'user_1' }),
      })
    )
    vi.mocked(userRepository.lockForUpdate).mockResolvedValue(null)

    await expect(
      recordSession('user_1', { topicId: 'topic_1', mode: 'blitz', duration: 600, rating: 1 }, null)
    ).rejects.toThrow('User not found')
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm run test:unit -- lib/services/session-service.test.ts`
Expected: FAIL — `Cannot find module './session-service'`

- [ ] **Step 3: Write `lib/repositories/session-repository.ts`**

```ts
// lib/repositories/session-repository.ts
import type { Session } from '@/app/generated/prisma/client'
import type { Db } from '@/lib/db'

export interface CreateSessionInput {
  userId: string
  topicId: string
  mode: 'blitz' | 'focus' | 'deep'
  duration: number
  xpEarned: number
  rating: number
}

export function create(db: Db, data: CreateSessionInput): Promise<Session> {
  return db.session.create({ data })
}
```

- [ ] **Step 4: Write `lib/services/session-service.ts`**

```ts
// lib/services/session-service.ts
import prisma from '@/lib/prisma'
import * as sessionRepository from '@/lib/repositories/session-repository'
import * as topicRepository from '@/lib/repositories/topic-repository'
import * as userRepository from '@/lib/repositories/user-repository'
import { getLevelFromXp, getNextStreak, MODE_XP } from '@/lib/progression'
import { NotFoundError } from '@/lib/errors'

export function resolveTimezone(candidate: string | null, fallback: string) {
  if (!candidate) return fallback
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: candidate }).format(new Date())
    return candidate
  } catch {
    return fallback
  }
}

export interface RecordSessionInput {
  topicId: string
  mode: 'blitz' | 'focus' | 'deep'
  duration: number
  rating: number
}

export async function recordSession(
  userId: string,
  input: RecordSessionInput,
  timezoneHeader: string | null
) {
  const now = new Date()
  const xpAwarded = MODE_XP[input.mode]

  const topic = await topicRepository.findByIdWithSubject(prisma, input.topicId)
  if (!topic || topic.subject.userId !== userId) {
    throw new NotFoundError('Topic not found or unauthorized')
  }

  return prisma.$transaction(async (tx) => {
    // Lock the user row for the duration of the transaction so concurrent
    // session submissions (multiple tabs/devices) can't both read the same
    // starting totalXP/streak and clobber each other's write.
    const lockedUser = await userRepository.lockForUpdate(tx, userId)
    if (!lockedUser) {
      throw new Error('User not found')
    }

    const timezone = resolveTimezone(timezoneHeader, lockedUser.timezone || 'UTC')
    const previousLevel = getLevelFromXp(lockedUser.totalXP)
    const newTotalXP = lockedUser.totalXP + xpAwarded
    const newLevel = getLevelFromXp(newTotalXP)
    const nextStreak = getNextStreak({
      currentStreak: lockedUser.streak,
      lastStudiedAt: lockedUser.lastStudiedAt,
      timezone,
      now,
    })

    const session = await sessionRepository.create(tx, {
      userId,
      topicId: input.topicId,
      mode: input.mode,
      duration: input.duration,
      xpEarned: xpAwarded,
      rating: input.rating,
    })

    await topicRepository.incrementSessionStats(tx, input.topicId, {
      duration: input.duration,
      rating: input.rating,
      now,
    })

    await userRepository.updateProgression(tx, userId, {
      totalXP: newTotalXP,
      streak: nextStreak,
      lastStudiedAt: now,
      ...(timezone !== lockedUser.timezone ? { timezone } : {}),
    })

    return { session, xpAwarded, newTotalXP, previousLevel, newLevel, nextStreak }
  })
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npm run test:unit -- lib/services/session-service.test.ts`
Expected: PASS (6 tests)

- [ ] **Step 6: Commit**

```bash
git add lib/repositories/session-repository.ts lib/services/session-service.ts lib/services/session-service.test.ts
git commit -m "feat: add session repository and service layer"
```

---

### Task 12: Migrate the session route

**Files:**
- Modify: `app/api/sessions/route.ts`

**Interfaces:**
- Consumes: `recordSession` (Task 11 service).

- [ ] **Step 1: Rewrite `app/api/sessions/route.ts`**

```ts
import { withAuth, AuthContext } from '@/lib/with-auth-guard'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { SESSION_CREATE_RATE_LIMIT } from '@/lib/rate-limit'
import { recordSession } from '@/lib/services/session-service'

const CreateSessionSchema = z.object({
  topicId: z.string().min(1),
  mode: z.enum(['blitz', 'focus', 'deep']),
  duration: z.number().int().positive(),
  rating: z.number().int().min(1).max(3),
})

export const POST = withAuth(
  async (req: NextRequest, { user }: AuthContext) => {
    const body = await req.json()
    const parsed = CreateSessionSchema.parse(body)

    const result = await recordSession(user.id, parsed, req.headers.get('x-timezone'))

    return NextResponse.json(
      {
        session: result.session,
        progression: {
          xpAwarded: result.xpAwarded,
          totalXP: result.newTotalXP,
          previousLevel: result.previousLevel,
          newLevel: result.newLevel,
          leveledUp: result.newLevel > result.previousLevel,
          streak: result.nextStreak,
        },
      },
      { status: 201 }
    )
  },
  { rateLimit: SESSION_CREATE_RATE_LIMIT }
)
```

- [ ] **Step 2: Verify and lint**

Run: `npx tsc --noEmit -p tsconfig.json && npm run lint`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/api/sessions/route.ts
git commit -m "refactor: migrate the session route to the service/repository layers"
```

---

### Task 13: Flashcard-deck data layer — repository + service + tests

**Files:**
- Create: `lib/repositories/flashcard-deck-repository.ts`
- Create: `lib/services/flashcard-deck-service.ts`
- Test: `lib/services/flashcard-deck-service.test.ts`

**Interfaces:**
- Consumes: `assertOwnedSubject` from `@/lib/services/subject-service` (Task 7).
- Produces (repository):
  - `findManyBySubjectId(db: Db, subjectId: string): Promise<FlashcardDeck[]>`
  - `findById(db: Db, id: string): Promise<FlashcardDeck | null>`
  - `findByIdWithSubject(db: Db, id: string)` — deck with `subject: { userId, ... }` included.
  - `create(db: Db, data: { name: string; subjectId: string }): Promise<FlashcardDeck>`
  - `update(db: Db, id: string, name: string): Promise<FlashcardDeck>`
  - `deleteById(db: Db, id: string): Promise<FlashcardDeck>`
- Produces (service, consumed by Task 14's routes and Task 15's flashcard service):
  - `assertOwnedDeck(userId: string, subjectId: string, deckId: string): Promise<FlashcardDeck>` — throws `NotFoundError('Deck not found')` if the deck doesn't exist or doesn't belong to that subject/user.
  - `listDecksForSubject(userId: string, subjectId: string): Promise<FlashcardDeck[]>`
  - `createDeck(userId: string, subjectId: string, name: string): Promise<FlashcardDeck>`
  - `updateDeck(userId: string, subjectId: string, deckId: string, name: string): Promise<FlashcardDeck>`
  - `deleteDeck(userId: string, subjectId: string, deckId: string): Promise<void>`

- [ ] **Step 1: Write the failing tests**

```ts
// lib/services/flashcard-deck-service.test.ts
import { describe, expect, it, vi, beforeEach } from 'vitest'
import prisma from '@/lib/prisma'
import * as flashcardDeckRepository from '@/lib/repositories/flashcard-deck-repository'
import * as subjectRepository from '@/lib/repositories/subject-repository'
import { NotFoundError } from '@/lib/errors'
import { createDeck, updateDeck, deleteDeck } from './flashcard-deck-service'
import type { Subject, FlashcardDeck } from '@/app/generated/prisma/client'

vi.mock('@/lib/prisma', () => ({ default: {} }))
vi.mock('@/lib/repositories/flashcard-deck-repository')
vi.mock('@/lib/repositories/subject-repository')

// Builds a fake of T from a partial shape without using `any` — every test
// file in this plan that needs a fake Prisma-shaped object uses this same
// helper, redefined locally per file.
function fake<T>(partial: Partial<T>): T {
  return partial as T
}

describe('createDeck', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('throws NotFoundError when the subject does not belong to the user', async () => {
    vi.mocked(subjectRepository.findById).mockResolvedValue(
      fake<Subject>({ id: 'subj_1', userId: 'someone_else' })
    )

    await expect(createDeck('user_1', 'subj_1', 'Deck A')).rejects.toThrow(NotFoundError)
  })

  it('creates the deck under the subject once ownership is confirmed', async () => {
    vi.mocked(subjectRepository.findById).mockResolvedValue(
      fake<Subject>({ id: 'subj_1', userId: 'user_1' })
    )
    const fakeDeck = fake<FlashcardDeck>({ id: 'deck_1' })
    vi.mocked(flashcardDeckRepository.create).mockResolvedValue(fakeDeck)

    const result = await createDeck('user_1', 'subj_1', 'Deck A')

    expect(flashcardDeckRepository.create).toHaveBeenCalledWith(prisma, {
      name: 'Deck A',
      subjectId: 'subj_1',
    })
    expect(result).toBe(fakeDeck)
  })
})

describe('updateDeck', () => {
  it('throws NotFoundError when the deck belongs to a different subject', async () => {
    vi.mocked(subjectRepository.findById).mockResolvedValue(
      fake<Subject>({ id: 'subj_1', userId: 'user_1' })
    )
    vi.mocked(flashcardDeckRepository.findById).mockResolvedValue(
      fake<FlashcardDeck>({ id: 'deck_1', subjectId: 'subj_other' })
    )

    await expect(updateDeck('user_1', 'subj_1', 'deck_1', 'Renamed')).rejects.toThrow(NotFoundError)
  })
})

describe('deleteDeck', () => {
  it('deletes after confirming ownership', async () => {
    vi.mocked(subjectRepository.findById).mockResolvedValue(
      fake<Subject>({ id: 'subj_1', userId: 'user_1' })
    )
    vi.mocked(flashcardDeckRepository.findById).mockResolvedValue(
      fake<FlashcardDeck>({ id: 'deck_1', subjectId: 'subj_1' })
    )
    vi.mocked(flashcardDeckRepository.deleteById).mockResolvedValue(fake<FlashcardDeck>({ id: 'deck_1' }))

    await deleteDeck('user_1', 'subj_1', 'deck_1')

    expect(flashcardDeckRepository.deleteById).toHaveBeenCalledWith(prisma, 'deck_1')
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm run test:unit -- lib/services/flashcard-deck-service.test.ts`
Expected: FAIL — `Cannot find module './flashcard-deck-service'`

- [ ] **Step 3: Write `lib/repositories/flashcard-deck-repository.ts`**

```ts
// lib/repositories/flashcard-deck-repository.ts
import type { FlashcardDeck } from '@/app/generated/prisma/client'
import type { Db } from '@/lib/db'

export function findManyBySubjectId(db: Db, subjectId: string): Promise<FlashcardDeck[]> {
  return db.flashcardDeck.findMany({
    where: { subjectId },
    orderBy: { createdAt: 'desc' },
  })
}

export function findById(db: Db, id: string): Promise<FlashcardDeck | null> {
  return db.flashcardDeck.findUnique({ where: { id } })
}

export function findByIdWithSubject(db: Db, id: string) {
  return db.flashcardDeck.findUnique({
    where: { id },
    include: { subject: true },
  })
}

export interface CreateDeckInput {
  name: string
  subjectId: string
}

export function create(db: Db, data: CreateDeckInput): Promise<FlashcardDeck> {
  return db.flashcardDeck.create({ data })
}

export function update(db: Db, id: string, name: string): Promise<FlashcardDeck> {
  return db.flashcardDeck.update({ where: { id }, data: { name } })
}

export function deleteById(db: Db, id: string): Promise<FlashcardDeck> {
  return db.flashcardDeck.delete({ where: { id } })
}
```

- [ ] **Step 4: Write `lib/services/flashcard-deck-service.ts`**

```ts
// lib/services/flashcard-deck-service.ts
import prisma from '@/lib/prisma'
import * as flashcardDeckRepository from '@/lib/repositories/flashcard-deck-repository'
import { assertOwnedSubject } from '@/lib/services/subject-service'
import { NotFoundError } from '@/lib/errors'
import type { FlashcardDeck } from '@/app/generated/prisma/client'

export async function assertOwnedDeck(
  userId: string,
  subjectId: string,
  deckId: string
): Promise<FlashcardDeck> {
  await assertOwnedSubject(userId, subjectId)
  const deck = await flashcardDeckRepository.findById(prisma, deckId)
  if (!deck || deck.subjectId !== subjectId) {
    throw new NotFoundError('Deck not found')
  }
  return deck
}

export async function listDecksForSubject(userId: string, subjectId: string) {
  await assertOwnedSubject(userId, subjectId)
  return flashcardDeckRepository.findManyBySubjectId(prisma, subjectId)
}

export async function createDeck(userId: string, subjectId: string, name: string) {
  await assertOwnedSubject(userId, subjectId)
  return flashcardDeckRepository.create(prisma, { name, subjectId })
}

export async function updateDeck(userId: string, subjectId: string, deckId: string, name: string) {
  await assertOwnedDeck(userId, subjectId, deckId)
  return flashcardDeckRepository.update(prisma, deckId, name)
}

export async function deleteDeck(userId: string, subjectId: string, deckId: string) {
  await assertOwnedDeck(userId, subjectId, deckId)
  await flashcardDeckRepository.deleteById(prisma, deckId)
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npm run test:unit -- lib/services/flashcard-deck-service.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 6: Commit**

```bash
git add lib/repositories/flashcard-deck-repository.ts lib/services/flashcard-deck-service.ts lib/services/flashcard-deck-service.test.ts
git commit -m "feat: add flashcard-deck repository and service layer"
```

---

### Task 14: Migrate flashcard-deck routes

**Files:**
- Modify: `app/api/subjects/[id]/decks/route.ts`
- Modify: `app/api/subjects/[id]/decks/[deckId]/route.ts`

**Interfaces:**
- Consumes: `listDecksForSubject`, `createDeck`, `updateDeck`, `deleteDeck` (Task 13 service).

- [ ] **Step 1: Rewrite `app/api/subjects/[id]/decks/route.ts`**

```ts
import { withAuth, AuthContext } from '@/lib/with-auth-guard'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { DEFAULT_MUTATION_RATE_LIMIT } from '@/lib/rate-limit'
import { listDecksForSubject, createDeck } from '@/lib/services/flashcard-deck-service'

const CreateDeckSchema = z.object({
  name: z.string().min(1),
})

export const GET = withAuth(
  async (_req: NextRequest, { user, params }: AuthContext) => {
    const subjectId = params?.id
    if (!subjectId) {
      return NextResponse.json({ error: 'Subject ID is required' }, { status: 400 })
    }

    const decks = await listDecksForSubject(user.id, subjectId)
    return NextResponse.json({ decks })
  }
)

export const POST = withAuth(
  async (req: NextRequest, { user, params }: AuthContext) => {
    const subjectId = params?.id
    if (!subjectId) {
      return NextResponse.json({ error: 'Subject ID is required' }, { status: 400 })
    }

    const body = await req.json()
    const parsed = CreateDeckSchema.parse(body)
    const deck = await createDeck(user.id, subjectId, parsed.name)
    return NextResponse.json({ deck })
  },
  { rateLimit: DEFAULT_MUTATION_RATE_LIMIT }
)
```

- [ ] **Step 2: Rewrite `app/api/subjects/[id]/decks/[deckId]/route.ts`**

```ts
import { withAuth, AuthContext } from '@/lib/with-auth-guard'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { DEFAULT_MUTATION_RATE_LIMIT } from '@/lib/rate-limit'
import { updateDeck, deleteDeck } from '@/lib/services/flashcard-deck-service'

const UpdateDeckSchema = z.object({
  name: z.string().min(1),
})

export const PATCH = withAuth(
  async (req: NextRequest, { user, params }: AuthContext) => {
    const subjectId = params?.id
    const deckId = params?.deckId
    if (!subjectId || !deckId) {
      return NextResponse.json({ error: 'Subject ID and Deck ID are required' }, { status: 400 })
    }

    const body = await req.json()
    const parsed = UpdateDeckSchema.parse(body)
    const deck = await updateDeck(user.id, subjectId, deckId, parsed.name)
    return NextResponse.json({ deck })
  },
  { rateLimit: DEFAULT_MUTATION_RATE_LIMIT }
)

export const DELETE = withAuth(
  async (_req: NextRequest, { user, params }: AuthContext) => {
    const subjectId = params?.id
    const deckId = params?.deckId
    if (!subjectId || !deckId) {
      return NextResponse.json({ error: 'Subject ID and Deck ID are required' }, { status: 400 })
    }

    await deleteDeck(user.id, subjectId, deckId)
    return new NextResponse(null, { status: 204 })
  },
  { rateLimit: DEFAULT_MUTATION_RATE_LIMIT }
)
```

- [ ] **Step 3: Verify and lint**

Run: `npx tsc --noEmit -p tsconfig.json && npm run lint`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/api/subjects
git commit -m "refactor: migrate flashcard-deck routes to the service/repository layers"
```

---

### Task 15: Flashcard data layer — repository + service + tests

**Files:**
- Create: `lib/repositories/flashcard-repository.ts`
- Create: `lib/services/flashcard-service.ts`
- Test: `lib/services/flashcard-service.test.ts`

**Interfaces:**
- Consumes: `flashcardDeckRepository.findByIdWithSubject` (Task 13 repository) — used for this domain's own deck-ownership check, since these routes only receive a `deckId` (no `subjectId`), unlike Task 13's `assertOwnedDeck` which requires both.
- Produces (repository):
  - `findManyByDeckId(db: Db, deckId: string): Promise<Flashcard[]>`
  - `findById(db: Db, id: string): Promise<Flashcard | null>`
  - `findByIdWithDeckSubject(db: Db, id: string)` — card with `deck: { subject: { userId, ... }, ... }` included.
  - `create(db: Db, data: CreateFlashcardInput): Promise<Flashcard>` where `CreateFlashcardInput = { deckId: string; question: string; answer: string; hint: string | null; choices: string[] }`
  - `update(db: Db, id: string, data: UpdateFlashcardInput): Promise<Flashcard>` where `UpdateFlashcardInput = { question?: string; answer?: string; hint?: string | null; choices?: string[]; status?: string; lastReviewedAt?: Date | null }`
  - `deleteById(db: Db, id: string): Promise<Flashcard>`
- Produces (service, consumed by Task 16's routes):
  - `listCardsForDeck(userId: string, deckId: string): Promise<Flashcard[]>`
  - `createCard(userId: string, deckId: string, input: { question: string; answer: string; hint?: string | null; choices?: string[] }): Promise<Flashcard>`
  - `updateCard(userId: string, deckId: string, cardId: string, input: { question?: string; answer?: string; hint?: string | null; choices?: string[]; status?: string; lastReviewedAt?: string | null }): Promise<Flashcard>`
  - `deleteCard(userId: string, deckId: string, cardId: string): Promise<void>`

- [ ] **Step 1: Write the failing tests**

```ts
// lib/services/flashcard-service.test.ts
import { describe, expect, it, vi, beforeEach } from 'vitest'
import prisma from '@/lib/prisma'
import * as flashcardRepository from '@/lib/repositories/flashcard-repository'
import * as flashcardDeckRepository from '@/lib/repositories/flashcard-deck-repository'
import { NotFoundError } from '@/lib/errors'
import { createCard, updateCard } from './flashcard-service'
import type { Flashcard, Subject } from '@/app/generated/prisma/client'

vi.mock('@/lib/prisma', () => ({ default: {} }))
vi.mock('@/lib/repositories/flashcard-repository')
vi.mock('@/lib/repositories/flashcard-deck-repository')

// Builds a fake of T from a partial shape without using `any` — every test
// file in this plan that needs a fake Prisma-shaped object uses this same
// helper, redefined locally per file.
function fake<T>(partial: Partial<T>): T {
  return partial as T
}

type DeckWithSubject = NonNullable<
  Awaited<ReturnType<typeof flashcardDeckRepository.findByIdWithSubject>>
>
type CardWithDeckSubject = NonNullable<
  Awaited<ReturnType<typeof flashcardRepository.findByIdWithDeckSubject>>
>

describe('createCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('throws NotFoundError when the deck does not belong to the user', async () => {
    vi.mocked(flashcardDeckRepository.findByIdWithSubject).mockResolvedValue(
      fake<DeckWithSubject>({
        id: 'deck_1',
        subject: fake<Subject>({ userId: 'someone_else' }),
      })
    )

    await expect(
      createCard('user_1', 'deck_1', { question: 'Q', answer: 'A' })
    ).rejects.toThrow(NotFoundError)
  })

  it('de-duplicates choices, trims whitespace, adds the answer if missing, and caps at 6', async () => {
    vi.mocked(flashcardDeckRepository.findByIdWithSubject).mockResolvedValue(
      fake<DeckWithSubject>({
        id: 'deck_1',
        subject: fake<Subject>({ userId: 'user_1' }),
      })
    )
    vi.mocked(flashcardRepository.create).mockResolvedValue(fake<Flashcard>({ id: 'card_1' }))

    await createCard('user_1', 'deck_1', {
      question: 'Q',
      answer: 'Correct',
      choices: [' Correct ', 'Correct', 'B', 'C', 'D', 'E', 'F', 'G'],
    })

    expect(flashcardRepository.create).toHaveBeenCalledWith(prisma, {
      deckId: 'deck_1',
      question: 'Q',
      answer: 'Correct',
      hint: null,
      choices: ['Correct', 'B', 'C', 'D', 'E', 'F'],
    })
  })

  it('appends the answer when it is missing from the provided choices', async () => {
    vi.mocked(flashcardDeckRepository.findByIdWithSubject).mockResolvedValue(
      fake<DeckWithSubject>({
        id: 'deck_1',
        subject: fake<Subject>({ userId: 'user_1' }),
      })
    )
    vi.mocked(flashcardRepository.create).mockResolvedValue(fake<Flashcard>({ id: 'card_1' }))

    await createCard('user_1', 'deck_1', {
      question: 'Q',
      answer: 'Correct',
      choices: ['B', 'C'],
    })

    expect(flashcardRepository.create).toHaveBeenCalledWith(
      prisma,
      expect.objectContaining({ choices: ['B', 'C', 'Correct'] })
    )
  })
})

describe('updateCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('throws NotFoundError when the card does not belong to the given deck', async () => {
    vi.mocked(flashcardRepository.findByIdWithDeckSubject).mockResolvedValue(
      fake<CardWithDeckSubject>({
        id: 'card_1',
        deckId: 'deck_other',
        deck: fake<CardWithDeckSubject['deck']>({
          subject: fake<Subject>({ userId: 'user_1' }),
        }),
      })
    )

    await expect(
      updateCard('user_1', 'deck_1', 'card_1', { question: 'New question' })
    ).rejects.toThrow(NotFoundError)
  })

  it('leaves choices untouched when the update does not include them', async () => {
    vi.mocked(flashcardRepository.findByIdWithDeckSubject).mockResolvedValue(
      fake<CardWithDeckSubject>({
        id: 'card_1',
        deckId: 'deck_1',
        deck: fake<CardWithDeckSubject['deck']>({
          subject: fake<Subject>({ userId: 'user_1' }),
        }),
      })
    )
    vi.mocked(flashcardRepository.update).mockResolvedValue(fake<Flashcard>({ id: 'card_1' }))

    await updateCard('user_1', 'deck_1', 'card_1', { question: 'New question' })

    expect(flashcardRepository.update).toHaveBeenCalledWith(prisma, 'card_1', {
      question: 'New question',
    })
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm run test:unit -- lib/services/flashcard-service.test.ts`
Expected: FAIL — `Cannot find module './flashcard-service'`

- [ ] **Step 3: Write `lib/repositories/flashcard-repository.ts`**

```ts
// lib/repositories/flashcard-repository.ts
import type { Flashcard } from '@/app/generated/prisma/client'
import type { Db } from '@/lib/db'

export function findManyByDeckId(db: Db, deckId: string): Promise<Flashcard[]> {
  return db.flashcard.findMany({
    where: { deckId },
    orderBy: { createdAt: 'desc' },
  })
}

export function findById(db: Db, id: string): Promise<Flashcard | null> {
  return db.flashcard.findUnique({ where: { id } })
}

export function findByIdWithDeckSubject(db: Db, id: string) {
  return db.flashcard.findUnique({
    where: { id },
    include: { deck: { include: { subject: true } } },
  })
}

export interface CreateFlashcardInput {
  deckId: string
  question: string
  answer: string
  hint: string | null
  choices: string[]
}

export function create(db: Db, data: CreateFlashcardInput): Promise<Flashcard> {
  return db.flashcard.create({ data })
}

export interface UpdateFlashcardInput {
  question?: string
  answer?: string
  hint?: string | null
  choices?: string[]
  status?: string
  lastReviewedAt?: Date | null
}

export function update(db: Db, id: string, data: UpdateFlashcardInput): Promise<Flashcard> {
  return db.flashcard.update({ where: { id }, data })
}

export function deleteById(db: Db, id: string): Promise<Flashcard> {
  return db.flashcard.delete({ where: { id } })
}
```

- [ ] **Step 4: Write `lib/services/flashcard-service.ts`**

```ts
// lib/services/flashcard-service.ts
import prisma from '@/lib/prisma'
import * as flashcardRepository from '@/lib/repositories/flashcard-repository'
import * as flashcardDeckRepository from '@/lib/repositories/flashcard-deck-repository'
import { NotFoundError } from '@/lib/errors'

function normalizeChoices(choices: string[] | undefined, answer: string | undefined) {
  if (choices === undefined) return undefined
  const trimmed = choices.map((choice) => choice.trim()).filter(Boolean)
  const unique = Array.from(new Set(trimmed))
  const withAnswer = answer && !unique.includes(answer) ? [...unique, answer] : unique
  return withAnswer.slice(0, 6)
}

async function assertOwnedDeck(userId: string, deckId: string) {
  const deck = await flashcardDeckRepository.findByIdWithSubject(prisma, deckId)
  if (!deck || deck.subject.userId !== userId) {
    throw new NotFoundError('Deck not found or unauthorized')
  }
  return deck
}

async function assertOwnedCard(userId: string, deckId: string, cardId: string) {
  const card = await flashcardRepository.findByIdWithDeckSubject(prisma, cardId)
  if (!card || card.deckId !== deckId || card.deck.subject.userId !== userId) {
    throw new NotFoundError('Flashcard not found or unauthorized')
  }
  return card
}

export async function listCardsForDeck(userId: string, deckId: string) {
  await assertOwnedDeck(userId, deckId)
  return flashcardRepository.findManyByDeckId(prisma, deckId)
}

export interface CreateCardInput {
  question: string
  answer: string
  hint?: string | null
  choices?: string[]
}

export async function createCard(userId: string, deckId: string, input: CreateCardInput) {
  await assertOwnedDeck(userId, deckId)

  const choices = normalizeChoices(input.choices ?? [], input.answer) ?? []

  return flashcardRepository.create(prisma, {
    deckId,
    question: input.question,
    answer: input.answer,
    hint: input.hint ?? null,
    choices,
  })
}

export interface UpdateCardInput {
  question?: string
  answer?: string
  hint?: string | null
  choices?: string[]
  status?: string
  lastReviewedAt?: string | null
}

export async function updateCard(
  userId: string,
  deckId: string,
  cardId: string,
  input: UpdateCardInput
) {
  await assertOwnedCard(userId, deckId, cardId)

  const choices = normalizeChoices(input.choices, input.answer)

  return flashcardRepository.update(prisma, cardId, {
    ...(input.question !== undefined && { question: input.question }),
    ...(input.answer !== undefined && { answer: input.answer }),
    ...(input.hint !== undefined && { hint: input.hint }),
    ...(choices !== undefined && { choices }),
    ...(input.status !== undefined && { status: input.status }),
    ...(input.lastReviewedAt !== undefined && {
      lastReviewedAt: input.lastReviewedAt ? new Date(input.lastReviewedAt) : null,
    }),
  })
}

export async function deleteCard(userId: string, deckId: string, cardId: string) {
  await assertOwnedCard(userId, deckId, cardId)
  await flashcardRepository.deleteById(prisma, cardId)
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npm run test:unit -- lib/services/flashcard-service.test.ts`
Expected: PASS (5 tests)

- [ ] **Step 6: Commit**

```bash
git add lib/repositories/flashcard-repository.ts lib/services/flashcard-service.ts lib/services/flashcard-service.test.ts
git commit -m "feat: add flashcard repository and service layer"
```

---

### Task 16: Migrate flashcard routes and delete the dead duplicate route

**Files:**
- Modify: `app/api/decks/[deckId]/flashcards/route.ts`
- Modify: `app/api/decks/[deckId]/flashcards/[cardId]/route.ts`
- Delete: `app/api/topics/[topicId]/flashcards/route.ts`

**Interfaces:**
- Consumes: `listCardsForDeck`, `createCard`, `updateCard`, `deleteCard` (Task 15 service).

- [ ] **Step 1: Confirm the duplicate route is unreferenced before deleting it**

Run: `grep -rn "topics/.*flashcards\|topicId.*flashcards" lib hooks components app --include=*.ts --include=*.tsx | grep -v "app/api/topics"`
Expected: no output — confirms nothing in the frontend calls this route.

- [ ] **Step 2: Delete the dead route**

```bash
git rm "app/api/topics/[topicId]/flashcards/route.ts"
```

- [ ] **Step 3: Rewrite `app/api/decks/[deckId]/flashcards/route.ts`**

```ts
import { withAuth, AuthContext } from '@/lib/with-auth-guard'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { DEFAULT_MUTATION_RATE_LIMIT } from '@/lib/rate-limit'
import { listCardsForDeck, createCard } from '@/lib/services/flashcard-service'

const CreateFlashcardSchema = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
  hint: z.string().optional().nullable(),
  choices: z.array(z.string().min(1)).optional(),
})

export const GET = withAuth(
  async (_req: NextRequest, { user, params }: AuthContext) => {
    const deckId = params?.deckId
    if (!deckId) {
      return NextResponse.json({ error: 'Deck not found or unauthorized' }, { status: 404 })
    }

    const cards = await listCardsForDeck(user.id, deckId)
    return NextResponse.json({ cards })
  }
)

export const POST = withAuth(
  async (req: NextRequest, { user, params }: AuthContext) => {
    const deckId = params?.deckId
    if (!deckId) {
      return NextResponse.json({ error: 'Deck not found or unauthorized' }, { status: 404 })
    }

    const body = await req.json()
    const parsed = CreateFlashcardSchema.parse(body)
    const card = await createCard(user.id, deckId, parsed)
    return NextResponse.json({ card })
  },
  { rateLimit: DEFAULT_MUTATION_RATE_LIMIT }
)
```

- [ ] **Step 4: Rewrite `app/api/decks/[deckId]/flashcards/[cardId]/route.ts`**

```ts
import { withAuth, AuthContext } from '@/lib/with-auth-guard'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { DEFAULT_MUTATION_RATE_LIMIT } from '@/lib/rate-limit'
import { updateCard, deleteCard } from '@/lib/services/flashcard-service'

const UpdateFlashcardSchema = z.object({
  question: z.string().min(1).optional(),
  answer: z.string().min(1).optional(),
  hint: z.string().optional().nullable(),
  choices: z.array(z.string().min(1)).optional(),
  status: z.string().optional(),
  lastReviewedAt: z.string().datetime().optional().nullable(),
})

export const PATCH = withAuth(
  async (req: NextRequest, { user, params }: AuthContext) => {
    const deckId = params?.deckId
    const cardId = params?.cardId
    if (!deckId || !cardId) {
      return NextResponse.json({ error: 'Flashcard not found or unauthorized' }, { status: 404 })
    }

    const body = await req.json()
    const parsed = UpdateFlashcardSchema.parse(body)
    const card = await updateCard(user.id, deckId, cardId, parsed)
    return NextResponse.json({ card })
  },
  { rateLimit: DEFAULT_MUTATION_RATE_LIMIT }
)

export const DELETE = withAuth(
  async (_req: NextRequest, { user, params }: AuthContext) => {
    const deckId = params?.deckId
    const cardId = params?.cardId
    if (!deckId || !cardId) {
      return NextResponse.json({ error: 'Flashcard not found or unauthorized' }, { status: 404 })
    }

    await deleteCard(user.id, deckId, cardId)
    return NextResponse.json({ success: true })
  },
  { rateLimit: DEFAULT_MUTATION_RATE_LIMIT }
)
```

- [ ] **Step 5: Verify and lint**

Run: `npx tsc --noEmit -p tsconfig.json && npm run lint`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add app/api/decks "app/api/topics/[topicId]/flashcards/route.ts"
git commit -m "refactor: migrate flashcard routes and delete dead duplicate route"
```

---

### Task 17: Leaderboard data layer — repository + service + tests

**Files:**
- Create: `lib/repositories/leaderboard-repository.ts`
- Create: `lib/services/leaderboard-service.ts`
- Test: `lib/services/leaderboard-service.test.ts`

**Interfaces:**
- Consumes: `getLevelFromXp` from `@/lib/progression` (existing, unchanged).
- Produces (repository — this file is the one exception to "one repository per Prisma model," since the leaderboard read is intrinsically a cross-model aggregate; see the design spec):
  - `getTopUsersByXp(db: Db, limit: number): Promise<TopUserRow[]>` — cached 3 min, where `TopUserRow = { id, firstName, lastName, email, totalXP, streak, createdAt }`
  - `getWeeklySnapshotRows(db: Db, weekStart: Date): Promise<WeeklySnapshotRow[]>` — cached 3 min per `weekStart`, where `WeeklySnapshotRow = { userId, rank, sessions, focusMinutes, xpGained, user: { firstName, lastName, email } }`
  - `getWeeklySessionAggregates(db: Db, weekStart: Date, weekEnd: Date): Promise<WeeklySessionAggregateRow[]>` — cached 3 min per `weekStart` (fallback path used only when no snapshot rows exist yet), where `WeeklySessionAggregateRow = { userId, sessions, totalDuration }`
  - `findUsersByIds(db: Db, ids: string[])` — uncached
  - `countUsersAbove(db: Db, totalXP: number, createdAt: Date): Promise<number>` — uncached
- Produces (service, consumed by Task 18's route):
  - `getLeaderboard(currentUser: User): Promise<LeaderboardResponse>` matching today's exact response shape (`{ generatedAt, weekStart, global: { top, me }, weekly: { top, me } }`).
  - `getDisplayName`, `rankWithTies` — exported for the unit test.

- [ ] **Step 1: Write the failing tests**

```ts
// lib/services/leaderboard-service.test.ts
import { describe, expect, it } from 'vitest'
import { getDisplayName, rankWithTies } from './leaderboard-service'

describe('getDisplayName', () => {
  it('joins first and last name when present', () => {
    expect(
      getDisplayName({ firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.com' })
    ).toBe('Ada Lovelace')
  })

  it('falls back to the email local part when no name is set', () => {
    expect(getDisplayName({ firstName: null, lastName: null, email: 'ghost@example.com' })).toBe(
      'ghost'
    )
  })
})

describe('rankWithTies', () => {
  it('gives tied values the same rank and skips ranks for the tie count', () => {
    const rows = [{ v: 100 }, { v: 100 }, { v: 50 }]
    const ranked = rankWithTies(rows, (row) => row.v)
    expect(ranked.map((row) => row.rank)).toEqual([1, 1, 3])
  })

  it('assigns sequential ranks when there are no ties', () => {
    const rows = [{ v: 30 }, { v: 20 }, { v: 10 }]
    const ranked = rankWithTies(rows, (row) => row.v)
    expect(ranked.map((row) => row.rank)).toEqual([1, 2, 3])
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm run test:unit -- lib/services/leaderboard-service.test.ts`
Expected: FAIL — `Cannot find module './leaderboard-service'`

- [ ] **Step 3: Write `lib/repositories/leaderboard-repository.ts`**

```ts
// lib/repositories/leaderboard-repository.ts
import type { Db } from '@/lib/db'

const CACHE_TTL_MS = 1000 * 60 * 3

export interface TopUserRow {
  id: string
  firstName: string | null
  lastName: string | null
  email: string
  totalXP: number
  streak: number
  createdAt: Date
}

let topUsersCache: { cachedAt: number; rows: TopUserRow[] } | null = null

export async function getTopUsersByXp(db: Db, limit: number): Promise<TopUserRow[]> {
  const now = Date.now()
  if (topUsersCache && now - topUsersCache.cachedAt < CACHE_TTL_MS) {
    return topUsersCache.rows
  }

  const rows = await db.user.findMany({
    orderBy: [{ totalXP: 'desc' }, { createdAt: 'asc' }],
    take: limit,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      totalXP: true,
      streak: true,
      createdAt: true,
    },
  })

  topUsersCache = { cachedAt: now, rows }
  return rows
}

export interface WeeklySnapshotRow {
  userId: string
  rank: number
  sessions: number
  focusMinutes: number
  xpGained: number
  user: { firstName: string | null; lastName: string | null; email: string }
}

let weeklySnapshotsCache: { cachedAt: number; weekStartIso: string; rows: WeeklySnapshotRow[] } | null =
  null

export async function getWeeklySnapshotRows(db: Db, weekStart: Date): Promise<WeeklySnapshotRow[]> {
  const now = Date.now()
  const weekStartIso = weekStart.toISOString()

  if (
    weeklySnapshotsCache &&
    now - weeklySnapshotsCache.cachedAt < CACHE_TTL_MS &&
    weeklySnapshotsCache.weekStartIso === weekStartIso
  ) {
    return weeklySnapshotsCache.rows
  }

  const rows = await db.weeklyLeaderboardSnapshot.findMany({
    where: { weekStart },
    orderBy: { rank: 'asc' },
    include: {
      user: {
        select: { firstName: true, lastName: true, email: true },
      },
    },
  })

  weeklySnapshotsCache = { cachedAt: now, weekStartIso, rows }
  return rows
}

export interface WeeklySessionAggregateRow {
  userId: string
  sessions: number
  totalDuration: number
}

let weeklyAggregatesCache: {
  cachedAt: number
  weekStartIso: string
  rows: WeeklySessionAggregateRow[]
} | null = null

export async function getWeeklySessionAggregates(
  db: Db,
  weekStart: Date,
  weekEnd: Date
): Promise<WeeklySessionAggregateRow[]> {
  const now = Date.now()
  const weekStartIso = weekStart.toISOString()

  if (
    weeklyAggregatesCache &&
    now - weeklyAggregatesCache.cachedAt < CACHE_TTL_MS &&
    weeklyAggregatesCache.weekStartIso === weekStartIso
  ) {
    return weeklyAggregatesCache.rows
  }

  const groups = await db.session.groupBy({
    by: ['userId'],
    where: { createdAt: { gte: weekStart, lt: weekEnd } },
    _count: { _all: true },
    _sum: { duration: true },
  })

  const rows = groups.map((row) => ({
    userId: row.userId,
    sessions: row._count._all,
    totalDuration: row._sum.duration ?? 0,
  }))

  weeklyAggregatesCache = { cachedAt: now, weekStartIso, rows }
  return rows
}

export function findUsersByIds(db: Db, ids: string[]) {
  return db.user.findMany({
    where: { id: { in: ids } },
    select: { id: true, firstName: true, lastName: true, email: true },
  })
}

export function countUsersAbove(db: Db, totalXP: number, createdAt: Date): Promise<number> {
  return db.user.count({
    where: {
      OR: [{ totalXP: { gt: totalXP } }, { totalXP, createdAt: { lt: createdAt } }],
    },
  })
}
```

- [ ] **Step 4: Write `lib/services/leaderboard-service.ts`**

```ts
// lib/services/leaderboard-service.ts
import prisma from '@/lib/prisma'
import * as leaderboardRepository from '@/lib/repositories/leaderboard-repository'
import { getLevelFromXp } from '@/lib/progression'
import type { User } from '@/app/generated/prisma/client'

const XP_PER_MINUTE = 1
const TOP_LIMIT = 50

export function getDisplayName(user: {
  firstName: string | null
  lastName: string | null
  email: string
}) {
  const full = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim()
  if (full) return full
  return user.email.split('@')[0]
}

export function rankWithTies<T>(
  rows: T[],
  getSortValue: (row: T) => number
): Array<T & { rank: number }> {
  let previousValue: number | null = null
  let previousRank = 0

  return rows.map((row, index) => {
    const value = getSortValue(row)
    const rank = previousValue === null || value !== previousValue ? index + 1 : previousRank
    previousValue = value
    previousRank = rank
    return { ...row, rank }
  })
}

function getCurrentWeekStartUtc() {
  const now = new Date()
  const day = now.getUTCDay()
  const diffToMonday = day === 0 ? 6 : day - 1
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - diffToMonday, 0, 0, 0, 0)
  )
}

interface WeeklyRankRow {
  rank: number
  sessions: number
  totalSeconds: number
  weeklyXP: number
}

export async function getLeaderboard(currentUser: User) {
  const weekStart = getCurrentWeekStartUtc()
  const weekStartIso = weekStart.toISOString()

  const topUsers = await leaderboardRepository.getTopUsersByXp(prisma, TOP_LIMIT)
  const globalTop = rankWithTies(topUsers, (row) => row.totalXP).map((row) => ({
    rank: row.rank,
    userId: row.id,
    name: getDisplayName(row),
    totalXP: row.totalXP,
    level: getLevelFromXp(row.totalXP),
    streak: row.streak,
  }))

  const weeklySnapshots = await leaderboardRepository.getWeeklySnapshotRows(prisma, weekStart)

  let weeklyTop: Array<{
    rank: number
    userId: string
    name: string
    sessions: number
    focusMinutes: number
    weeklyXP: number
  }> = []
  const weeklyRankByUser: Record<string, WeeklyRankRow> = {}

  if (weeklySnapshots.length > 0) {
    weeklyTop = weeklySnapshots.slice(0, TOP_LIMIT).map((row) => ({
      rank: row.rank,
      userId: row.userId,
      name: getDisplayName(row.user),
      sessions: row.sessions,
      focusMinutes: row.focusMinutes,
      weeklyXP: row.xpGained,
    }))

    for (const row of weeklySnapshots) {
      weeklyRankByUser[row.userId] = {
        rank: row.rank,
        sessions: row.sessions,
        totalSeconds: row.focusMinutes * 60,
        weeklyXP: row.xpGained,
      }
    }
  } else {
    const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000)
    const aggregates = await leaderboardRepository.getWeeklySessionAggregates(prisma, weekStart, weekEnd)

    const userIds = aggregates.map((row) => row.userId)
    const weeklyUsers = await leaderboardRepository.findUsersByIds(prisma, userIds)

    const weeklyRows = aggregates.map((row) => {
      const focusMinutes = Math.floor(row.totalDuration / 60)
      return {
        userId: row.userId,
        sessions: row.sessions,
        focusMinutes,
        weeklyXP: Math.max(0, focusMinutes * XP_PER_MINUTE),
      }
    })

    const ranked = rankWithTies(weeklyRows, (row) => row.weeklyXP)
      .sort((a, b) => b.weeklyXP - a.weeklyXP)
      .map((row, index) => ({ ...row, rank: row.rank ?? index + 1 }))

    weeklyTop = ranked.slice(0, TOP_LIMIT).map((row) => {
      const user = weeklyUsers.find((entry) => entry.id === row.userId)
      return {
        rank: row.rank,
        userId: row.userId,
        name: user ? getDisplayName(user) : 'Unknown',
        sessions: row.sessions,
        focusMinutes: row.focusMinutes,
        weeklyXP: row.weeklyXP,
      }
    })

    for (const row of ranked) {
      weeklyRankByUser[row.userId] = {
        rank: row.rank,
        sessions: row.sessions,
        totalSeconds: row.focusMinutes * 60,
        weeklyXP: row.weeklyXP,
      }
    }
  }

  const usersAboveMe = await leaderboardRepository.countUsersAbove(
    prisma,
    currentUser.totalXP,
    currentUser.createdAt
  )

  const meGlobal = {
    rank: usersAboveMe + 1,
    userId: currentUser.id,
    name: getDisplayName(currentUser),
    totalXP: currentUser.totalXP,
    level: getLevelFromXp(currentUser.totalXP),
    streak: currentUser.streak,
  }

  const meWeeklyRaw = weeklyRankByUser[currentUser.id]
  const meWeekly = meWeeklyRaw
    ? {
        rank: meWeeklyRaw.rank,
        userId: currentUser.id,
        name: getDisplayName(currentUser),
        sessions: meWeeklyRaw.sessions,
        focusMinutes: Math.floor(meWeeklyRaw.totalSeconds / 60),
        weeklyXP: meWeeklyRaw.weeklyXP,
      }
    : {
        rank: null,
        userId: currentUser.id,
        name: getDisplayName(currentUser),
        sessions: 0,
        focusMinutes: 0,
        weeklyXP: 0,
      }

  return {
    generatedAt: new Date().toISOString(),
    weekStart: weekStartIso,
    global: { top: globalTop, me: meGlobal },
    weekly: { top: weeklyTop, me: meWeekly },
  }
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npm run test:unit -- lib/services/leaderboard-service.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 6: Commit**

```bash
git add lib/repositories/leaderboard-repository.ts lib/services/leaderboard-service.ts lib/services/leaderboard-service.test.ts
git commit -m "feat: add leaderboard repository and service layer"
```

---

### Task 18: Migrate the leaderboard route

**Files:**
- Modify: `app/api/leaderboard/route.ts`

**Interfaces:**
- Consumes: `getLeaderboard` (Task 17 service).

- [ ] **Step 1: Rewrite `app/api/leaderboard/route.ts`**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { withAuth, type AuthContext } from '@/lib/with-auth-guard'
import { getLeaderboard } from '@/lib/services/leaderboard-service'

export const GET = withAuth(async (_req: NextRequest, { user }: AuthContext) => {
  const leaderboard = await getLeaderboard(user)
  return NextResponse.json(leaderboard)
})
```

- [ ] **Step 2: Verify and lint**

Run: `npx tsc --noEmit -p tsconfig.json && npm run lint`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/api/leaderboard/route.ts
git commit -m "refactor: migrate the leaderboard route to the service/repository layers"
```

---

### Task 19: Final verification pass

**Files:** none (verification only)

- [ ] **Step 1: Run the full unit test suite**

Run: `npm run test:unit`
Expected: all service tests pass (subject, topic, session, flashcard-deck, flashcard, user, leaderboard, plus `api-errors`).

- [ ] **Step 2: Run the type checker and linter across the whole project**

Run: `npx tsc --noEmit -p tsconfig.json && npm run lint`
Expected: no errors.

- [ ] **Step 3: Run the Playwright e2e suite**

Run: `npm run test:e2e`
Expected: all existing e2e specs pass — this is the behavioral safety net confirming no route's observable behavior changed beyond the two documented, approved differences (dead route removed, ownership failures now `404`).

- [ ] **Step 4: Spot-check a couple of routes manually**

Start the dev server (`npm run dev`) and, signed in as a test user, verify in the browser or via `curl`:
- Creating a subject, reordering subjects, and deleting one still works end-to-end.
- Recording a session still awards XP/streak and the topic's stats update.
- The leaderboard page still renders global/weekly rankings.

- [ ] **Step 5: Final commit if anything was adjusted during verification**

```bash
git add -A
git commit -m "chore: final verification pass for service/repository layering"
```
