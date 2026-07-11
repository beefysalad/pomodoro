# Frontend Component/Page Separation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every `app/**/page.tsx` file composition-only (imports, hooks, JSX) by relocating inline Zod schemas, inline formatting helpers, and inline sub-components into `lib/` and `components/<route-name>/`, per `docs/superpowers/specs/2026-07-11-frontend-component-page-separation-design.md`.

**Architecture:** Pure code-motion refactor, no behavior change. Each task moves existing, working code verbatim into a new file, adds an import at the old call site, and verifies nothing broke via lint + typecheck + the relevant test (Playwright where coverage exists, manual dev-server smoke check otherwise).

**Tech Stack:** Next.js 16 App Router, TypeScript, Zod, TanStack Query, Playwright.

## Global Constraints

- No behavior changes — same UI, same data flow, same hooks/`lib/api` layer. If you notice a real bug while moving code, leave a one-line comment noting it and move on; do not fix it as part of this refactor.
- One component per file, kebab-case filename, named export matching the component's PascalCase name (matches `components/ui/*` convention).
- Page-specific components live in `components/<route-name>/` (nested routes flatten with a hyphen, e.g. `app/subjects/[id]/decks` → `components/subjects-decks/`).
- Every Zod schema lives in `lib/schemas/<domain>.ts`, never inline in a page/component.
- After every task: run `npm run lint`, run `npx tsc --noEmit -p tsconfig.json`, and run the verification step listed in that task. All must be clean before committing.
- Commit after each task with a `refactor:` prefixed message. Do not amend previous commits.

---

### Task 1: Shared formatting/utility foundations

**Files:**
- Create: `lib/format.ts`
- Create: `lib/shuffle.ts`

**Interfaces:**
- Produces: `formatClock(seconds: number): string` — `"MM:SS"`, used by dashboard timer + public timer.
- Produces: `formatDuration(totalSeconds: number): string` — `"Xh Ym"` or `"Xm"`, used by stats/subjects/subjects-detail/leaderboard.
- Produces: `formatPercent(value: number): string` — `"NN%"`, used by stats.
- Produces: `shuffle<T>(items: T[]): T[]` — Fisher-Yates, non-mutating, used by subjects-detail quiz mode.

This task only creates the shared files. Later tasks delete the duplicate inline copies from each page/component and import from here.

- [ ] **Step 1: Create `lib/format.ts`**

```ts
function pad(value: number) {
  return String(value).padStart(2, '0')
}

export function formatClock(seconds: number) {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${pad(mins)}:${pad(secs)}`
}

export function formatDuration(totalSeconds: number) {
  const totalMinutes = Math.floor(totalSeconds / 60)
  if (totalMinutes < 60) return `${totalMinutes}m`
  const hours = Math.floor(totalMinutes / 60)
  const mins = totalMinutes % 60
  return `${hours}h ${mins}m`
}

