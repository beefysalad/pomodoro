# Stats Page Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild `/stats` on the documented design system tokens, move stat computation server-side into a new `/api/stats` endpoint, add a 12-week activity heatmap and 7-day trend deltas, drop the fake achievements/quests sections, and fix the two-column layout imbalance that forced excess scrolling.

**Architecture:** New repository (`stats-repository.ts`) + service (`stats-service.ts`, mostly pure functions) + route (`app/api/stats/route.ts`) on the backend, following the existing repository → service → route layering used by `leaderboard`/`session`. New `lib/api/stats.ts` + `hooks/use-stats.ts` on the frontend, following the existing `subjects` pattern. `app/stats/page.tsx` is rewritten to consume the single `useStats()` hook instead of the current N+1 `useSubjects` + per-subject `useQueries(getTopics)` waterfall.

**Tech Stack:** Next.js 16 App Router, Prisma (`@/app/generated/prisma/client`), TanStack Query, Vitest, Recharts, Tailwind v4 with the tokens in `app/globals.css`.

## Global Constraints

- All new/modified UI must use only tokens defined in `app/globals.css` (`bg-surface`, `bg-surface-up`, `bg-surface-hi`, `border-border`, `border-border-up`, `text-foreground`, `text-text-sub`, `text-muted-foreground`, `text-violet`, `text-violet-mid`, `bg-violet-glow`, `text-streak`, `bg-streak-bg`, `text-success`, `bg-success-bg`, `text-destructive`) or the pre-existing `bg-glass*` tokens — no raw `cyan-*`/`slate-*`/`orange-*` Tailwind colors, no `white/[0.0x]` arbitrary values.
- Font stays Geist Mono (the app's only font) — no new font classes.
- Do not modify `components/ui/card.tsx`, `components/ui/badge.tsx`, or `components/ui/progress.tsx` — out of scope per the design spec's non-goals.
- Do not modify `app/dashboard/page.tsx`, `app/leaderboard/page.tsx`, `app/subjects/**`, or `app/settings/page.tsx`.
- No Prisma schema changes.
- Preserve these existing DOM element `id`s exactly (a tutorial-spotlight feature targets them): `tutorial-stats-level`, `tutorial-stats-streak`, `tutorial-stats-graph`, `tutorial-stats-sessions`.
- Follow the existing repository/service/route/api/hook layering: repository owns query-shape types and raw Prisma calls, service owns business logic (prefer pure, individually-exported functions per the `leaderboard-service.ts`/`rankWithTies` precedent), route is a thin `withAuth` wrapper, `lib/api/*.ts` is an axios wrapper, `hooks/use-*.ts` is a TanStack Query wrapper.
- Test file naming/convention: one `*.test.ts` per service file, using Vitest with `vi.mock('@/lib/repositories/...')` for orchestrator functions, no separate repository tests (matches existing `session-service.test.ts` / absence of `topic-repository.test.ts`).

---

### Task 1: Export the timezone day-key helper from `lib/progression.ts`

**Files:**
- Modify: `lib/progression.ts:31`

**Interfaces:**
- Produces: `export function getDateKeyInTimeZone(date: Date, timezone: string): string` — used by Task 2's `buildHeatmap`.

- [ ] **Step 1: Export the existing function**

In `lib/progression.ts`, change:

```ts
function getDateKeyInTimeZone(date: Date, timezone: string) {
```

to:

```ts
export function getDateKeyInTimeZone(date: Date, timezone: string) {
```

This is the only change — the function body is untouched. `getNextStreak` (which already uses it) keeps working unmodified.

- [ ] **Step 2: Verify existing tests still pass**

Run: `npx vitest run lib/progression.test.ts`
Expected: PASS (if this file doesn't exist, run `npx vitest run` instead and confirm no failures)

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no new errors

- [ ] **Step 4: Commit**

```bash
git add lib/progression.ts
git commit -m "refactor: export getDateKeyInTimeZone for reuse in stats service"
```

---

### Task 2: `lib/repositories/stats-repository.ts`

**Files:**
- Create: `lib/repositories/stats-repository.ts`

**Interfaces:**
- Consumes: `Db` type from `@/lib/db`.
- Produces:
  - `export interface SubjectWithTopics { id: string; name: string; color: string; icon: string | null; topics: Array<{ id: string; name: string; status: string; totalTime: number; sessionCount: number }> }`
  - `export interface SessionSlice { createdAt: Date; duration: number; xpEarned: number }`
  - `export function findSubjectsWithTopics(db: Db, userId: string): Promise<SubjectWithTopics[]>`
  - `export function findRecentSessions(db: Db, userId: string, since: Date): Promise<SessionSlice[]>`
  - Consumed by Task 3 (`stats-service.ts`).

No test file for this task — matches the existing convention that repositories (`topic-repository.ts`, `subject-repository.ts`, `session-repository.ts`) are thin Prisma wrappers with no dedicated unit tests; they're exercised indirectly through service tests (mocked) and through the route in manual verification (Task 9).

- [ ] **Step 1: Write the repository file**

```ts
import type { Db } from '@/lib/db'

export interface SubjectWithTopics {
  id: string
  name: string
  color: string
  icon: string | null
  topics: Array<{
    id: string
    name: string
    status: string
    totalTime: number
    sessionCount: number
  }>
}

export interface SessionSlice {
  createdAt: Date
  duration: number
  xpEarned: number
}

export function findSubjectsWithTopics(db: Db, userId: string): Promise<SubjectWithTopics[]> {
  return db.subject.findMany({
    where: { userId },
    select: {
      id: true,
      name: true,
      color: true,
      icon: true,
      topics: {
        select: {
          id: true,
          name: true,
          status: true,
          totalTime: true,
          sessionCount: true,
        },
      },
    },
  })
}

export function findRecentSessions(db: Db, userId: string, since: Date): Promise<SessionSlice[]> {
  return db.session.findMany({
    where: { userId, createdAt: { gte: since } },
    select: { createdAt: true, duration: true, xpEarned: true },
    orderBy: { createdAt: 'asc' },
  })
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors (confirms the `select` shapes structurally match the declared return interfaces)

- [ ] **Step 3: Commit**

```bash
git add lib/repositories/stats-repository.ts
git commit -m "feat: add stats repository for subject/topic and session queries"
```

---

### Task 3: `lib/services/stats-service.ts` — pure computation functions (TDD)

**Files:**
- Create: `lib/services/stats-service.ts`
- Test: `lib/services/stats-service.test.ts`

**Interfaces:**
- Consumes: `SubjectWithTopics`, `SessionSlice` from `@/lib/repositories/stats-repository` (Task 2); `getDateKeyInTimeZone`, `getLevelProgress` from `@/lib/progression` (Task 1 / existing).
- Produces (all consumed by Task 4's route and Task 8's page/components):
  - `export function computeNextStreakGoal(streak: number): number`
  - `export function computeConsistencyScore(streak: number, totalSessions: number): number`
  - `export function computeCompletionRate(topicCount: number, doneTopics: number): number`
  - `export function computeConcentrationRate(topSubjectSeconds: number, totalSeconds: number): number`
  - `export function summarizeSubjects(subjects: SubjectWithTopics[]): SubjectSummary[]`
  - `export function getTopTopics(subjects: SubjectWithTopics[], limit?: number): Array<{ id: string; name: string; subjectName: string; totalSeconds: number; sessions: number }>`
  - `export function computeTrends(sessions: SessionSlice[], now: Date): { xp: TrendMetric; focusSeconds: TrendMetric; sessions: TrendMetric }`
  - `export function buildHeatmap(sessions: SessionSlice[], timezone: string, now: Date): HeatmapDay[]`
  - `export interface SubjectSummary { id: string; name: string; color: string; icon: string | null; totalSeconds: number; sessionCount: number; topicCount: number; doneTopics: number }`
  - `export interface TrendMetric { value: number; deltaPct: number }`
  - `export interface HeatmapDay { date: string; seconds: number; sessions: number }`

This task covers only the pure functions. `getStats` (the DB-calling orchestrator) is Task 4.

- [ ] **Step 1: Write the failing tests**

Create `lib/services/stats-service.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import {
  buildHeatmap,
  computeCompletionRate,
  computeConcentrationRate,
  computeConsistencyScore,
  computeNextStreakGoal,
  computeTrends,
  getTopTopics,
  summarizeSubjects,
} from './stats-service'
import type { SubjectWithTopics } from '@/lib/repositories/stats-repository'

describe('computeNextStreakGoal', () => {
  it('targets 3 when streak is below 3', () => {
    expect(computeNextStreakGoal(0)).toBe(3)
    expect(computeNextStreakGoal(2)).toBe(3)
  })

  it('targets 7 when streak is between 3 and 6', () => {
    expect(computeNextStreakGoal(3)).toBe(7)
    expect(computeNextStreakGoal(6)).toBe(7)
  })

  it('targets 14 when streak is between 7 and 13', () => {
    expect(computeNextStreakGoal(7)).toBe(14)
    expect(computeNextStreakGoal(13)).toBe(14)
  })

  it('targets streak + 7 once past 14', () => {
    expect(computeNextStreakGoal(14)).toBe(21)
    expect(computeNextStreakGoal(30)).toBe(37)
  })
})

describe('computeConsistencyScore', () => {
  it('returns 0 for no streak and no sessions', () => {
    expect(computeConsistencyScore(0, 0)).toBe(0)
  })

  it('caps at 100', () => {
    expect(computeConsistencyScore(10, 30)).toBe(100)
  })
})

describe('computeCompletionRate', () => {
  it('returns 0 when there are no topics', () => {
    expect(computeCompletionRate(0, 0)).toBe(0)
  })

  it('returns the percentage of done topics', () => {
    expect(computeCompletionRate(4, 1)).toBe(25)
  })
})

describe('computeConcentrationRate', () => {
  it('returns 0 when there is no tracked time', () => {
    expect(computeConcentrationRate(0, 0)).toBe(0)
  })

  it('returns the top subject share of total time', () => {
    expect(computeConcentrationRate(30, 120)).toBe(25)
  })
})

describe('summarizeSubjects', () => {
  it('rolls up topic totals per subject', () => {
    const subjects: SubjectWithTopics[] = [
      {
        id: 'subj_1',
        name: 'Biology',
        color: '#7c3aed',
        icon: null,
        topics: [
          { id: 't1', name: 'Cells', status: 'DONE', totalTime: 600, sessionCount: 2 },
          { id: 't2', name: 'Genetics', status: 'IN_PROGRESS', totalTime: 300, sessionCount: 1 },
        ],
      },
    ]

    expect(summarizeSubjects(subjects)).toEqual([
      {
        id: 'subj_1',
        name: 'Biology',
        color: '#7c3aed',
        icon: null,
        totalSeconds: 900,
        sessionCount: 3,
        topicCount: 2,
        doneTopics: 1,
      },
    ])
  })
})

describe('getTopTopics', () => {
  it('sorts topics across subjects by total time and applies the limit', () => {
    const subjects: SubjectWithTopics[] = [
      {
        id: 'subj_1',
        name: 'Biology',
        color: '#7c3aed',
        icon: null,
        topics: [
          { id: 't1', name: 'Cells', status: 'DONE', totalTime: 300, sessionCount: 1 },
          { id: 't2', name: 'Genetics', status: 'DONE', totalTime: 900, sessionCount: 3 },
        ],
      },
      {
        id: 'subj_2',
        name: 'Chemistry',
        color: '#06b6d4',
        icon: null,
        topics: [{ id: 't3', name: 'Bonds', status: 'DONE', totalTime: 600, sessionCount: 2 }],
      },
    ]

    expect(getTopTopics(subjects, 2)).toEqual([
      { id: 't2', name: 'Genetics', subjectName: 'Biology', totalSeconds: 900, sessions: 3 },
      { id: 't3', name: 'Bonds', subjectName: 'Chemistry', totalSeconds: 600, sessions: 2 },
    ])
  })
})

describe('computeTrends', () => {
  const now = new Date('2026-07-12T12:00:00.000Z')

  it('splits sessions into the last 7 days vs the 7 days before that', () => {
    const sessions = [
      { createdAt: new Date('2026-07-10T12:00:00.000Z'), duration: 600, xpEarned: 25 },
      { createdAt: new Date('2026-07-02T12:00:00.000Z'), duration: 300, xpEarned: 10 },
      { createdAt: new Date('2026-06-12T12:00:00.000Z'), duration: 1200, xpEarned: 50 },
    ]

    const trends = computeTrends(sessions, now)

    expect(trends.xp).toEqual({ value: 25, deltaPct: 150 })
    expect(trends.focusSeconds).toEqual({ value: 600, deltaPct: 100 })
    expect(trends.sessions).toEqual({ value: 1, deltaPct: 0 })
  })

  it('reports a 100% increase when the previous window had no sessions', () => {
    const sessions = [{ createdAt: new Date('2026-07-10T12:00:00.000Z'), duration: 600, xpEarned: 25 }]
    expect(computeTrends(sessions, now).xp.deltaPct).toBe(100)
  })

  it('reports 0% when both windows are empty', () => {
    expect(computeTrends([], now).xp).toEqual({ value: 0, deltaPct: 0 })
  })
})

describe('buildHeatmap', () => {
  it('buckets sessions by local day and fills empty days with zero, spanning 84 days', () => {
    const now = new Date('2026-07-12T12:00:00.000Z')
    const sessions = [
      { createdAt: new Date('2026-07-12T09:00:00.000Z'), duration: 600, xpEarned: 25 },
      { createdAt: new Date('2026-07-12T15:00:00.000Z'), duration: 300, xpEarned: 10 },
      { createdAt: new Date('2026-07-11T09:00:00.000Z'), duration: 900, xpEarned: 25 },
    ]

    const heatmap = buildHeatmap(sessions, 'UTC', now)

    expect(heatmap).toHaveLength(84)
    expect(heatmap[heatmap.length - 1]).toEqual({ date: '2026-07-12', seconds: 900, sessions: 2 })
    expect(heatmap[heatmap.length - 2]).toEqual({ date: '2026-07-11', seconds: 900, sessions: 1 })
    expect(heatmap[0]).toEqual({ date: '2026-04-20', seconds: 0, sessions: 0 })
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run lib/services/stats-service.test.ts`
Expected: FAIL with "Cannot find module './stats-service'" (the file doesn't exist yet)

- [ ] **Step 3: Write the implementation**

Create `lib/services/stats-service.ts`:

```ts
import { getDateKeyInTimeZone } from '@/lib/progression'
import type { SessionSlice, SubjectWithTopics } from '@/lib/repositories/stats-repository'

const HEATMAP_WEEKS = 12
const HEATMAP_DAYS = HEATMAP_WEEKS * 7
const TREND_WINDOW_DAYS = 7
const DAY_MS = 24 * 60 * 60 * 1000

export interface SubjectSummary {
  id: string
  name: string
  color: string
  icon: string | null
  totalSeconds: number
  sessionCount: number
  topicCount: number
  doneTopics: number
}

export interface TrendMetric {
  value: number
  deltaPct: number
}

export interface HeatmapDay {
  date: string
  seconds: number
  sessions: number
}

export function computeNextStreakGoal(streak: number): number {
  if (streak < 3) return 3
  if (streak < 7) return 7
  if (streak < 14) return 14
  return streak + 7
}

export function computeConsistencyScore(streak: number, totalSessions: number): number {
  return Math.min(100, Math.round(streak * 6 + Math.min(totalSessions, 20) * 3))
}

export function computeCompletionRate(topicCount: number, doneTopics: number): number {
  return topicCount ? (doneTopics / topicCount) * 100 : 0
}

export function computeConcentrationRate(topSubjectSeconds: number, totalSeconds: number): number {
  return totalSeconds ? (topSubjectSeconds / totalSeconds) * 100 : 0
}

export function summarizeSubjects(subjects: SubjectWithTopics[]): SubjectSummary[] {
  return subjects.map((subject) => {
    const totalSeconds = subject.topics.reduce((sum, topic) => sum + topic.totalTime, 0)
    const sessionCount = subject.topics.reduce((sum, topic) => sum + topic.sessionCount, 0)
    const doneTopics = subject.topics.filter((topic) => topic.status === 'DONE').length

    return {
      id: subject.id,
      name: subject.name,
      color: subject.color,
      icon: subject.icon,
      totalSeconds,
      sessionCount,
      topicCount: subject.topics.length,
      doneTopics,
    }
  })
}

export function getTopTopics(subjects: SubjectWithTopics[], limit = 6) {
  return subjects
    .flatMap((subject) =>
      subject.topics.map((topic) => ({
        id: topic.id,
        name: topic.name,
        subjectName: subject.name,
        totalSeconds: topic.totalTime,
        sessions: topic.sessionCount,
      }))
    )
    .sort((a, b) => b.totalSeconds - a.totalSeconds)
    .slice(0, limit)
}

function deltaPct(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return Math.round(((current - previous) / previous) * 100)
}

export function computeTrends(
  sessions: SessionSlice[],
  now: Date
): { xp: TrendMetric; focusSeconds: TrendMetric; sessions: TrendMetric } {
  const currentStart = now.getTime() - TREND_WINDOW_DAYS * DAY_MS
  const previousStart = now.getTime() - 2 * TREND_WINDOW_DAYS * DAY_MS

  const current = sessions.filter((session) => session.createdAt.getTime() >= currentStart)
  const previous = sessions.filter(
    (session) =>
      session.createdAt.getTime() >= previousStart && session.createdAt.getTime() < currentStart
  )

  const sum = (rows: SessionSlice[], key: 'xpEarned' | 'duration') =>
    rows.reduce((total, row) => total + row[key], 0)

  const currentXp = sum(current, 'xpEarned')
  const previousXp = sum(previous, 'xpEarned')
  const currentFocus = sum(current, 'duration')
  const previousFocus = sum(previous, 'duration')

  return {
    xp: { value: currentXp, deltaPct: deltaPct(currentXp, previousXp) },
    focusSeconds: { value: currentFocus, deltaPct: deltaPct(currentFocus, previousFocus) },
    sessions: { value: current.length, deltaPct: deltaPct(current.length, previous.length) },
  }
}

export function buildHeatmap(sessions: SessionSlice[], timezone: string, now: Date): HeatmapDay[] {
  const buckets = new Map<string, { seconds: number; sessions: number }>()

  for (let i = HEATMAP_DAYS - 1; i >= 0; i--) {
    const date = new Date(now.getTime() - i * DAY_MS)
    buckets.set(getDateKeyInTimeZone(date, timezone), { seconds: 0, sessions: 0 })
  }

  for (const session of sessions) {
    const key = getDateKeyInTimeZone(session.createdAt, timezone)
    const bucket = buckets.get(key)
    if (!bucket) continue
    bucket.seconds += session.duration
    bucket.sessions += 1
  }

  return Array.from(buckets.entries()).map(([date, bucket]) => ({ date, ...bucket }))
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run lib/services/stats-service.test.ts`
Expected: PASS (all describe blocks green)

- [ ] **Step 5: Commit**

```bash
git add lib/services/stats-service.ts lib/services/stats-service.test.ts
git commit -m "feat: add pure stats computation functions"
```

---

### Task 4: `getStats` orchestrator (TDD)

**Files:**
- Modify: `lib/services/stats-service.ts` (append)
- Modify: `lib/services/stats-service.test.ts` (append)

**Interfaces:**
- Consumes: `statsRepository.findSubjectsWithTopics`, `statsRepository.findRecentSessions` (Task 2); `getLevelProgress` from `@/lib/progression`; all pure functions from Task 3; `User` type from `@/app/generated/prisma/client`.
- Produces: `export interface StatsResponse {...}` and `export async function getStats(user: User): Promise<StatsResponse>` — consumed by Task 5's route.

- [ ] **Step 1: Write the failing test**

Append to `lib/services/stats-service.test.ts`. Add these imports at the top of the file (merge with the existing import block):

```ts
import { beforeEach, vi } from 'vitest'
import prisma from '@/lib/prisma'
import * as statsRepository from '@/lib/repositories/stats-repository'
import { getStats } from './stats-service'
import type { User } from '@/app/generated/prisma/client'
```

The full updated import block at the top of `lib/services/stats-service.test.ts` should read:

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest'
import prisma from '@/lib/prisma'
import * as statsRepository from '@/lib/repositories/stats-repository'
import {
  buildHeatmap,
  computeCompletionRate,
  computeConcentrationRate,
  computeConsistencyScore,
  computeNextStreakGoal,
  computeTrends,
  getStats,
  getTopTopics,
  summarizeSubjects,
} from './stats-service'
import type { SubjectWithTopics } from '@/lib/repositories/stats-repository'
import type { User } from '@/app/generated/prisma/client'

vi.mock('@/lib/prisma', () => ({ default: {} }))
vi.mock('@/lib/repositories/stats-repository')

function fake<T>(partial: Partial<T>): T {
  return partial as T
}
```

Then append this block at the end of the file:

```ts
describe('getStats', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('assembles the full stats payload from repository data', async () => {
    const subjects: SubjectWithTopics[] = [
      {
        id: 'subj_1',
        name: 'Biology',
        color: '#7c3aed',
        icon: null,
        topics: [{ id: 't1', name: 'Cells', status: 'DONE', totalTime: 600, sessionCount: 2 }],
      },
    ]
    const sessions = [{ createdAt: new Date(), duration: 600, xpEarned: 25 }]

    vi.mocked(statsRepository.findSubjectsWithTopics).mockResolvedValue(subjects)
    vi.mocked(statsRepository.findRecentSessions).mockResolvedValue(sessions)

    const user = fake<User>({ id: 'user_1', totalXP: 100, streak: 2, timezone: 'UTC' })

    const stats = await getStats(user)

    expect(statsRepository.findSubjectsWithTopics).toHaveBeenCalledWith(prisma, 'user_1')
    expect(stats.totals).toEqual({ xp: 100, level: 2, focusSeconds: 600, sessions: 2 })
    expect(stats.subjects).toHaveLength(1)
    expect(stats.topSubject?.id).toBe('subj_1')
    expect(stats.streak).toEqual({ current: 2, nextGoal: 3 })
    expect(stats.heatmap.days).toHaveLength(84)
  })

  it('returns an empty payload with no subject or session data', async () => {
    vi.mocked(statsRepository.findSubjectsWithTopics).mockResolvedValue([])
    vi.mocked(statsRepository.findRecentSessions).mockResolvedValue([])

    const user = fake<User>({ id: 'user_2', totalXP: 0, streak: 0, timezone: 'UTC' })

    const stats = await getStats(user)

    expect(stats.totals).toEqual({ xp: 0, level: 1, focusSeconds: 0, sessions: 0 })
    expect(stats.subjects).toEqual([])
    expect(stats.topSubject).toBeNull()
    expect(stats.insights).toEqual({ consistencyScore: 0, completionRate: 0, concentrationRate: 0 })
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run lib/services/stats-service.test.ts`
Expected: FAIL with "getStats is not a function" or similar (not yet implemented)

- [ ] **Step 3: Write the implementation**

Open `lib/services/stats-service.ts` (written in Task 3). Replace its entire top-of-file import block — currently just `import { getDateKeyInTimeZone } from '@/lib/progression'` and `import type { SessionSlice, SubjectWithTopics } from '@/lib/repositories/stats-repository'` — with these four lines, so the file starts with exactly:

```ts
import prisma from '@/lib/prisma'
import * as statsRepository from '@/lib/repositories/stats-repository'
import { getDateKeyInTimeZone, getLevelProgress } from '@/lib/progression'
import type { SessionSlice, SubjectWithTopics } from '@/lib/repositories/stats-repository'
```

Leave every function already in the file (from Task 3) unchanged. Then append this new code at the very end of the file:

```ts
export interface StatsResponse {
  totals: { xp: number; level: number; focusSeconds: number; sessions: number }
  trends: { xp: TrendMetric; focusSeconds: TrendMetric; sessions: TrendMetric }
  levelProgress: ReturnType<typeof getLevelProgress>
  streak: { current: number; nextGoal: number }
  insights: { consistencyScore: number; completionRate: number; concentrationRate: number }
  subjects: SubjectSummary[]
  topTopics: ReturnType<typeof getTopTopics>
  heatmap: { days: HeatmapDay[] }
  topSubject: SubjectSummary | null
}

export async function getStats(user: User): Promise<StatsResponse> {
  const now = new Date()
  const since = new Date(now.getTime() - HEATMAP_DAYS * DAY_MS)

  const [subjects, sessions] = await Promise.all([
    statsRepository.findSubjectsWithTopics(prisma, user.id),
    statsRepository.findRecentSessions(prisma, user.id, since),
  ])

  const subjectSummaries = summarizeSubjects(subjects).sort(
    (a, b) => b.totalSeconds - a.totalSeconds
  )
  const totalSeconds = subjectSummaries.reduce((sum, subject) => sum + subject.totalSeconds, 0)
  const totalSessions = subjectSummaries.reduce((sum, subject) => sum + subject.sessionCount, 0)
  const topicCount = subjectSummaries.reduce((sum, subject) => sum + subject.topicCount, 0)
  const doneTopics = subjectSummaries.reduce((sum, subject) => sum + subject.doneTopics, 0)
  const topSubject = subjectSummaries[0] ?? null

  const levelProgress = getLevelProgress(user.totalXP)

  return {
    totals: {
      xp: user.totalXP,
      level: levelProgress.level,
      focusSeconds: totalSeconds,
      sessions: totalSessions,
    },
    trends: computeTrends(sessions, now),
    levelProgress,
    streak: { current: user.streak, nextGoal: computeNextStreakGoal(user.streak) },
    insights: {
      consistencyScore: computeConsistencyScore(user.streak, totalSessions),
      completionRate: computeCompletionRate(topicCount, doneTopics),
      concentrationRate: computeConcentrationRate(topSubject?.totalSeconds ?? 0, totalSeconds),
    },
    subjects: subjectSummaries,
    topTopics: getTopTopics(subjects),
    heatmap: { days: buildHeatmap(sessions, user.timezone, now) },
    topSubject,
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run lib/services/stats-service.test.ts`
Expected: PASS (all describe blocks green, including the two new `getStats` cases)

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 6: Commit**

```bash
git add lib/services/stats-service.ts lib/services/stats-service.test.ts
git commit -m "feat: add getStats orchestrator combining subject, session, and streak data"
```

---

### Task 5: `app/api/stats/route.ts`

**Files:**
- Create: `app/api/stats/route.ts`

**Interfaces:**
- Consumes: `getStats` from `@/lib/services/stats-service` (Task 4); `withAuth`, `AuthContext` from `@/lib/with-auth-guard`.
- Produces: `GET /api/stats` returning JSON matching `StatsResponse` — consumed by Task 6's `lib/api/stats.ts`.

- [ ] **Step 1: Write the route**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { withAuth, type AuthContext } from '@/lib/with-auth-guard'
import { getStats } from '@/lib/services/stats-service'

export const GET = withAuth(async (_req: NextRequest, { user }: AuthContext) => {
  const stats = await getStats(user)
  return NextResponse.json(stats)
})
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Manual smoke test**

Run: `npm run dev` (in background), then in a signed-in browser session visit `http://localhost:3000/stats` — the page will still be the old UI at this point (rewritten in Task 8), but you can confirm the endpoint works by opening `http://localhost:3000/api/stats` directly in the same authenticated browser tab and confirming it returns a JSON object with `totals`, `trends`, `heatmap.days` (an 84-entry array), etc., instead of a 401/500.
Stop the dev server after confirming.

- [ ] **Step 4: Commit**

```bash
git add app/api/stats/route.ts
git commit -m "feat: add GET /api/stats endpoint"
```

---

### Task 6: `lib/api/stats.ts` + `hooks/use-stats.ts`

**Files:**
- Create: `lib/api/stats.ts`
- Create: `hooks/use-stats.ts`

**Interfaces:**
- Consumes: shared `axios` instance from `@/lib/axios` (default export `api`).
- Produces:
  - `export interface StatsResponse {...}` (mirrors Task 4's service type, this is the client-side copy per the existing `lib/api/*.ts` convention of each file owning its own local interface)
  - `export const getStats: () => Promise<StatsResponse>`
  - `export function useStats()` — a TanStack Query hook, `queryKeys.stats` — consumed by Task 8's `app/stats/page.tsx`.

- [ ] **Step 1: Write `lib/api/stats.ts`**

```ts
import api from '../axios'

export interface TrendMetric {
  value: number
  deltaPct: number
}

export interface SubjectStat {
  id: string
  name: string
  color: string
  icon: string | null
  totalSeconds: number
  sessionCount: number
  topicCount: number
  doneTopics: number
}

export interface TopicStat {
  id: string
  name: string
  subjectName: string
  totalSeconds: number
  sessions: number
}

export interface HeatmapDay {
  date: string
  seconds: number
  sessions: number
}

export interface StatsResponse {
  totals: { xp: number; level: number; focusSeconds: number; sessions: number }
  trends: { xp: TrendMetric; focusSeconds: TrendMetric; sessions: TrendMetric }
  levelProgress: {
    level: number
    currentLevelFloor: number
    nextLevelFloor: number
    xpIntoLevel: number
    xpForLevel: number
    xpToNext: number
    progressPct: number
  }
  streak: { current: number; nextGoal: number }
  insights: { consistencyScore: number; completionRate: number; concentrationRate: number }
  subjects: SubjectStat[]
  topTopics: TopicStat[]
  heatmap: { days: HeatmapDay[] }
  topSubject: SubjectStat | null
}

export const getStats = async (): Promise<StatsResponse> => {
  const { data } = await api.get<StatsResponse>('/stats')
  return data
}
```

- [ ] **Step 2: Write `hooks/use-stats.ts`**

```ts
import { useQuery } from '@tanstack/react-query'
import { getStats } from '@/lib/api/stats'

export const queryKeys = {
  stats: ['stats'] as const,
}

export function useStats() {
  return useQuery({
    queryKey: queryKeys.stats,
    queryFn: getStats,
  })
}
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add lib/api/stats.ts hooks/use-stats.ts
git commit -m "feat: add stats API client and useStats hook"
```

---

### Task 7: New stats components — `ActivityHeatmap` and `HighlightsCard`

**Files:**
- Create: `components/stats/activity-heatmap.tsx`
- Create: `components/stats/highlights-card.tsx`

**Interfaces:**
- Consumes: `HeatmapDay` type from `@/lib/api/stats` (Task 6); `formatDuration` from `@/lib/format`; `SnapshotRow` from `@/components/stats/snapshot-row` (existing, recolored in Task 8).
- Produces:
  - `export function ActivityHeatmap({ days }: { days: HeatmapDay[] })` — consumed by Task 8's page.
  - `export function HighlightsCard(props: HighlightsCardProps)` where `HighlightsCardProps = { streakDays: number; topicCount: number; avgSessionSeconds: number; topSubject: { name: string; totalSeconds: number; sessionCount: number } | null; momentumMessage: string }` — consumed by Task 8's page.

- [ ] **Step 1: Write `components/stats/activity-heatmap.tsx`**

```tsx
'use client'

import { useMemo } from 'react'
import { formatDuration } from '@/lib/format'
import type { HeatmapDay } from '@/lib/api/stats'

function intensityClass(seconds: number, max: number) {
  if (seconds <= 0) return 'bg-surface-hi'
  const ratio = max > 0 ? seconds / max : 0
  if (ratio > 0.75) return 'bg-violet'
  if (ratio > 0.5) return 'bg-violet/70'
  if (ratio > 0.25) return 'bg-violet/45'
  return 'bg-violet/25'
}

function formatDayLabel(date: string) {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

export function ActivityHeatmap({ days }: { days: HeatmapDay[] }) {
  const { weeks, max } = useMemo(() => {
    const max = days.reduce((acc, day) => Math.max(acc, day.seconds), 0)
    const empty: { weeks: (HeatmapDay | null)[][]; max: number } = { weeks: [], max }
    if (!days.length) return empty

    const firstWeekday = new Date(`${days[0].date}T00:00:00Z`).getUTCDay()
    const padded: (HeatmapDay | null)[] = [
      ...(Array(firstWeekday).fill(null) as null[]),
      ...days,
    ]

    const built: (HeatmapDay | null)[][] = []
    for (let i = 0; i < padded.length; i += 7) {
      built.push(padded.slice(i, i + 7))
    }

    return { weeks: built, max }
  }, [days])

  if (!days.length) {
    return <p className="text-sm text-text-sub">No activity yet.</p>
  }

  return (
    <div>
      <div className="flex gap-1 overflow-x-auto pb-1">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="flex flex-col gap-1">
            {week.map((day, dayIndex) =>
              day ? (
                <div
                  key={day.date}
                  title={`${formatDayLabel(day.date)} · ${formatDuration(day.seconds)} · ${day.sessions} session${day.sessions === 1 ? '' : 's'}`}
                  className={`h-3 w-3 rounded-sm ${intensityClass(day.seconds, max)}`}
                />
              ) : (
                <div key={`pad-${weekIndex}-${dayIndex}`} className="h-3 w-3" />
              )
            )}
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center justify-end gap-1 text-[10px] text-muted-foreground">
        <span>Less</span>
        <div className="h-3 w-3 rounded-sm bg-surface-hi" />
        <div className="h-3 w-3 rounded-sm bg-violet/25" />
        <div className="h-3 w-3 rounded-sm bg-violet/45" />
        <div className="h-3 w-3 rounded-sm bg-violet/70" />
        <div className="h-3 w-3 rounded-sm bg-violet" />
        <span>More</span>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Write `components/stats/highlights-card.tsx`**

```tsx
import { BarChart3, Clock3, Flame, Trophy } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { SnapshotRow } from '@/components/stats/snapshot-row'
import { formatDuration } from '@/lib/format'

interface HighlightsCardProps {
  streakDays: number
  topicCount: number
  avgSessionSeconds: number
  topSubject: { name: string; totalSeconds: number; sessionCount: number } | null
  momentumMessage: string
}

export function HighlightsCard({
  streakDays,
  topicCount,
  avgSessionSeconds,
  topSubject,
  momentumMessage,
}: HighlightsCardProps) {
  return (
    <Card className="border-border bg-surface py-0">
      <CardContent className="space-y-3 px-4 py-5 sm:px-5">
        <h2 className="text-base font-bold text-foreground">Highlights</h2>

        <SnapshotRow
          label="Current streak"
          value={`${streakDays} day${streakDays === 1 ? '' : 's'}`}
          icon={Flame}
        />
        <SnapshotRow label="Tracked topics" value={String(topicCount)} icon={BarChart3} />
        <SnapshotRow label="Avg session" value={formatDuration(avgSessionSeconds)} icon={Clock3} />

        <div className="border-t border-border pt-3">
          <p className="text-xs font-semibold tracking-[0.1em] text-muted-foreground uppercase">
            Top subject
          </p>
          {topSubject ? (
            <>
              <p className="mt-1 text-lg font-extrabold text-foreground">{topSubject.name}</p>
              <p className="text-sm text-text-sub">
                {formatDuration(topSubject.totalSeconds)} across {topSubject.sessionCount} sessions.
              </p>
            </>
          ) : (
            <p className="mt-1 text-sm text-text-sub">No sessions yet.</p>
          )}
        </div>

        <div className="border-t border-border pt-3">
          <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-violet-mid">
            <Trophy className="h-4 w-4" />
            Momentum insight
          </p>
          <p className="mt-2 text-sm text-text-sub">{momentumMessage}</p>
        </div>
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add components/stats/activity-heatmap.tsx components/stats/highlights-card.tsx
git commit -m "feat: add ActivityHeatmap and HighlightsCard components"
```

---

### Task 8: Recolor `StatCard`, `InsightCard`, `SnapshotRow`

**Files:**
- Modify: `components/stats/stat-card.tsx`
- Modify: `components/stats/insight-card.tsx`
- Modify: `components/stats/snapshot-row.tsx`

**Interfaces:**
- Produces: `StatCard` gains an optional `trend?: { value: number; deltaPct: number }` prop — consumed by Task 9's page for the 4 top tiles.
- `InsightCard` and `SnapshotRow` keep their existing prop signatures unchanged (recolor only).

- [ ] **Step 1: Rewrite `components/stats/stat-card.tsx`**

```tsx
import { TrendingDown, TrendingUp } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface Trend {
  value: number
  deltaPct: number
}

export function StatCard({
  id,
  icon: Icon,
  label,
  value,
  trend,
}: {
  id?: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  trend?: Trend
}) {
  const showTrend = trend !== undefined && trend.deltaPct !== 0
  const isPositive = (trend?.deltaPct ?? 0) > 0

  return (
    <Card id={id} className="border-border bg-surface py-0">
      <CardContent className="flex items-center justify-between px-4 py-4 sm:px-5">
        <div>
          <p className="text-xs text-text-sub">{label}</p>
          <p className="mt-1 text-2xl font-extrabold text-foreground">{value}</p>
          {showTrend && trend && (
            <p
              className={`mt-1 inline-flex items-center gap-1 text-xs font-semibold ${
                isPositive ? 'text-success' : 'text-destructive'
              }`}
            >
              {isPositive ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {Math.abs(trend.deltaPct)}% vs last week
            </p>
          )}
        </div>
        <div className="rounded-xl border border-violet/30 bg-violet-glow p-2.5">
          <Icon className="h-4 w-4 text-violet-mid" />
        </div>
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 2: Rewrite `components/stats/insight-card.tsx`**

```tsx
import { Card, CardContent } from '@/components/ui/card'

export function InsightCard({
  icon: Icon,
  label,
  value,
  hint,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  hint: string
  accent: string
}) {
  return (
    <Card className="border-border bg-surface py-0">
      <CardContent className="relative overflow-hidden px-4 py-4 sm:px-5">
        <div className={`pointer-events-none absolute inset-0 ${accent}`} />
        <div className="relative">
          <p className="inline-flex items-center gap-1.5 text-xs text-text-sub">
            <Icon className="h-3.5 w-3.5 text-violet-mid" />
            {label}
          </p>
          <p className="mt-1 text-2xl font-extrabold text-foreground">{value}</p>
          <p className="mt-1 text-xs text-text-sub">{hint}</p>
        </div>
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 3: Rewrite `components/stats/snapshot-row.tsx`**

```tsx
export function SnapshotRow({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string
  icon: React.ComponentType<{ className?: string }>
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-surface-up px-3 py-2.5">
      <span className="inline-flex items-center gap-2 text-sm text-text-sub">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </span>
      <span className="text-sm font-semibold text-foreground">{value}</span>
    </div>
  )
}
```

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: errors in `app/stats/page.tsx` are expected at this point (it still uses the old props/shape) — confirm there are no errors in the three files just changed or in `components/stats/highlights-card.tsx` (which already uses the updated `SnapshotRow`).

- [ ] **Step 5: Commit**

```bash
git add components/stats/stat-card.tsx components/stats/insight-card.tsx components/stats/snapshot-row.tsx
git commit -m "refactor: recolor stat/insight/snapshot cards onto design system tokens"
```

---

### Task 9: Rewrite `app/stats/page.tsx`

**Files:**
- Modify: `app/stats/page.tsx` (full rewrite)

**Interfaces:**
- Consumes: `useStats` (Task 6), `StatsResponse` types (Task 6), `ActivityHeatmap` (Task 7), `HighlightsCard` (Task 7), updated `StatCard`/`InsightCard`/`SnapshotRow` (Task 8), `Skeleton` from `@/components/ui/skeleton`, `AppHeader` from `@/components/app-header`, `Badge`/`Card`/`CardContent`/`Progress` from `@/components/ui/*`, `formatDuration`/`formatPercent` from `@/lib/format`.
- Produces: the rewritten `/stats` page. This is the last task with UI surface — no further tasks consume it.

- [ ] **Step 1: Replace the full contents of `app/stats/page.tsx`**

```tsx
'use client'

import { BarChart3, CheckCircle2, Clock3, Flame, Rocket, Target, Zap } from 'lucide-react'
import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { AppHeader } from '@/components/app-header'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { ActivityHeatmap } from '@/components/stats/activity-heatmap'
import { HighlightsCard } from '@/components/stats/highlights-card'
import { InsightCard } from '@/components/stats/insight-card'
import { StatCard } from '@/components/stats/stat-card'
import { formatDuration, formatPercent } from '@/lib/format'
import { useStats } from '@/hooks/use-stats'

const CHART_COLORS = ['#7c3aed', '#a78bfa', '#ea580c', '#10b981', '#c4b5fd', '#fdba74']
const TOOLTIP_STYLE = {
  background: '#162032',
  border: '1px solid #2d4163',
  borderRadius: '10px',
  color: '#e2e8f0',
}

export default function StatsPage() {
  const { data: stats, isLoading } = useStats()

  const subjects = stats?.subjects ?? []
  const topTopics = stats?.topTopics ?? []
  const heatmapDays = stats?.heatmap.days ?? []

  const subjectChart = subjects.slice(0, 8).map((subject) => ({
    id: subject.id,
    name: subject.name.length > 16 ? `${subject.name.slice(0, 16)}...` : subject.name,
    timeMinutes: Math.round(subject.totalSeconds / 60),
    sessions: subject.sessionCount,
  }))

  const shareChart = subjectChart.map((subject, index) => ({
    ...subject,
    value: subject.timeMinutes,
    color: CHART_COLORS[index % CHART_COLORS.length],
  }))

  const avgSessionSeconds =
    stats && stats.totals.sessions
      ? Math.round(stats.totals.focusSeconds / stats.totals.sessions)
      : 0

  const momentumMessage =
    stats && stats.totals.sessions >= 20
      ? 'You have built a strong study rhythm. Keep consistency to compound gains.'
      : 'Stack small wins. Short daily sessions build faster long-term retention.'

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 left-[-140px] h-[420px] w-[420px] rounded-full bg-violet-glow blur-[140px]" />
        <div className="absolute right-[-120px] bottom-[-100px] h-[420px] w-[420px] rounded-full bg-streak-bg blur-[140px]" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-10">
        <AppHeader />

        <section>
          <p className="text-xs font-semibold tracking-[0.18em] text-violet-mid uppercase">
            Advanced Stats
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-foreground sm:text-4xl">
            Your full study analytics
          </h1>
          <p className="mt-2 text-sm text-text-sub">
            Deep breakdowns across XP, session volume, subject performance, and time
            distribution.
          </p>
        </section>

        {isLoading || !stats ? (
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-2xl" />
            ))}
          </section>
        ) : (
          <>
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                icon={Zap}
                label="Total XP"
                value={String(stats.totals.xp)}
                trend={stats.trends.xp}
              />
              <StatCard icon={Rocket} label="Current Level" value={`Lvl ${stats.totals.level}`} />
              <StatCard
                icon={Clock3}
                label="Focus Time"
                value={formatDuration(stats.totals.focusSeconds)}
                trend={stats.trends.focusSeconds}
              />
              <StatCard
                id="tutorial-stats-sessions"
                icon={BarChart3}
                label="Sessions"
                value={String(stats.totals.sessions)}
                trend={stats.trends.sessions}
              />
            </section>

            <Card id="tutorial-stats-level" className="border-border bg-surface py-0">
              <CardContent className="space-y-3 px-4 py-5 sm:px-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-base font-bold text-foreground">Level progress</h2>
                  <Badge className="border border-violet/30 bg-violet-glow text-violet-mid">
                    {stats.levelProgress.xpToNext} XP to Level {stats.levelProgress.level + 1}
                  </Badge>
                </div>
                <Progress value={stats.levelProgress.progressPct} className="h-2.5 bg-surface-hi" />
                <div className="flex items-center justify-between text-xs text-text-sub">
                  <span>
                    Level {stats.levelProgress.level} · {stats.levelProgress.xpIntoLevel}/
                    {stats.levelProgress.xpForLevel} XP
                  </span>
                  <span>{Math.round(stats.levelProgress.progressPct)}%</span>
                </div>
              </CardContent>
            </Card>

            <section
              id="tutorial-stats-streak"
              className="rounded-2xl border border-streak/35 bg-gradient-to-r from-streak-bg via-streak-bg to-transparent px-4 py-3 sm:px-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl border border-streak/45 bg-streak-bg p-2">
                    <Flame className="h-5 w-5 text-streak" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold tracking-[0.16em] text-streak uppercase">
                      Streak spotlight
                    </p>
                    <p className="text-3xl leading-none font-black text-foreground sm:text-4xl">
                      {stats.streak.current}
                      <span className="ml-1 text-lg font-semibold text-streak/90 sm:text-xl">
                        day{stats.streak.current === 1 ? '' : 's'}
                      </span>
                    </p>
                    <p className="text-xs text-streak/80">
                      Keep showing up daily to protect momentum.
                    </p>
                  </div>
                </div>
                <div className="rounded-xl border border-streak/35 bg-streak-bg px-3 py-2 text-right">
                  <p className="text-[10px] font-semibold tracking-[0.12em] text-streak uppercase">
                    Next goal
                  </p>
                  <p className="text-lg font-extrabold text-foreground">
                    {stats.streak.nextGoal} days
                  </p>
                </div>
              </div>
            </section>

            <Card className="border-border bg-surface py-0">
              <CardContent className="space-y-3 px-4 py-5 sm:px-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-foreground">Activity, last 12 weeks</h2>
                  <Badge className="border border-violet/30 bg-violet-glow text-violet-mid">
                    {heatmapDays.filter((d) => d.seconds > 0).length} active days
                  </Badge>
                </div>
                <ActivityHeatmap days={heatmapDays} />
              </CardContent>
            </Card>

            <section className="grid gap-4 sm:grid-cols-3">
              <InsightCard
                icon={Flame}
                label="Consistency score"
                value={formatPercent(stats.insights.consistencyScore)}
                hint="Derived from streak and session cadence."
                accent="bg-gradient-to-br from-streak-bg to-transparent"
              />
              <InsightCard
                icon={CheckCircle2}
                label="Topic completion"
                value={formatPercent(stats.insights.completionRate)}
                hint="Done topics across all tracked topics."
                accent="bg-gradient-to-br from-success-bg to-transparent"
              />
              <InsightCard
                icon={Target}
                label="Focus concentration"
                value={formatPercent(stats.insights.concentrationRate)}
                hint="How much time is concentrated in your top subject."
                accent="bg-gradient-to-br from-violet-glow to-transparent"
              />
            </section>

            <Card id="tutorial-stats-graph" className="border-border bg-surface py-0">
              <CardContent className="space-y-4 px-4 py-5 sm:px-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-foreground">
                    Time + sessions by subject
                  </h2>
                  <Badge className="border border-violet/30 bg-violet-glow text-violet-mid">
                    Top {subjectChart.length}
                  </Badge>
                </div>

                {!subjectChart.length ? (
                  <p className="text-sm text-text-sub">
                    Create your first subject to unlock analytics.
                  </p>
                ) : (
                  <div className="h-[320px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={subjectChart}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                        <XAxis
                          dataKey="name"
                          tick={{ fill: '#94a3b8', fontSize: 12 }}
                          axisLine={{ stroke: 'rgba(148,163,184,0.3)' }}
                          tickLine={{ stroke: 'rgba(148,163,184,0.3)' }}
                        />
                        <YAxis
                          yAxisId="left"
                          tick={{ fill: '#94a3b8', fontSize: 12 }}
                          axisLine={{ stroke: 'rgba(148,163,184,0.3)' }}
                          tickLine={{ stroke: 'rgba(148,163,184,0.3)' }}
                        />
                        <YAxis
                          yAxisId="right"
                          orientation="right"
                          tick={{ fill: '#94a3b8', fontSize: 12 }}
                          axisLine={{ stroke: 'rgba(148,163,184,0.3)' }}
                          tickLine={{ stroke: 'rgba(148,163,184,0.3)' }}
                        />
                        <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={{ color: '#e2e8f0' }} itemStyle={{ color: '#94a3b8' }} />
                        <Legend wrapperStyle={{ color: '#94a3b8' }} />
                        <Bar
                          yAxisId="left"
                          dataKey="timeMinutes"
                          name="Minutes"
                          radius={[6, 6, 0, 0]}
                          fill="#7c3aed"
                        />
                        <Bar
                          yAxisId="right"
                          dataKey="sessions"
                          name="Sessions"
                          radius={[6, 6, 0, 0]}
                          fill="#a78bfa"
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <Card className="border-border bg-surface py-0">
                <CardContent className="space-y-4 px-4 py-5 sm:px-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-foreground">Subject breakdown</h2>
                    <Badge className="border border-violet/30 bg-violet-glow text-violet-mid">
                      {subjects.length} subjects
                    </Badge>
                  </div>

                  {!subjects.length ? (
                    <p className="text-sm text-text-sub">No subject data yet.</p>
                  ) : (
                    <div className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
                      {subjects.map((subject) => {
                        const percentage = stats.totals.focusSeconds
                          ? Math.round((subject.totalSeconds / stats.totals.focusSeconds) * 100)
                          : 0

                        return (
                          <div
                            key={subject.id}
                            className="rounded-xl border border-border-up bg-surface-up p-3"
                          >
                            <div className="mb-1.5 flex items-center justify-between text-sm">
                              <span className="font-semibold text-foreground">{subject.name}</span>
                              <span className="text-text-sub">
                                {formatDuration(subject.totalSeconds)}
                              </span>
                            </div>
                            <Progress value={Math.max(4, percentage)} className="h-2 bg-surface-hi" />
                            <div className="mt-1.5 flex items-center justify-between text-xs text-text-sub">
                              <span>{subject.sessionCount} sessions</span>
                              <span>{subject.topicCount} topics</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-border bg-surface py-0">
                <CardContent className="space-y-4 px-4 py-5 sm:px-5">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-bold text-foreground">Time share</h2>
                    <Badge className="border border-violet/30 bg-violet-glow text-violet-mid">
                      {shareChart.length} slices
                    </Badge>
                  </div>
                  {!shareChart.length ? (
                    <p className="text-sm text-text-sub">No chart data yet.</p>
                  ) : (
                    <div className="h-[220px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={shareChart}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={56}
                            outerRadius={86}
                            paddingAngle={2}
                          >
                            {shareChart.map((entry) => (
                              <Cell key={entry.id} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={TOOLTIP_STYLE}
                            labelStyle={{ color: '#e2e8f0' }}
                            itemStyle={{ color: '#94a3b8' }}
                            formatter={(value: number | string | undefined) => [
                              `${value ?? 0}m`,
                              'Time',
                            ]}
                          />
                          <Legend wrapperStyle={{ color: '#94a3b8', fontSize: '12px' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  <div className="space-y-2 border-t border-border pt-3">
                    <h3 className="text-sm font-semibold text-foreground">Top topics</h3>
                    {!topTopics.length ? (
                      <p className="text-sm text-text-sub">No topic data yet.</p>
                    ) : (
                      topTopics.map((topic, index) => (
                        <div
                          key={topic.id}
                          className="rounded-lg border border-border-up bg-surface-up px-3 py-2"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate text-sm font-semibold text-foreground">
                              #{index + 1} {topic.name}
                            </p>
                            <p className="text-xs text-text-sub">
                              {formatDuration(topic.totalSeconds)}
                            </p>
                          </div>
                          <p className="mt-0.5 text-xs text-text-sub">
                            {topic.subjectName} · {topic.sessions} sessions
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              <HighlightsCard
                streakDays={stats.streak.current}
                topicCount={subjects.reduce((sum, s) => sum + s.topicCount, 0)}
                avgSessionSeconds={avgSessionSeconds}
                topSubject={
                  stats.topSubject
                    ? {
                        name: stats.topSubject.name,
                        totalSeconds: stats.topSubject.totalSeconds,
                        sessionCount: stats.topSubject.sessionCount,
                      }
                    : null
                }
                momentumMessage={momentumMessage}
              />
            </section>
          </>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Lint**

Run: `npm run lint`
Expected: no errors in the files touched by this plan (pre-existing unrelated warnings elsewhere in the repo are not this task's concern)

- [ ] **Step 4: Run the full unit test suite**

Run: `npm run test:unit`
Expected: PASS

- [ ] **Step 5: Manual verification in the browser**

Run: `npm run dev`, sign in, and visit `/stats`. Confirm:
- The page loads without console errors.
- No leftover `cyan`/`slate`/`orange` raw color classes are visible in the rendered page (violet + streak-orange only).
- The stat tiles show trend arrows/percentages (or no trend line when `deltaPct` is 0).
- The activity heatmap renders a 12-week grid with hover tooltips.
- The "Achievements" and "Daily quests" sections are gone.
- The subject breakdown / time share / highlights row no longer causes one column to scroll far past the others — the 3-column grid should end at roughly similar heights.
- Resize the browser to mobile width and confirm the 3-column grid stacks to 1 column cleanly.

Stop the dev server after confirming.

- [ ] **Step 6: Commit**

```bash
git add app/stats/page.tsx
git commit -m "feat: rebuild stats page on useStats, add heatmap and trend deltas, drop achievements/quests"
```

---

## Self-Review Notes (for the plan author, already applied above)

- Spec coverage: data/API architecture (Task 2–6), visual design tokens (Task 8–9), heatmap (Task 7, 9), trend deltas (Task 3, 8, 9), dropped achievements/quests (Task 9 — simply not carried over), 3-column rebalanced layout (Task 9), tutorial `id`s preserved (Global Constraints + Task 9) — all covered.
- No placeholders: every step has complete code.
- Type consistency checked: `SubjectWithTopics`/`SessionSlice` defined once in `stats-repository.ts` and imported everywhere else; `StatsResponse` defined once server-side (`stats-service.ts`) and once client-side (`lib/api/stats.ts`) as is the existing convention for other resources (e.g. `Subject` is defined independently in both `lib/repositories` and `lib/api/subjects.ts`); `HighlightsCardProps.topSubject` shape matches what `app/stats/page.tsx` passes from `stats.topSubject`.
