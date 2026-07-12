# Stats page overhaul — design

## Problem

`app/stats/page.tsx` has two separate problems:

1. **Visual drift.** It (and the components it uses: `StatCard`, `InsightCard`, `SnapshotRow`) hardcode raw Tailwind colors (`cyan-300`, `slate-400`, `orange-500`, `white/[0.0x]`) that are not defined anywhere in `app/globals.css`. The documented design system (`docs/DESIGN-SYSTEM.md`) only defines a violet accent + streak-orange + a neutral surface/text ramp — no cyan. This page is one of the worst offenders of the "don't hardcode one-off styling" rule in `docs/DESIGN-SYSTEM.md` §5.
2. **Data/architecture gap.** The page fetches all subjects, then fires one topic query per subject client-side (N+1), computes every stat in the browser, and never touches `Session.createdAt` at all — so there's no time-series view (no day-by-day activity, no trend vs. prior period). It also renders two hardcoded, unpersisted "Achievements" and "Daily quests" sections that are just recomputed from current totals every render and don't represent real gamification state.

## Goals

- Rebuild the stats page strictly on the documented design tokens (violet, streak-orange, success, surface ramp, Geist Mono type scale) — this becomes the reference page for the palette cleanup other pages still need.
- Add a real time-series view: a 12-week activity heatmap plus 7-day trend deltas on the top stat tiles.
- Move stat computation server-side via a new `/api/stats` endpoint, replacing the N+1 client-side aggregation.
- Drop the fake achievements/quests sections entirely.
- Fix the layout imbalance in the original two-column body (sidebar column ran far longer than the chart column, forcing excess scrolling).

## Non-goals

- No changes to shared `components/ui/*` primitives (`Card`, `Badge`, `Progress`) — those are used by dashboard/leaderboard/subjects/settings, which still use the off-palette look. Migrating them is a separate, opt-in follow-up per `docs/DESIGN-SYSTEM.md` §5's existing "known offenders" list.
- No new persisted achievements/quests system. That's a materially larger feature (schema, unlock logic) than a stats page reskin.
- No Prisma schema changes — everything is derived from existing `Session`, `Topic`, `Subject`, `User` fields.

## Data & API architecture

**New endpoint:** `GET /api/stats` (`app/api/stats/route.ts`), wrapped in `withAuth`.

**New repository:** `lib/repositories/stats-repository.ts`
- Subjects + topics for the user (topic fields: `totalTime`, `sessionCount`, `status` — already denormalized, no need to touch `Session` for subject/topic rollups).
- Sessions in the last 84 days for the user, selecting only `createdAt`, `duration`, `xpEarned` (small per-user dataset; no need for SQL-level date bucketing).

**New service:** `lib/services/stats-service.ts` (+ `stats-service.test.ts`, matching the existing per-service test convention)
- Subject/topic rollups (total seconds, session counts, completion rate) — same computation the page does today, moved server-side.
- Day-bucketing for the heatmap: group the 84-day session window by day using the same timezone-aware day-key approach `lib/progression.ts`'s `getNextStreak` already uses (`getDateKeyInTimeZone`), so heatmap days line up with the user's local day boundaries exactly like streak calculation does.
- 7-day trend deltas: sum XP/focus-seconds/session-count for the last 7 days vs. the 7 days before that, expressed as `{ value, deltaPct }` per metric.
- Consistency score, concentration rate, completion rate — same formulas as today, moved server-side.

**Response shape:**
```ts
{
  totals: { xp: number, level: number, focusSeconds: number, sessions: number },
  trends: {
    xp: { value: number, deltaPct: number },
    focusSeconds: { value: number, deltaPct: number },
    sessions: { value: number, deltaPct: number },
  },
  levelProgress: { level, xpIntoLevel, xpForLevel, xpToNext, progressPct }, // from lib/progression.ts
  streak: { current: number, nextGoal: number },
  insights: { consistencyScore: number, completionRate: number, concentrationRate: number },
  subjects: Array<{
    id: string, name: string, color: string, icon: string | null,
    totalSeconds: number, sessionCount: number, topicCount: number, doneTopics: number,
  }>,
  topTopics: Array<{ id: string, name: string, subjectName: string, totalSeconds: number, sessions: number }>,
  heatmap: { days: Array<{ date: string, seconds: number, sessions: number }> }, // last 12 weeks, oldest first
  topSubject: { id: string, name: string, totalSeconds: number, sessionCount: number } | null,
}
```

