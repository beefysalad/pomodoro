# Tutorial Spotlight Rework Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the flat, non-targeted dim overlay in `components/tutorial-guide.tsx` with a real spotlight tour — genuine background blur, and a glowing highlight ring around the specific element each step explains, with the info card positioned adaptively near it.

**Architecture:** A new `components/tutorial-spotlight.tsx` exports a `useTutorialTargetRect` hook (measures a target element's bounding box, re-measuring on resize/scroll) and a `TutorialSpotlight` component (renders four blur/dim strips tiling the screen around that rect, plus a glow ring). `components/tutorial-guide.tsx` is reworked to use both: each of the existing 4 steps gains a `targetId`, and the info card's position is computed from the same measured rect instead of being fixed at the bottom of the screen.

**Tech Stack:** Next.js 16 App Router, React, TypeScript, Tailwind CSS 4. No new dependencies.

## Global Constraints

- Keep the same 4 existing steps (Dashboard, Stats, Leaderboard, Subjects) and their existing copy/next-route logic — do not add, remove, or reorder steps, and do not touch the other ~15 unused `tutorial-*` ids elsewhere in the codebase.
- Step → target mapping (exact, from the approved spec): Dashboard → `tutorial-modes`, Stats → `tutorial-stats-graph`, Leaderboard → `tutorial-leaderboard-overview`, Subjects → `tutorial-subject-list`.
- Blur mechanism must be the four-box technique (four strips tiling the screen around the target's rect, each with `backdrop-blur-md` + dark tint) — not CSS `clip-path`/`mask`.
- The highlighted rectangle itself must be visually marked with a glowing ring (violet, matching `docs/DESIGN-SYSTEM.md`'s existing glow language), not just left as an unstyled gap.
- If the target element isn't found (`document.getElementById` returns null), render no spotlight for that step — degrade gracefully to just the info card, do not throw or show a broken highlight.
- Card position must adapt to the target's location (below → above → side → centered-bottom fallback, in that preference order) using an estimated card height, not a two-pass measure-then-reposition render.
- The overlay must not block clicks to the underlying page outside the card (`pointer-events-none` on the outer wrapper, `pointer-events-auto` only on the card itself) — matches today's existing behavior.
- No new dependencies. No new automated test framework — this repo has no component/unit test setup (only Playwright e2e, which doesn't cover the tutorial since it's gated behind auth + `hasSeenTutorial`). Verification is `npx tsc --noEmit`, `npm run lint`, and a manual/scripted visual check.

---

### Task 1: `TutorialSpotlight` component + `useTutorialTargetRect` hook

**Files:**
- Create: `components/tutorial-spotlight.tsx`

**Interfaces:**
- Produces: `useTutorialTargetRect(targetId: string): TutorialRect | null` and `TutorialSpotlight({ rect: TutorialRect | null })`, both used by Task 2's rework of `components/tutorial-guide.tsx`. `TutorialRect` (exported type) is `{ top: number; left: number; right: number; bottom: number; width: number; height: number }` — already padded by 8px beyond the raw element bounds, so consumers (Task 2's card-placement math) can use it directly without re-applying padding.

- [ ] **Step 1: Write the component**

```tsx
'use client'

import { useLayoutEffect, useState } from 'react'

export interface TutorialRect {
  top: number
  left: number
  right: number
  bottom: number
  width: number
  height: number
}

const SPOTLIGHT_PADDING = 8

export function useTutorialTargetRect(targetId: string): TutorialRect | null {
  const [rect, setRect] = useState<TutorialRect | null>(null)

  useLayoutEffect(() => {
    let frame: number | null = null

    const measure = () => {
      const el = document.getElementById(targetId)
      if (!el) {
        setRect(null)
        return
      }
      const box = el.getBoundingClientRect()
      setRect({
        top: box.top - SPOTLIGHT_PADDING,
        left: box.left - SPOTLIGHT_PADDING,
        right: box.right + SPOTLIGHT_PADDING,
        bottom: box.bottom + SPOTLIGHT_PADDING,
        width: box.width + SPOTLIGHT_PADDING * 2,
        height: box.height + SPOTLIGHT_PADDING * 2,
      })
    }

    const scheduleMeasure = () => {
      if (frame !== null) return
      frame = requestAnimationFrame(() => {
        frame = null
        measure()
      })
    }

    measure()
    window.addEventListener('resize', scheduleMeasure)
    window.addEventListener('scroll', scheduleMeasure, true)

    return () => {
      window.removeEventListener('resize', scheduleMeasure)
      window.removeEventListener('scroll', scheduleMeasure, true)
      if (frame !== null) cancelAnimationFrame(frame)
    }
  }, [targetId])

  return rect
}

interface TutorialSpotlightProps {
  rect: TutorialRect | null
}

const STRIP_CLASS =
  'fixed bg-slate-950/55 backdrop-blur-md transition-all duration-300'

export function TutorialSpotlight({ rect }: TutorialSpotlightProps) {
  if (!rect || typeof window === 'undefined') return null

  const vw = window.innerWidth
  const vh = window.innerHeight

  return (
    <div className="pointer-events-none fixed inset-0 z-[100]">
      {/* Top strip */}
      <div
        className={STRIP_CLASS}
        style={{ top: 0, left: 0, width: vw, height: Math.max(0, rect.top) }}
      />
      {/* Bottom strip */}
      <div
        className={STRIP_CLASS}
        style={{
          top: rect.bottom,
          left: 0,
          width: vw,
          height: Math.max(0, vh - rect.bottom),
        }}
      />
      {/* Left strip */}
      <div
        className={STRIP_CLASS}
        style={{
          top: rect.top,
          left: 0,
          width: Math.max(0, rect.left),
          height: rect.height,
        }}
      />
      {/* Right strip */}
      <div
        className={STRIP_CLASS}
        style={{
          top: rect.top,
          left: rect.right,
          width: Math.max(0, vw - rect.right),
          height: rect.height,
        }}
      />
      {/* Glow ring around the spotlit element */}
      <div
        className="absolute rounded-2xl border-2 border-violet-400/70 shadow-[0_0_24px_rgba(167,139,250,0.55)]"
        style={{
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        }}
      />
    </div>
  )
}
```

Note: `useLayoutEffect` (not `useEffect`) is used deliberately, to measure and position the spotlight before the browser paints — avoiding a visible flash of the fallback/centered position before snapping to the correct spot. This is safe here despite the usual Next.js SSR warning about `useLayoutEffect`, because `TutorialGuide` (Task 2) is only ever rendered client-side after `useUser()` data resolves (see `components/tutorial-auto-start.tsx`), so this component never participates in server rendering.

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors mentioning `tutorial-spotlight.tsx`

- [ ] **Step 3: Commit**

```bash
git add components/tutorial-spotlight.tsx
git commit -m "feat: add TutorialSpotlight component with four-box blur + glow ring"
```

---

### Task 2: Rework `components/tutorial-guide.tsx`

**Files:**
- Modify: `components/tutorial-guide.tsx` (full rewrite)

**Interfaces:**
- Consumes: `useTutorialTargetRect`, `TutorialSpotlight`, `type TutorialRect` from `@/components/tutorial-spotlight` (Task 1).
- Produces: `TutorialGuide({ onComplete: () => void })` — same public interface as today, so `components/tutorial-auto-start.tsx` (which renders `<TutorialGuide onComplete={handleComplete} />`) needs no changes.

This task adds a `targetId` field to each of the 4 existing `PAGE_STEPS` entries (using the exact mapping from Global Constraints), replaces the fixed-bottom card position with `getCardPlacement()` (below → above → side → centered-bottom fallback), and renders `<TutorialSpotlight rect={rect} />` instead of the old flat `bg-slate-950/45` overlay div. The step data (title/description/nextRoute/nextLabel), the progress dots, the step-counter badge, and the Next/Finish button logic are otherwise unchanged from today.

- [ ] **Step 1: Write the reworked component**

Replace the entire contents of `components/tutorial-guide.tsx` with:

```tsx
'use client'

import { useMemo } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { X, ChevronRight } from 'lucide-react'
import {
  TutorialSpotlight,
  useTutorialTargetRect,
  type TutorialRect,
} from '@/components/tutorial-spotlight'

interface TutorialPageStep {
  route: string
  title: string
  description: string
  targetId: string
  nextRoute?: string
  nextLabel?: string
}

const PAGE_STEPS: TutorialPageStep[] = [
  {
    route: '/dashboard',
    title: 'Dashboard',
    description:
      'Run focus sessions here. Choose a mode, pick your subject + topic, then start the timer.',
    targetId: 'tutorial-modes',
    nextRoute: '/stats',
    nextLabel: 'Go to Stats',
  },
  {
    route: '/stats',
    title: 'Stats',
    description:
      'Review streaks, level progress, session volume, and where your time goes.',
    targetId: 'tutorial-stats-graph',
    nextRoute: '/leaderboard',
    nextLabel: 'Go to Leaderboard',
  },
  {
    route: '/leaderboard',
    title: 'Leaderboard',
    description:
      'Benchmark your cadence with global XP and weekly session rankings.',
    targetId: 'tutorial-leaderboard-overview',
    nextRoute: '/subjects',
    nextLabel: 'Go to Subjects',
  },
  {
    route: '/subjects',
    title: 'Subjects',
    description:
      'Organize study areas. Open a subject to manage topics, workflows, and flashcards.',
    targetId: 'tutorial-subject-list',
  },
]

const CARD_MAX_WIDTH = 380
const CARD_HEIGHT_ESTIMATE = 220
const CARD_MARGIN = 16

interface CardPlacement {
  top: number
  left: number
  width: number
}

function getCardPlacement(rect: TutorialRect | null): CardPlacement {
  if (typeof window === 'undefined') {
    return { top: 0, left: 0, width: CARD_MAX_WIDTH }
  }

  const vw = window.innerWidth
  const vh = window.innerHeight
  const width = Math.min(CARD_MAX_WIDTH, vw - CARD_MARGIN * 2)

  let top: number
  let left: number

  if (!rect) {
    top = vh - CARD_HEIGHT_ESTIMATE - CARD_MARGIN
    left = (vw - width) / 2
  } else {
    const roomBelow = vh - rect.bottom
    const roomAbove = rect.top
    const roomRight = vw - rect.right
    const roomLeft = rect.left

    if (roomBelow > CARD_HEIGHT_ESTIMATE + CARD_MARGIN) {
      top = rect.bottom + CARD_MARGIN
      left = rect.left + rect.width / 2 - width / 2
    } else if (roomAbove > CARD_HEIGHT_ESTIMATE + CARD_MARGIN) {
      top = rect.top - CARD_HEIGHT_ESTIMATE - CARD_MARGIN
      left = rect.left + rect.width / 2 - width / 2
    } else if (roomRight > width + CARD_MARGIN) {
      top = rect.top + rect.height / 2 - CARD_HEIGHT_ESTIMATE / 2
      left = rect.right + CARD_MARGIN
    } else if (roomLeft > width + CARD_MARGIN) {
      top = rect.top + rect.height / 2 - CARD_HEIGHT_ESTIMATE / 2
      left = rect.left - width - CARD_MARGIN
    } else {
      top = vh - CARD_HEIGHT_ESTIMATE - CARD_MARGIN
      left = (vw - width) / 2
    }
  }

  left = Math.min(Math.max(left, CARD_MARGIN), vw - width - CARD_MARGIN)
  top = Math.min(Math.max(top, CARD_MARGIN), vh - CARD_HEIGHT_ESTIMATE - CARD_MARGIN)

  return { top, left, width }
}

interface TutorialGuideProps {
  onComplete: () => void
}

export function TutorialGuide({ onComplete }: TutorialGuideProps) {
  const pathname = usePathname()
  const router = useRouter()

  const currentStep = useMemo(
    () => PAGE_STEPS.find((step) => step.route === pathname),
    [pathname]
  )

  const rect = useTutorialTargetRect(currentStep?.targetId ?? '')
  const cardPlacement = useMemo(() => getCardPlacement(rect), [rect])

  if (!currentStep) return null

  const handleNext = () => {
    if (currentStep.nextRoute) {
      router.push(currentStep.nextRoute)
      return
    }
    onComplete()
  }

  return (
    <>
      <TutorialSpotlight rect={rect} />

      <div
        className="pointer-events-none fixed z-[101]"
        style={{ top: cardPlacement.top, left: cardPlacement.left }}
      >
        <div
          className="pointer-events-auto rounded-3xl border border-white/10 bg-[#0f172a] p-6 shadow-2xl"
          style={{ width: cardPlacement.width }}
        >
          <div className="mb-4 flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400">
              <div className="text-lg font-bold">
                {PAGE_STEPS.findIndex((step) => step.route === pathname) + 1}
              </div>
            </div>
            <button
              onClick={onComplete}
              className="rounded-full p-1 text-slate-500 transition-colors hover:bg-white/5 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <h3 className="mb-2 text-xl font-bold text-white">
            {currentStep.title}
          </h3>
          <p className="mb-6 text-sm leading-relaxed text-slate-400">
            {currentStep.description}
          </p>

          <div className="flex items-center justify-between gap-4">
            <div className="flex gap-1.5">
              {PAGE_STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    PAGE_STEPS[i].route === pathname
                      ? 'w-6 bg-cyan-400'
                      : PAGE_STEPS.findIndex((step) => step.route === pathname) >
                          i
                        ? 'w-1.5 bg-cyan-400/50'
                        : 'w-1.5 bg-white/10'
                  }`}
                />
              ))}
            </div>

            <Button
              onClick={handleNext}
              className="rounded-xl bg-cyan-500 px-6 py-6 font-bold text-white shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:bg-cyan-400"
            >
              {currentStep.nextLabel ?? 'Finish'}
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors mentioning `tutorial-guide.tsx` or `tutorial-spotlight.tsx`

