# Frontend rules audit (2026-07-11, updated 2026-07-12)

Punch list of existing code that violates the frontend rules added to `CLAUDE.md` and `docs/DESIGN-SYSTEM.md` §5 in commit `f9bc134`. This is a to-do list for whenever these areas get touched next, or for a dedicated cleanup pass.

**Status: item 3's card-body pattern is fixed** (see note in that section). Items 1, 2, and the font-weight/interactive-surface findings below are still open.

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

### 3a. Card-body "glass" pattern — ✅ FIXED (2026-07-12)

The "glass card" treatment `border-white/10 bg-white/[0.0X]` (bracket syntax) appeared **67 times across 31 files**, in 4 tiers:

| Value | Count | Role |
|---|---|---|
| `border-white/10 bg-white/[0.05]` | 36 | Primary page-level `Card` body |
| `bg-white/[0.04]` | 15 | Secondary panel (raw `div`/`section`) |
| `bg-white/[0.03]` | 14 | Tertiary/nested row |
| `bg-white/[0.02]` | 2 | Empty-state placeholder (paired with dashed border) |

**Fix applied:** added a 4-tier glass ramp to `app/globals.css` (`--glass`/`--glass-soft`/`--glass-subtle`/`--glass-empty`, exposed as `bg-glass`/`bg-glass-soft`/`bg-glass-subtle`/`bg-glass-empty`), mirroring the existing `--surface`/`--surface-up`/`--surface-hi` ramp. `components/ui/card.tsx`'s default now bakes in `bg-glass border-white/10` (every real usage wanted this, confirmed before changing it), so the ~36 `Card` call sites no longer repeat it at all. The 0.04/0.03/0.02 tiers, mostly on plain `div`/`section` elements rather than `Card`, were swapped to the matching semantic class in place — no forced `Card`-wrapping, per the original plan. All 31 files migrated, verified with lint/tsc/prettier/unit tests (38/38) and the `public-timer` e2e suite; the authenticated e2e suite couldn't run (no Clerk test credentials in this environment, same known gap as the prior refactor) so give the dashboard/subjects/stats/settings/leaderboard pages a visual pass in a real browser before merging.

### 3b. New finding: pervasive `bg-white/N` shorthand pattern (not yet fixed)

While migrating 3a, found a **much larger sibling pattern** using Tailwind's shorthand opacity syntax (`bg-white/5`, not the bracket `bg-white/[0.05]`) — **60+ instances across nearly every file** — used for a completely different role: input field backgrounds, ghost/secondary button backgrounds, `Badge` backgrounds, `Progress` track backgrounds, and the dashboard mode-selector's active/hover states. Common values seen: `bg-white/5`, `bg-white/6`, `bg-white/8`, `bg-white/10`, `bg-white/12`, `bg-white/14`.

This is a distinct design-system layer from the Card-body glass ramp (different semantic role: interactive-element surface vs. card-body surface), even though `bg-white/5` happens to equal the same 5% as `bg-glass`. Not fixed as part of 3a — treating it as its own item to avoid conflating two different UI roles that happen to share a numeric coincidence at one tier.

**Suggested fix (not yet designed):** likely a second small ramp — e.g. `--surface-input`/`--surface-input-hover` or similar — for `Input`/`Button` (ghost/outline variants)/`Badge`/`Progress` to consume as their default styling, the same way `Card` now consumes `--glass`. Needs its own quick audit of exact tiers (5/6/8/10/12/14 don't obviously map to 4 clean levels the way the card pattern did) before designing the tokens.

### Secondary, lower-volume finding: raw font-weight literals

~10 scattered raw `font-[700]` / `font-[900]` / `font-[800]` / `font-[600]` / `font-[500]` literals (mostly `app/not-found.tsx` and a few `components/onboarding/steps/*` files) that should map to the typography scale already defined in `docs/DESIGN-SYSTEM.md` §2, rather than being written as one-off arbitrary values. Lower priority than the card pattern above.

## Suggested order

1. ~~`Card` `glass` variant + the 31-file migration~~ — done 2026-07-12.
2. Study/quiz modal → `Dialog` migration in `app/subjects/[id]/page.tsx`.
3. Spotify `lib/api`/`hooks` extraction (small, isolated, but touches auth-adjacent code — test carefully).
4. Audit + fix the `bg-white/N` interactive-surface pattern (3b above) — likely bigger than the card fix, needs its own tier analysis first.
5. Font-weight literals → typography scale (cosmetic, do opportunistically).