**Client:**
- `lib/api/stats.ts` — `getStats(): Promise<StatsResponse>`, mirroring `lib/api/subjects.ts`'s shape/conventions.
- `hooks/use-stats.ts` — `useStats()` TanStack Query hook, `queryKeys.stats` key.
- `app/stats/page.tsx` drops `useSubjects`, `getTopics`, and the `useQueries` topic-per-subject loop entirely in favor of this single hook.

## Visual design

All colors move onto documented tokens: `bg-surface` / `bg-surface-up` / `bg-surface-hi`, `text-violet` / `text-violet-mid` / `bg-violet-glow`, `text-streak` / `bg-streak-bg`, `text-success` / `bg-success-bg`, `text-foreground` / `text-text-sub` / `text-muted-foreground`, Geist Mono type scale from `docs/DESIGN-SYSTEM.md` §2. No page-level `cyan-*`/`slate-*`/`orange-*`/`white/[0.0x]` utility classes.

Top to bottom:

1. **Header** — eyebrow label (`text-violet-mid`) + heading, same structure as today.
2. **Stat tiles row** (4): Total XP, Level, Focus Time, Sessions. Each tile adds a small trend indicator (▲/▼ + %) vs. the prior 7 days (`text-success` for positive, `text-destructive` for negative), sourced from `trends`.
3. **Level progress card** — violet → violet-mid gradient fill with glow, per §4's XP progress bar spec.
4. **Streak spotlight banner** — same structure as today, recolored onto `streak`/`streak-bg` tokens instead of raw `orange-*`.
5. **Activity heatmap** (new) — `components/stats/activity-heatmap.tsx`. 12-week GitHub-style grid built from `heatmap.days`; cell intensity is a violet shade scaled by seconds studied that day; hover shows date/duration/session count. Placed right after the streak banner as the headline new feature.
6. **Insight row** (3): consistency score (`streak` accent), topic completion (`success` accent), focus concentration (`violet` accent) — sourced from `insights`.
7. **Subject bar chart** — full width, its own section (not inside a column) for chart readability, and so it doesn't anchor one column's height in the grid below it. Violet + violet-mid series instead of violet+cyan.
8. **3-column detail grid** (`grid-cols-1 md:grid-cols-2 xl:grid-cols-3`), replacing the old unbalanced 2-column (1.25fr/0.75fr) body that made the sidebar run far past the chart column:
   - **Col 1:** Subject breakdown list (capped height, internal scroll if many subjects, so it can't unbalance the row alone).
   - **Col 2:** Time-share pie chart + Top topics list.
   - **Col 3:** New merged **Highlights** card (`components/stats/highlights-card.tsx`) — current streak, tracked topics, avg session, top subject, and the momentum insight line as compact rows in one card (via existing `SnapshotRow`), replacing today's 3 separate cards (Performance snapshot / Top subject / Momentum insight).

Achievements and Daily quests sections are removed entirely, not migrated.

**Chart palette:** the pie chart and heatmap need a multi-hue categorical ramp that the design system doesn't define (only single-purpose tokens exist). A small ordered ramp (violet, violet-mid, streak, success, plus two muted supporting tones) is defined locally inside `components/stats/*` chart files — not added as new global CSS tokens, since it's a chart-specific need rather than a reusable UI surface color.

**Loading state:** `Skeleton` (`components/ui/skeleton.tsx`), matching the pattern already used on `app/subjects/[id]/decks/page.tsx`, replacing today's "Loading analytics..." text.

## File changes

**New:**
- `app/api/stats/route.ts`
- `lib/repositories/stats-repository.ts`
- `lib/services/stats-service.ts` + `lib/services/stats-service.test.ts`
- `lib/api/stats.ts`
- `hooks/use-stats.ts`
- `components/stats/activity-heatmap.tsx`
- `components/stats/highlights-card.tsx`

**Modified:**
- `app/stats/page.tsx` — rewritten to consume `useStats()` only, new layout.
- `components/stats/stat-card.tsx` — recolored, gains optional trend-delta prop.
- `components/stats/insight-card.tsx` — recolored.
- `components/stats/snapshot-row.tsx` — recolored only (reused inside `highlights-card.tsx`).

**Unchanged (explicitly out of scope):**
- `components/ui/card.tsx`, `badge.tsx`, `progress.tsx`
- `app/dashboard/page.tsx`, `app/leaderboard/page.tsx`, `app/subjects/**`, `app/settings/page.tsx`
- Prisma schema