export function formatPercent(value: number) {
  return `${Math.round(value)}%`
}
```

- [ ] **Step 2: Create `lib/shuffle.ts`**

```ts
export function shuffle<T>(items: T[]) {
  const list = [...items]
  for (let i = list.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[list[i], list[j]] = [list[j], list[i]]
  }
  return list
}
```

- [ ] **Step 3: Verify**

Run: `npm run lint && npx tsc --noEmit -p tsconfig.json`
Expected: both exit 0 with no output (these are new, unused-so-far files — lint must still pass clean).

- [ ] **Step 4: Commit**

```bash
git add lib/format.ts lib/shuffle.ts
git commit -m "refactor: add shared lib/format.ts and lib/shuffle.ts"
```

---

### Task 2: Migrate `app/leaderboard/page.tsx`

**Files:**
- Modify: `app/leaderboard/page.tsx` (currently 190 lines)
- Create: `components/leaderboard/` — one file per extracted sub-component (exact names depend on what's found; see Step 1)

**Interfaces:**
- Consumes: `formatDuration` from `lib/format.ts` (Task 1).

- [ ] **Step 1: Inventory what to extract**

Run: `grep -n "^function\|^const.*=.*(props\|=> {$" app/leaderboard/page.tsx`

Read the full file. Identify: (a) the inline `formatMinutes` function (delete it — replaced by `formatDuration(minutes * 60)` at every call site), (b) any JSX block repeated via `.map(...)` that renders a leaderboard row/card — if it's more than ~15 lines of JSX, extract it to `components/leaderboard/<name>.tsx` as its own component taking typed props (no `any`).

- [ ] **Step 2: Delete the inline `formatMinutes` function**

Remove the function definition. At every call site that called `formatMinutes(minutes)`, replace with `formatDuration(minutes * 60)`. Add the import:

```ts
import { formatDuration } from '@/lib/format'
```

- [ ] **Step 3: Extract identified sub-components**

For each component identified in Step 1, create `components/leaderboard/<kebab-name>.tsx` with a named export, move the JSX block in verbatim (adjusting only prop destructuring), and replace the inline JSX in `page.tsx` with `<ComponentName {...props} />` plus an import line.

- [ ] **Step 4: Verify**

Run: `npm run lint && npx tsc --noEmit -p tsconfig.json`
Expected: clean.

Run: `npx playwright test tests/authenticated-flow.spec.ts -g leaderboard` if such a test exists; otherwise start the dev server (`npm run dev`) and visually confirm `/leaderboard` renders identically to before (ranks, badges, durations all display the same).

- [ ] **Step 5: Commit**

```bash
git add app/leaderboard/page.tsx components/leaderboard/
git commit -m "refactor: extract leaderboard page components, dedupe duration formatting"
```

---

### Task 3: Migrate `app/settings/page.tsx`

**Files:**
- Modify: `app/settings/page.tsx` (currently 401 lines)
- Modify: `lib/schemas/user.ts` (add the timer settings form schema)
- Create: `components/settings/setting-field.tsx`
- Create: `components/settings/` — additional files for the timer form block and Spotify connection block if they are each a distinct, sizeable JSX chunk (see Step 1)

**Interfaces:**
- Produces (in `lib/schemas/user.ts`): `TimerSettingsFormSchema`, `type TimerSettingsFormInput = z.input<typeof TimerSettingsFormSchema>`, `type TimerSettingsFormValues = z.output<typeof TimerSettingsFormSchema>`.
- Produces: `SettingField` component — read its current inline prop signature (`grep -n "function SettingField" -A 10 app/settings/page.tsx`) and preserve it exactly.

- [ ] **Step 1: Move the Zod schema**

The current inline schema (`app/settings/page.tsx`, defined right after the imports) is:

```ts
const timerSchema = z
  .object({
    blitzMinutes: z.preprocess(
      (val) => (val === '' ? undefined : Number(val)),
      z.number().int().min(5).max(120)
    ),
    focusMinutes: z.preprocess(
      (val) => (val === '' ? undefined : Number(val)),
      z.number().int().min(10).max(180)
    ),
    deepMinutes: z.preprocess(
      (val) => (val === '' ? undefined : Number(val)),
      z.number().int().min(15).max(240)
    ),
    shortBreakMinutes: z.preprocess(
      (val) => (val === '' ? undefined : Number(val)),
      z.number().int().min(1).max(30)
    ),
    longBreakMinutes: z.preprocess(
      (val) => (val === '' ? undefined : Number(val)),
      z.number().int().min(5).max(60)
    ),
  })
  .superRefine((data, ctx) => {
    if (data.longBreakMinutes < data.shortBreakMinutes) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Long break should be greater than or equal to short break.',
        path: ['longBreakMinutes'],
      })
    }
  })
```

Move it into `lib/schemas/user.ts`, renamed `TimerSettingsFormSchema`, placed below the existing `UpdateUserSchemaApi`:

```ts
export const TimerSettingsFormSchema = z
  .object({
    blitzMinutes: z.preprocess(
      (val) => (val === '' ? undefined : Number(val)),
      z.number().int().min(5).max(120)
    ),
    focusMinutes: z.preprocess(
      (val) => (val === '' ? undefined : Number(val)),
      z.number().int().min(10).max(180)
    ),
    deepMinutes: z.preprocess(
      (val) => (val === '' ? undefined : Number(val)),
      z.number().int().min(15).max(240)
    ),
    shortBreakMinutes: z.preprocess(
      (val) => (val === '' ? undefined : Number(val)),
      z.number().int().min(1).max(30)
    ),
    longBreakMinutes: z.preprocess(
      (val) => (val === '' ? undefined : Number(val)),
      z.number().int().min(5).max(60)
    ),
  })
  .superRefine((data, ctx) => {
    if (data.longBreakMinutes < data.shortBreakMinutes) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Long break should be greater than or equal to short break.',
        path: ['longBreakMinutes'],
      })
    }
  })

