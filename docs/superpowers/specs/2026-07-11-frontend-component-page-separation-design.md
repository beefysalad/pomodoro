# Frontend component/page separation

## Problem

`app/**/page.tsx` files mix page composition with implementation detail: inline Zod schemas, inline formatting helpers, and inline sub-components that are never reused elsewhere. CLAUDE.md already states "Pages under `app/` stay thin and compose hooks + components; business logic lives in `lib/`" but this isn't followed in practice. Concretely:

- `app/settings/page.tsx` defines a Zod `timerSchema` (duplicating/extending `UpdateUserSchemaApi` in `lib/schemas/user.ts`) plus a `SettingField` component and `SpotifyStatus`/`SpotifyStatusResponse` types, all inline.
- `app/stats/page.tsx` defines `formatDuration`, `formatPercent`, and three components (`StatCard`, `SnapshotRow`, `InsightCard`) inline.
- `app/dashboard/page.tsx` defines `pad`, `formatClock`, a `BREAK_SECONDS` constant, and a `PomodoroRing` component inline (977 lines total).
- `app/subjects/[id]/page.tsx` defines `formatDuration`, `shuffle`, and a `StatCard` component inline, alongside ~1490 lines covering topic board drag-and-drop, flashcard study mode, and quiz mode all in one file — the largest and riskiest file in the app.
- `app/subjects/page.tsx` duplicates its own `formatDuration`.
- `components/public-timer.tsx` defines `pad`/`formatTime` inline (a third copy of the same clock-formatting logic) plus a `Mode` type.
- `components/tutorial-guide.tsx` defines a `getCardPlacement` helper and several interfaces inline.
- `app/subjects/[id]/flashcards/page.tsx` defines a `DraftCard` type inline.

Net effect: no page file is a clean "compose hooks + components" file, the same formatting logic (`pad`/`formatClock`/`formatTime`/`formatDuration`/`formatMinutes`/`formatPercent`) is reimplemented in four+ places, and the two largest pages (`dashboard`, `subjects/[id]`) are hard to navigate or safely change.

## Goals

- Every `app/**/page.tsx` file contains only: imports, hook calls for data/state, and JSX composed from imported components. Target under ~150 lines per page.
- Every non-trivial sub-component (rendered via a named function today, or a large inline JSX block) moves to its own file under `components/<route-name>/`.
- Every Zod schema (API or form) lives in `lib/schemas/<domain>.ts` — none defined inside a page or component file.
- Duplicated formatting helpers (`pad`, `formatClock`/`formatTime`, `formatDuration`, `formatPercent`, `formatMinutes`) consolidate into one `lib/format.ts`.
- One-off non-formatting helpers (`shuffle`, `getCardPlacement`) get a small dedicated `lib/` file.
- Complex page-local state machines (flashcard study/quiz mode in `subjects/[id]`) extract into a `hooks/use-<feature>.ts` so the page only calls the hook and renders what it returns.
- Migrate every page and the two oversized standalone components (`public-timer.tsx`, `tutorial-guide.tsx`) in one project, smallest/lowest-risk first.

## Non-goals

- No behavior changes. This is a pure structural refactor — same UI, same data flow, same hooks (`hooks/use-*.ts`), same `lib/api/*.ts` layer.
- No changes to `app/api/**/route.ts`, `lib/repositories/*`, or `lib/services/*` (already addressed by the prior backend layering work).
- No new design-system work — components move, they don't get restyled.
- `components/ui/*` (shared primitives) and `components/onboarding/*` (already organized per the folder-per-route pattern) are not restructured, only audited for leftover inline clutter (e.g. `wizard-shell.tsx`).
- `app/spotify-poc/page.tsx` is a POC/debug page, not a real user-facing route — left as-is.

## Directory layout

```
components/
  dashboard/
    pomodoro-ring.tsx
    ...
  settings/
    timer-settings-form.tsx
    spotify-connection-card.tsx
    setting-field.tsx
    ...
  subjects/
    ...
  subjects-detail/
    topic-board.tsx
    stat-card.tsx
    flashcard-study-modal.tsx
    flashcard-quiz-modal.tsx
    ...
  subjects-decks/
    ...
  subjects-flashcards/
    ...
  stats/
    stat-card.tsx
    snapshot-row.tsx
    insight-card.tsx
    ...
  leaderboard/
    ...
  onboarding/            (existing — audit only)
  ui/                    (existing — unchanged)

lib/
  format.ts              # formatDuration, formatClock/pad, formatPercent, formatMinutes
  shuffle.ts              # array shuffle helper (from subjects/[id])
  schemas/
    user.ts               # gains the timer-settings form schema
    ...                    # (existing per-domain schema files gain form schemas where needed)

hooks/
  use-flashcard-quiz.ts   # extracted from app/subjects/[id]/page.tsx
```

