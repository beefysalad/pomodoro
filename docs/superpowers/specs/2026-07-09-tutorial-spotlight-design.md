# Tutorial Spotlight Rework — Design

## Goal

Replace the current product-tour visuals in `components/tutorial-guide.tsx` with a real spotlight tour: the background gets genuinely blurred/dimmed, and the specific element being explained is highlighted with a glowing ring instead of the whole page just being uniformly dimmed with no element targeting.

## Current state

`TutorialGuide` walks 4 page-level steps (Dashboard, Stats, Leaderboard, Subjects) as the user navigates between routes. Today it only renders a flat `bg-slate-950/45` dim layer over the whole screen (no blur) plus a text card fixed at the bottom describing the page in general — it never highlights any specific element.

The codebase already has ~20 `id="tutorial-*"` markers scattered across `app/dashboard/page.tsx`, `app/subjects/page.tsx`, `app/subjects/[id]/page.tsx`, `app/leaderboard/page.tsx`, `app/stats/page.tsx`, and `components/app-header.tsx` — clearly scaffolded for a richer per-element tour that was never wired up. None of these ids are referenced anywhere today.

## Scope

Keep the same 4 steps (Dashboard, Stats, Leaderboard, Subjects) and their existing copy/next-route logic in `PAGE_STEPS`. Do not expand to the other ~15 unused tutorial-ids on this pass — that's a larger follow-up. This pass is specifically: fix the visual mechanism (real blur + real element highlighting) using the steps that already exist.

Each step gets one specific element to highlight (a `targetId` field added to `TutorialPageStep`):

| Step | targetId | Element |
|---|---|---|
| Dashboard | `tutorial-modes` | The Blitz/Focus/Deep mode picker |
| Stats | `tutorial-stats-graph` | The main stats graph |
| Leaderboard | `tutorial-leaderboard-overview` | The rank overview badge |
| Subjects | `tutorial-subject-list` | The subject list |

## Visual mechanism: four-box blur + glow ring

Instead of CSS `clip-path`/`mask` (finicky cross-browser for dynamic cutouts), use the standard "four-box" spotlight technique: four independently-positioned `<div>`s (top/bottom/left/right strips) that together tile the entire viewport *except* the target element's measured bounding box. Each strip carries `backdrop-blur-md` plus a dark tint (`bg-slate-950/55` or similar). The uncovered rectangle in the middle — the target element — is untouched: fully sharp, undimmed.

A separate absolutely-positioned bordered box is drawn exactly around that same rectangle (with a few pixels of padding and rounded corners) carrying a glowing violet ring (`box-shadow` glow, consistent with `docs/DESIGN-SYSTEM.md`'s existing glow language — the same visual treatment already used for primary buttons and active states elsewhere in the app), so the highlighted element reads as "spotlit" rather than just "a gap in the fog."

Rect math for the four strips, given `rect = target.getBoundingClientRect()` and viewport `{ vw, vh }`:
- Top strip: `top: 0, left: 0, width: vw, height: rect.top`
- Bottom strip: `top: rect.bottom, left: 0, width: vw, height: vh - rect.bottom`
- Left strip: `top: rect.top, left: 0, width: rect.left, height: rect.height`
- Right strip: `top: rect.top, left: rect.right, width: vw - rect.right, height: rect.height`

## Components

- **`components/tutorial-spotlight.tsx`** (new) — takes a `targetId: string`, finds the element via `document.getElementById`, measures it with `getBoundingClientRect()` on mount and re-measures on `resize`/`scroll` (throttled via `requestAnimationFrame`), and renders the four blur strips + the glow ring positioned around the measured rect. If the element isn't found (not yet mounted, or the id doesn't exist on the current page), it renders nothing — the step degrades gracefully to just the info card with no spotlight rather than crashing or showing a broken highlight.
- **`components/tutorial-guide.tsx`** (reworked) — `TutorialPageStep` gains a `targetId` field (the four values in the table above). Renders `<TutorialSpotlight targetId={currentStep.targetId} />` plus the existing info card, but the card's position is now computed relative to the target's measured rect (see below) instead of being fixed at the bottom of the screen.
- **`components/tutorial-auto-start.tsx`** — unchanged. Still just decides when to mount `TutorialGuide`.

## Adaptive card positioning

Given the target's rect and the viewport size, and an estimated max card height (~220px, since the card's content — icon/step-counter, title, description, progress dots, button — is short and bounded), decide placement in this order:
1. Below the target, if `viewport.height - rect.bottom > estimatedCardHeight + margin`
2. Above the target, if `rect.top > estimatedCardHeight + margin`
3. To the side with more room (left or right), if either has enough horizontal space
4. Fallback: centered near the bottom of the screen (today's current behavior), if none of the above fit — this also covers the case where `TutorialSpotlight` found no target at all

Horizontal position within "below"/"above" placements: centered under/over the target if there's room, clamped to stay within the viewport with a small margin (don't let the card overflow off-screen on narrow viewports).

This uses an estimated height rather than a measure-then-reposition two-pass render, to avoid layout flicker — the card's content is short and predictable enough that this doesn't need pixel-perfect placement.

## Interaction model (unchanged from today)

The spotlight overlay does not block clicks to the underlying page outside the card (matches today's `pointer-events-none` wrapper behavior) — a user can still interact with the highlighted element or navigate away manually if they want, the tour doesn't lock the page down. Only the card itself captures clicks.

## Testing

No new automated test framework — this repo has no component/unit test setup (only Playwright e2e, and the tutorial only shows for authenticated, not-yet-tutorial-seen users, which the existing e2e suite doesn't cover). Verification is `npx tsc --noEmit`, `npm run lint`, and a manual/scripted visual check (equivalent to how the onboarding rework's Task 10 verified visuals via a temporary preview route, given no Clerk test user is configured in this environment).
