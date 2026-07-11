# Frontend rules audit (2026-07-11)

Punch list of existing code that violates the frontend rules added to `CLAUDE.md` and `docs/DESIGN-SYSTEM.md` §5 in commit `f9bc134`. Nothing here has been fixed yet — this is a to-do list for whenever these areas get touched next, or for a dedicated cleanup pass.

## 1. Data fetching (must use axios + TanStack Query, never `fetch()`/`useEffect`)

**2 files violate this:**

- `app/settings/page.tsx` — raw `fetch()` inside `useEffect` for Spotify status/disconnect calls.
- `app/spotify-poc/page.tsx` — same pattern. This is a debug/POC page, not a real user-facing route (see `CLAUDE.md`), so lower priority.

**Fix:** extract `lib/api/spotify.ts` (wrapping the shared `axios` instance) + `hooks/use-spotify.ts` (TanStack Query `useQuery`/`useMutation`), matching every other domain's three-layer pattern.

## 2. Prefer shadcn/ui over hand-rolled components

**1 clear inconsistency found:**

- `app/subjects/[id]/page.tsx:728` hand-rolls a full custom modal (`<div className="fixed inset-0 z-[80] ...">` with its own header/close button) for the flashcard study/quiz modals (rendered via `components/subjects-detail/flashcard-study-modal.tsx` / `flashcard-quiz-modal.tsx`) — while the **same file** correctly uses the shared `Dialog` component for its "Add topic" modal (`app/subjects/[id]/page.tsx:338`).

**Fix:** migrate the study/quiz modal wrapper to `Dialog`/`DialogContent` for consistency within the same file.

**Not flagged (legitimate custom overlays, not dialogs):** `components/dashboard/focus-mode-overlay.tsx` and `components/tutorial-spotlight.tsx` also use `fixed inset-0`, but these are full-viewport takeovers / a tutorial spotlight, not a dialog pattern — no fix needed.

## 3. Centralize styling in shared `components/ui/*` instead of one-off page values

**Biggest finding.** The "glass card" treatment `border-white/10 bg-white/[0.0X]` appears **67 times across 31 files**:

| Value | Count |
|---|---|
| `border-white/10 bg-white/[0.05]` | 36 |
| `border-white/10 bg-white/[0.04]` | 15 |
| `border-white/10 bg-white/[0.03]` | 14 |
| `border-white/10 bg-white/[0.02]` | 2 |

`components/ui/card.tsx` has **no variant system** for this at all (unlike `components/ui/badge.tsx`, which already implements variants correctly via `cva`). Every page and most feature components re-type this by hand instead of using a shared variant.

Files affected (31): `app/dashboard/page.tsx`, `app/leaderboard/page.tsx`, `app/not-found.tsx`, `app/settings/page.tsx`, `app/spotify-poc/page.tsx`, `app/stats/page.tsx`, `app/subjects/[id]/decks/page.tsx`, `app/subjects/[id]/flashcards/page.tsx`, `app/subjects/[id]/page.tsx`, `app/subjects/page.tsx`, `components/dashboard/session-rating-panel.tsx`, `components/leaderboard/global-leaderboard-row.tsx`, `components/leaderboard/weekly-leaderboard-row.tsx`, `components/onboarding/steps/subject-step.tsx`, `components/onboarding/steps/timer-step.tsx`, `components/onboarding/steps/topic-step.tsx`, `components/onboarding/wizard-shell.tsx`, `components/public-timer.tsx`, `components/settings/spotify-connection-card.tsx`, `components/settings/timer-settings-form.tsx`, `components/stats/insight-card.tsx`, `components/stats/snapshot-row.tsx`, `components/stats/stat-card.tsx`, `components/subjects-decks/deck-card.tsx`, `components/subjects-detail/flashcard-quiz-modal.tsx`, `components/subjects-detail/flashcard-study-modal.tsx`, `components/subjects-detail/stat-card.tsx`, `components/subjects-detail/topic-board.tsx`, `components/subjects-flashcards/bulk-import-card.tsx`, `components/subjects-flashcards/deck-choice-step.tsx`, `components/subjects-flashcards/draft-card-editor.tsx`, `components/subjects/subject-card.tsx`.

**Fix:** add a `variant` prop to `Card` (e.g. a `glass` variant, possibly with the 3-4 opacity levels as sub-variants or a single canonical one) and replace the 31 call sites.

### Secondary, lower-volume finding: raw font-weight literals

~10 scattered raw `font-[700]` / `font-[900]` / `font-[800]` / `font-[600]` / `font-[500]` literals (mostly `app/not-found.tsx` and a few `components/onboarding/steps/*` files) that should map to the typography scale already defined in `docs/DESIGN-SYSTEM.md` §2, rather than being written as one-off arbitrary values. Lower priority than the card pattern above.

## Suggested order

1. `Card` `glass` variant + the 31-file migration (highest impact — this is the whole reason the rule was added).
2. Study/quiz modal → `Dialog` migration in `app/subjects/[id]/page.tsx`.
3. Spotify `lib/api`/`hooks` extraction (small, isolated, but touches auth-adjacent code — test carefully).
4. Font-weight literals → typography scale (cosmetic, do opportunistically).