Exact filenames within each `components/<route>/` folder are decided during each phase based on what's actually extracted — the layout above shows the pattern, not a rigid checklist.

## Conventions

- **One component per file**, kebab-case filename, named export matching the component name — same convention `components/ui/*` and `components/onboarding/*` already use.
- **Folder-per-route**: a page's dedicated components live in `components/<route-name>/`, mirroring the existing `components/onboarding/` precedent. Nested routes flatten with a hyphen (`app/subjects/[id]/decks` → `components/subjects-decks/`).
- **Schemas**: every Zod schema lives in `lib/schemas/<domain>.ts` next to that domain's existing API schema. A client-only form schema (e.g. the settings timer form, which reshapes string inputs before validating) is named distinctly from the API schema in the same file (e.g. `TimerSettingsFormSchema` alongside `UpdateUserSchemaApi`).
- **Formatting helpers**: `lib/format.ts` is the single source for time/percent/duration formatting used across dashboard, stats, subjects-detail, leaderboard, and `public-timer`. Existing call sites are updated to import from there instead of redefining.
- **Hooks over inline state machines**: if a chunk of `useState`/`useEffect` in a page implements a distinct, self-contained flow (not simple UI toggles), it becomes `hooks/use-<feature>.ts`. Simple local UI state (a boolean for a dialog being open, a form field) stays in the page or in the component that owns it.
- **No behavior-preserving abstraction beyond what's needed**: extract to make files clean and navigable, don't invent new generic abstractions (e.g. don't build a generic "StatCard" design system if one doesn't already exist — just relocate the existing one per page, and only share it if it's truly the same component already, like `StatCard` in both `stats` and `subjects-detail`, which should be compared and deduplicated if identical).

## Migration order

Ten independent, sequential phases — each is its own PR-sized unit, verified with `npm run lint`, `npm run format:check`, and the relevant Playwright spec before moving on. Smallest/lowest-risk first; the two monoliths last once the pattern is proven.

1. **Shared foundations** — create `lib/format.ts` (consolidate `pad`/`formatClock`/`formatTime`/`formatDuration`/`formatPercent`/`formatMinutes`), create `lib/shuffle.ts`. Don't wire up call sites yet beyond what's trivial; later phases adopt them as each page is migrated.
2. **leaderboard** (190 lines) — extract `formatMinutes` usage to `lib/format.ts`, extract any leaderboard row/table sub-components to `components/leaderboard/`.
3. **settings** (401 lines) — move `timerSchema` into `lib/schemas/user.ts`, extract `SettingField` to `components/settings/setting-field.tsx`, extract the timer form and Spotify connection block into their own components, move `SpotifyStatus`/`SpotifyStatusResponse` types to a sensible home (co-located with the component that uses them, or `lib/api/user.ts` if they mirror an API shape).
4. **stats** (785 lines) — extract `StatCard`, `SnapshotRow`, `InsightCard` to `components/stats/`, switch `formatDuration`/`formatPercent` to `lib/format.ts`.
5. **subjects** list (333 lines) — extract sub-components, switch `formatDuration` to `lib/format.ts`.
6. **subjects/[id]/decks** (351 lines) — extract sub-components.
7. **subjects/[id]/flashcards** (477 lines) — extract sub-components, relocate `DraftCard` type.
8. **onboarding audit** (346 lines + `wizard-shell.tsx`) — confirm no inline clutter remains; extract anything found.
9. **dashboard** (977 lines) — extract `PomodoroRing` to `components/dashboard/pomodoro-ring.tsx`, switch to `lib/format.ts`, extract any other large inline JSX blocks.
10. **subjects/[id]** (1490 lines, done last) — extract `StatCard` (compare against `stats`' version, dedupe if identical), switch `formatDuration`/`shuffle` to `lib/`, extract the flashcard study/quiz state machine to `hooks/use-flashcard-quiz.ts`, extract the topic board (drag-and-drop columns) and study/quiz modals to `components/subjects-detail/`.
11. **standalone components cleanup** — `components/public-timer.tsx` (switch to `lib/format.ts`, drop its local `pad`/`formatTime`), `components/tutorial-guide.tsx` (move `getCardPlacement` to a `lib/` helper or a co-located file, relocate its interfaces).

Each phase ends with the page file re-read to confirm it's composition-only and under the ~150-line target (the two largest pages may reasonably land higher given the number of distinct interactive modes they host — the bar there is "no inline helpers/schemas/duplicate components," not a hard line count).