- [ ] **Step 3: Verify `components/tutorial-auto-start.tsx` needs no changes**

Run: `grep -n "TutorialGuide" components/tutorial-auto-start.tsx`
Expected: `import { TutorialGuide } from './tutorial-guide'` and `return <TutorialGuide onComplete={handleComplete} />` — confirms the call site still matches `TutorialGuide`'s unchanged public prop interface (`{ onComplete: () => void }`), so this file needs no edits.

- [ ] **Step 4: Commit**

```bash
git add components/tutorial-guide.tsx
git commit -m "refactor: wire TutorialGuide onto TutorialSpotlight with adaptive card placement"
```

---

### Task 3: Full verification

**Files:** none (verification only)

- [ ] **Step 1: Full typecheck**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: 0 errors (pre-existing unrelated warnings in `app/api/subjects/route.ts` are fine)

- [ ] **Step 3: Scripted visual check**

The tutorial only renders for an authenticated, onboarded user who hasn't seen it yet (`components/tutorial-auto-start.tsx`), and this environment has no configured Clerk test user, so it can't be reached by simply signing in. Verify visually instead via a temporary, unauthenticated preview route (not part of the final diff):

1. Create a throwaway `app/dev-preview-tutorial/page.tsx` that renders a page with all 4 target elements present (simple divs with the exact 4 target ids — `tutorial-modes`, `tutorial-stats-graph`, `tutorial-leaderboard-overview`, `tutorial-subject-list` — spaced out across the page at different positions, e.g. top, middle, bottom, and one narrow/off to the side) plus `<TutorialGuide onComplete={() => {}} />` forced to a specific step by temporarily hardcoding `usePathname()`'s expected route match (simplest: instead of relying on the real pathname, render each of the 4 `PAGE_STEPS`' card+spotlight combinations directly against one of the fake target elements by temporarily duplicating/parameterizing — whatever's simplest to get one visual per target on screen).
2. Start the dev server, use Playwright to navigate to the throwaway route and take screenshots showing: the blur strips are visibly blurring the background, the glow ring is tightly and correctly positioned around each fake target element (not offset, not covering the wrong area), and the card lands beside/above/below the target sensibly for at least one case where the target is near the top of the viewport (forcing the "place below" branch) and one near the bottom (forcing the "place above" or "fallback centered" branch).
3. View the screenshots to confirm the above.
4. Delete the throwaway preview page before finishing — it must not be part of the final diff.

- [ ] **Step 4: If any of steps 1-3 surface a real problem in the actual tutorial code (not the throwaway preview page itself), fix it, re-run the relevant check, and commit the fix. If nothing needs fixing, do not touch any already-committed files.**

```bash
# Only if a fix was needed:
git add components/tutorial-spotlight.tsx components/tutorial-guide.tsx
git commit -m "fix: address issue found during tutorial spotlight verification"
```

(Skip the commit entirely if no fix was needed.)