export type TimerSettingsFormInput = z.input<typeof TimerSettingsFormSchema>
export type TimerSettingsFormValues = z.output<typeof TimerSettingsFormSchema>
```

In `app/settings/page.tsx`, delete the inline schema and the two `type TimerFormInput`/`type TimerFormValues` aliases, and import instead:

```ts
import {
  TimerSettingsFormSchema,
  type TimerSettingsFormInput,
  type TimerSettingsFormValues,
} from '@/lib/schemas/user'
```

Update every reference to `timerSchema` → `TimerSettingsFormSchema`, `TimerFormInput` → `TimerSettingsFormInput`, `TimerFormValues` → `TimerSettingsFormValues` in the rest of the page.

- [ ] **Step 2: Extract `SettingField`**

Read the current definition: `grep -n "function SettingField" -A 30 app/settings/page.tsx`. Create `components/settings/setting-field.tsx` with that function moved verbatim (as a named export `SettingField`), including its prop type/interface. Add `'use client'` at the top only if the original file has it and the component uses hooks/event handlers directly (check before adding — don't add it unnecessarily). Delete the inline definition from `page.tsx` and add:

```ts
import { SettingField } from '@/components/settings/setting-field'
```

- [ ] **Step 3: Extract the Spotify status types and connection block**

Read: `grep -n "SpotifyStatusResponse\|SpotifyStatus\b" -A 15 app/settings/page.tsx`. If `SpotifyStatus`/`SpotifyStatusResponse` mirror an API response shape, move them to `lib/api/user.ts` next to the existing user interface (co-locate with the fetch wrapper that returns this shape) — otherwise keep them next to the component that uses them. If the Spotify connect/disconnect JSX block is a distinct, sizeable chunk (roughly 20+ lines), extract it to `components/settings/spotify-connection-card.tsx` as its own component with explicit props, and replace the inline JSX with `<SpotifyConnectionCard ... />`.

- [ ] **Step 4: Extract the timer settings form block**

If the `react-hook-form` timer form JSX (labels, inputs, submit button, driven by `TimerSettingsFormValues`) is a distinct block separate from the rest of the page, extract it to `components/settings/timer-settings-form.tsx`, taking the form's `register`/`handleSubmit`/`errors` (or the whole `useForm` return) as props, or — if simpler and self-contained — moving the `useForm` call itself inside the new component and having it accept an `onSubmit` callback prop. Prefer whichever keeps `page.tsx` thinnest without duplicating the `useUpdateUser`/`useUser` hook calls.

- [ ] **Step 5: Verify**

Run: `npm run lint && npx tsc --noEmit -p tsconfig.json`
Expected: clean.

Start `npm run dev`, navigate to `/settings`, confirm: timer fields load with current values, editing and saving a value works (triggers the update mutation), validation error for `longBreakMinutes < shortBreakMinutes` still shows, and the Spotify connect/disconnect button still reflects connection status.

- [ ] **Step 6: Commit**

```bash
git add app/settings/page.tsx lib/schemas/user.ts components/settings/ lib/api/user.ts
git commit -m "refactor: extract settings page schema, SettingField, and form components"
```

---

### Task 4: Migrate `app/stats/page.tsx`

**Files:**
- Modify: `app/stats/page.tsx` (currently 785 lines)
- Create: `components/stats/stat-card.tsx`
- Create: `components/stats/snapshot-row.tsx`
- Create: `components/stats/insight-card.tsx`

**Interfaces:**
- Consumes: `formatDuration`, `formatPercent` from `lib/format.ts` (Task 1).
- Produces: `StatCard`, `SnapshotRow`, `InsightCard` — read exact current prop signatures before moving (`grep -n "function StatCard\|function SnapshotRow\|function InsightCard" -A 15 app/stats/page.tsx`) and preserve them exactly, since Task 10 (`subjects/[id]`) will compare its own `StatCard` against this one.

- [ ] **Step 1: Delete inline `formatDuration`/`formatPercent`, import from `lib/format.ts`**

Remove both function definitions from `app/stats/page.tsx`. Add:

```ts
import { formatDuration, formatPercent } from '@/lib/format'
```

- [ ] **Step 2: Extract `StatCard`, `SnapshotRow`, `InsightCard`**

For each, read its full current definition, create the corresponding file in `components/stats/` with a named export matching the component name and its exact prop type, move the code verbatim, and replace the inline definition in `page.tsx` with an import:

```ts
import { StatCard } from '@/components/stats/stat-card'
import { SnapshotRow } from '@/components/stats/snapshot-row'
import { InsightCard } from '@/components/stats/insight-card'
```

- [ ] **Step 3: Verify**

Run: `npm run lint && npx tsc --noEmit -p tsconfig.json`
Expected: clean.

Start `npm run dev`, navigate to `/stats`, confirm all charts, stat cards, weekly snapshot rows, and insight cards render with the same data/layout as before.

- [ ] **Step 4: Commit**

```bash
git add app/stats/page.tsx components/stats/
git commit -m "refactor: extract stats page components, dedupe duration/percent formatting"
```

---

### Task 5: Migrate `app/subjects/page.tsx`

**Files:**
- Modify: `app/subjects/page.tsx` (currently 333 lines)
- Create: `components/subjects/` — one file per extracted sub-component

**Interfaces:**
- Consumes: `formatDuration` from `lib/format.ts` (Task 1).

- [ ] **Step 1: Delete inline `formatDuration`, import from `lib/format.ts`**

```ts
import { formatDuration } from '@/lib/format'
```

- [ ] **Step 2: Inventory and extract sub-components**

Run: `grep -n "^function\|=> {$" app/subjects/page.tsx` and read the full file. Extract any subject-card/list-row JSX block over ~15 lines to `components/subjects/<kebab-name>.tsx` with typed props, replacing the inline JSX with the imported component.

- [ ] **Step 3: Verify**

Run: `npm run lint && npx tsc --noEmit -p tsconfig.json`
Expected: clean.

Start `npm run dev`, navigate to `/subjects`, confirm the subject list, create/edit/delete/reorder flows all still work.

- [ ] **Step 4: Commit**

```bash
git add app/subjects/page.tsx components/subjects/
git commit -m "refactor: extract subjects list page components"
```

---

### Task 6: Migrate `app/subjects/[id]/decks/page.tsx`

**Files:**
- Modify: `app/subjects/[id]/decks/page.tsx` (currently 351 lines)
- Create: `components/subjects-decks/` — one file per extracted sub-component

- [ ] **Step 1: Inventory and extract**

Run: `grep -n "^function\|=> {$" "app/subjects/[id]/decks/page.tsx"` and read the full file. This page had no inline helpers/schemas in the audit, so the work here is purely extracting oversized inline JSX blocks (deck cards, create/edit dialogs) into `components/subjects-decks/<kebab-name>.tsx` with typed props.

- [ ] **Step 2: Verify**

Run: `npm run lint && npx tsc --noEmit -p tsconfig.json`
Expected: clean.

Start `npm run dev`, navigate to a subject's decks page, confirm deck list, create, edit, and delete all still work.

- [ ] **Step 3: Commit**

```bash
git add "app/subjects/[id]/decks/page.tsx" components/subjects-decks/
git commit -m "refactor: extract subjects decks page components"
```

---

### Task 7: Migrate `app/subjects/[id]/flashcards/page.tsx`

**Files:**
- Modify: `app/subjects/[id]/flashcards/page.tsx` (currently 477 lines)
- Create: `components/subjects-flashcards/` — one file per extracted sub-component

**Interfaces:**
- Produces/relocates: `DraftCard` type — read its current definition (`grep -n "type DraftCard" -A 10 "app/subjects/[id]/flashcards/page.tsx"`) and co-locate it with whichever component ends up owning the draft-card editing UI (or with `lib/api/flashcards.ts` if it mirrors the API shape).

- [ ] **Step 1: Relocate `DraftCard`**

Read the type definition and its usages. If it's only used by one extracted component, move it into that component's file and export it. If used by multiple, put it in a small co-located file, e.g. `components/subjects-flashcards/draft-card.ts` (no `'use client'`, it's a type-only file), and import it from both.

- [ ] **Step 2: Inventory and extract remaining sub-components**

Run: `grep -n "^function\|=> {$" "app/subjects/[id]/flashcards/page.tsx"` and read the full file. Extract the card-editing form block and any card-preview JSX into `components/subjects-flashcards/<kebab-name>.tsx`.

- [ ] **Step 3: Verify**

Run: `npm run lint && npx tsc --noEmit -p tsconfig.json`
Expected: clean.

Start `npm run dev`, navigate to a subject's flashcard creation page, confirm adding/editing/removing draft cards and saving the deck all still work.

- [ ] **Step 4: Commit**

```bash
git add "app/subjects/[id]/flashcards/page.tsx" components/subjects-flashcards/
git commit -m "refactor: extract flashcard creation page components"
```

---

### Task 8: Audit `app/onboarding/page.tsx` and `components/onboarding/wizard-shell.tsx`

**Files:**
- Modify: `app/onboarding/page.tsx` (currently 346 lines) — only if clutter is found
- Modify: `components/onboarding/wizard-shell.tsx` — only if clutter is found

- [ ] **Step 1: Audit**

Run: `grep -n "^function\|^const.*=.*(\|^interface\|^type \|z\.object" app/onboarding/page.tsx components/onboarding/wizard-shell.tsx`. The prior audit found only the page's own top-level component and `WizardShell`'s own `WizardShellProps` interface (expected — that's the component's own prop type, not clutter). If nothing beyond the page/component's own definition and imports from `components/onboarding/steps/*` shows up, no extraction is needed.

- [ ] **Step 2: If clutter is found**

Apply the same pattern as prior tasks: schemas → `lib/schemas/`, helpers → `lib/`, sub-components → `components/onboarding/`.

- [ ] **Step 3: Verify**

Run: `npm run lint && npx tsc --noEmit -p tsconfig.json`
Expected: clean.

Run: `npx playwright test tests/authenticated-flow.spec.ts -g onboarding` (this file already exercises `/onboarding` — confirm it passes; if no test name matches, run the whole file: `npx playwright test tests/authenticated-flow.spec.ts`).

- [ ] **Step 4: Commit (only if changes were made)**

```bash
git add app/onboarding/page.tsx components/onboarding/
git commit -m "refactor: extract remaining onboarding page clutter"
```

If no clutter was found in Step 1, skip the commit and note in your task summary that this page was already clean.

---

### Task 9: Migrate `app/dashboard/page.tsx`

**Files:**
- Modify: `app/dashboard/page.tsx` (currently 977 lines)
- Create: `components/dashboard/pomodoro-ring.tsx`
- Create: `components/dashboard/` — additional files for any other oversized inline JSX blocks found (see Step 3)

**Interfaces:**
- Consumes: `formatClock` from `lib/format.ts` (Task 1).
- Produces: `PomodoroRing` — read its exact current props (`grep -n "function PomodoroRing" -A 15 app/dashboard/page.tsx`) and preserve them exactly.

- [ ] **Step 1: Delete inline `pad`/`formatClock`, import from `lib/format.ts`**

Remove both function definitions. Add:

```ts
import { formatClock } from '@/lib/format'
```

Note: `DEFAULT_TIMER_MINUTES`, `DEV_TIMER_MINUTES`, and the `BREAK_SECONDS` helper are timer-configuration constants, not formatting helpers — leave them in `page.tsx` unless the timer config already lives in `contexts/timer-context.tsx`/`lib/progression.ts` per CLAUDE.md's documented mode-definitions duplication (check both files first; if `DEFAULT_TIMER_MINUTES`/`DEV_TIMER_MINUTES` duplicate what's already in `lib/progression.ts`, that's a separate pre-existing issue — do not fold it into this task, note it in your task summary instead).

- [ ] **Step 2: Extract `PomodoroRing`**

Read its full current definition, create `components/dashboard/pomodoro-ring.tsx` with a named export and its exact prop type, move the code verbatim, and replace the inline definition with:

```ts
import { PomodoroRing } from '@/components/dashboard/pomodoro-ring'
```

- [ ] **Step 3: Inventory and extract remaining oversized JSX blocks**

Run: `grep -n "^function\|=> {$" app/dashboard/page.tsx` and read the full file (977 lines — read it in two halves via the `offset`/`limit` params of your Read tool if needed). Identify remaining large inline JSX regions (e.g. a session-history list, a mode-selector control, a rating/feedback panel shown at the end of a session). Extract each to `components/dashboard/<kebab-name>.tsx` with typed props.

- [ ] **Step 4: Verify**

Run: `npm run lint && npx tsc --noEmit -p tsconfig.json`
Expected: clean.

Run: `npx playwright test tests/authenticated-flow.spec.ts` (covers `/dashboard`) — must pass. Also start `npm run dev`, run a full Blitz-mode timer session end-to-end (start → let it finish or fast-forward if the codebase has a dev-mode fast timer per `DEV_TIMER_MINUTES` → rate the session), confirming XP/streak update and the ring animation still renders correctly.

- [ ] **Step 5: Commit**

```bash
git add app/dashboard/page.tsx components/dashboard/
git commit -m "refactor: extract dashboard page components, dedupe clock formatting"
```

---

### Task 10: Migrate `app/subjects/[id]/page.tsx` (largest, done last)

**Files:**
- Modify: `app/subjects/[id]/page.tsx` (currently 1490 lines)
- Create: `components/subjects-detail/stat-card.tsx` (or reuse `components/stats/stat-card.tsx` — see Step 2)
- Create: `components/subjects-detail/topic-board.tsx`
- Create: `components/subjects-detail/flashcard-study-modal.tsx`
- Create: `components/subjects-detail/flashcard-quiz-modal.tsx`
- Create: `hooks/use-flashcard-quiz.ts`

**Interfaces:**
- Consumes: `formatDuration` from `lib/format.ts`, `shuffle` from `lib/shuffle.ts` (Task 1).
- Produces: `useFlashcardQuiz(...)` hook — signature determined in Step 3 based on the actual current state variables (see below); once defined here, no other task depends on it.

- [ ] **Step 1: Delete inline `formatDuration`/`shuffle`, import from `lib/`**

```ts
import { formatDuration } from '@/lib/format'
import { shuffle } from '@/lib/shuffle'
```

Leave `getNow` (`const getNow = () => Date.now()`) in place unless it's trivially inlined at its one call site — check its usage count first with `grep -n "getNow()" "app/subjects/[id]/page.tsx"`; if used only once, inline `Date.now()` there and delete the alias.

- [ ] **Step 2: Extract or dedupe `StatCard`**

Read the current definition: `grep -n "function StatCard" -A 15 "app/subjects/[id]/page.tsx"`. Compare it against `components/stats/stat-card.tsx` (created in Task 4) field-for-field (props, JSX structure, styling classes). If identical, delete the inline copy here and import the shared one:

```ts
import { StatCard } from '@/components/stats/stat-card'
```

If it differs in props or rendering, it's a distinct component — create `components/subjects-detail/stat-card.tsx` instead, and name it distinctly if needed to avoid confusion (e.g. `TopicStatCard`) — pick whichever name matches what it actually renders (topic-level stats vs. account-level stats).

- [ ] **Step 3: Extract the flashcard study/quiz state machine into `hooks/use-flashcard-quiz.ts`**

Read the full block of state and handlers driving study/quiz mode — from the audit, this includes at least: `studyIndex`, `showAnswer`, `isStudyOpen`, `isQuizOpen`, `testActive`, `testItems`, `testIndex`, `testScore`, `testResponses`, `quizTimeLeft`, `quizSecondsPerQuestion`, plus their setters and any `useEffect`s that drive the quiz countdown timer. Run `grep -n "studyIndex\|showAnswer\|isStudyOpen\|isQuizOpen\|testActive\|testItems\|testIndex\|testScore\|testResponses\|quizTimeLeft\|quizSecondsPerQuestion" "app/subjects/[id]/page.tsx"` to find every read/write site.

Move this state, its setters, and every handler function that only touches this state (e.g. `startStudy`, `startQuiz`, `submitAnswer`, `nextQuestion`, `endQuiz` — use whatever names the current handlers have) into `hooks/use-flashcard-quiz.ts`, exported as a single hook, e.g.:

```ts
export function useFlashcardQuiz(flashcards: Flashcard[]) {
  // ...moved state and handlers...
  return {
    studyIndex,
    showAnswer,
    isStudyOpen,
    isQuizOpen,
    testActive,
    testItems,
    testIndex,
    testScore,
    testResponses,
    quizTimeLeft,
    quizSecondsPerQuestion,
    // ...moved handlers (exact names preserved from the current page)...
  }
}
```

Use the exact current parameter/return shape you find during extraction — do not rename fields the JSX already depends on, since the JSX in `page.tsx` stays as-is and just destructures from this hook's return value instead of local state. In `page.tsx`, replace the moved `useState`/`useEffect` declarations with:

```ts
const {
  studyIndex,
  showAnswer,
  isStudyOpen,
  isQuizOpen,
  testActive,
  testItems,
  testIndex,
  testScore,
  testResponses,
  quizTimeLeft,
  quizSecondsPerQuestion,
  // ...handlers...
} = useFlashcardQuiz(flashcards)
```

(adjust the `flashcards` argument to whatever the current handlers actually close over — check for other variables the moved code reads, like the deck's card list or `Topic` id, and pass them in as additional hook parameters).

- [ ] **Step 4: Extract the topic board (drag-and-drop columns) into `components/subjects-detail/topic-board.tsx`**

The remaining state (`draggingTopicId`, `activeDropStatus`, `dragPreview`, `transparentDragImage`, `topicStats`) and its JSX (the drag-and-drop column layout) becomes `components/subjects-detail/topic-board.tsx`. Decide during extraction whether the drag state lives inside the new component (preferred — it's presentation-driven state, not shared elsewhere) or is passed down as props; prefer moving the state into the component itself since nothing else in the page reads `draggingTopicId`/`activeDropStatus`/`dragPreview` outside the board UI (verify with `grep -n "draggingTopicId\|activeDropStatus\|dragPreview" "app/subjects/[id]/page.tsx"` before deciding).

- [ ] **Step 5: Extract the study and quiz modals**

Move the study-mode modal JSX to `components/subjects-detail/flashcard-study-modal.tsx` and the quiz-mode modal JSX to `components/subjects-detail/flashcard-quiz-modal.tsx`, each taking the relevant slice of `useFlashcardQuiz`'s return value as props.

- [ ] **Step 6: Verify**

Run: `npm run lint && npx tsc --noEmit -p tsconfig.json`
Expected: clean.

Start `npm run dev`, navigate to a subject detail page, and manually exercise: dragging a topic between status columns, opening study mode and flipping through cards, opening quiz mode and completing a full quiz (checking the score/timer still work), and deleting a topic. Confirm every flow behaves identically to before the refactor.

- [ ] **Step 7: Commit**

```bash
git add "app/subjects/[id]/page.tsx" components/subjects-detail/ hooks/use-flashcard-quiz.ts components/stats/stat-card.tsx
git commit -m "refactor: extract subject detail page's topic board, quiz state, and stat card"
```

---

### Task 11: Clean up `components/public-timer.tsx` and `components/tutorial-guide.tsx`

**Files:**
- Modify: `components/public-timer.tsx` (currently 444 lines)
- Modify: `components/tutorial-guide.tsx` (currently 203 lines)
- Create: `lib/tutorial-placement.ts` (or co-located file — see Step 2)

- [ ] **Step 1: `public-timer.tsx` — delete inline `pad`/`formatTime`, import `formatClock`**

```ts
import { formatClock } from '@/lib/format'
```

Replace every call to the deleted local `formatTime(...)` with `formatClock(...)` (identical behavior — both format `MM:SS`). Leave the `Mode` type and `MODE_CONFIG` constant in place; they're specific to this component, not duplicated elsewhere.

- [ ] **Step 2: `tutorial-guide.tsx` — relocate `getCardPlacement`**

Read the current function: `grep -n "function getCardPlacement" -A 30 components/tutorial-guide.tsx`, plus its `CardPlacement`/`TutorialRect` type dependencies. Move it to `lib/tutorial-placement.ts` as a named export, along with the `CardPlacement` type (import `TutorialRect` from wherever it's currently defined — check `components/tutorial-spotlight.tsx`, which already exports `useTutorialTargetRect` and likely the `TutorialRect` type). Import it back into `tutorial-guide.tsx`:

```ts
import { getCardPlacement, type CardPlacement } from '@/lib/tutorial-placement'
```

Leave `TutorialPageStep` and `TutorialGuideProps` interfaces in place — they're this component's own prop/config types, not extractable clutter.

- [ ] **Step 3: Verify**

Run: `npm run lint && npx tsc --noEmit -p tsconfig.json`
Expected: clean.

Run: `npx playwright test tests/public-timer.spec.ts` — must pass (covers the public timer on `/`). For the tutorial guide, start `npm run dev`, trigger the onboarding tutorial (or whatever flow shows `TutorialGuide`), and confirm the spotlight card still positions itself correctly relative to its target element.

- [ ] **Step 4: Commit**

```bash
git add components/public-timer.tsx components/tutorial-guide.tsx lib/tutorial-placement.ts
git commit -m "refactor: dedupe clock formatting and relocate tutorial placement helper"
```
