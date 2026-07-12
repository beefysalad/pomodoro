# Onboarding UI Rework — Design

## Goal

Rework the visual design of the onboarding flow (`app/onboarding/page.tsx`) without changing its underlying steps, logic, or data flow. Two concrete complaints drive this:

1. The UI feels too cramped/dense — content sits directly on the background with no breathing room.
2. Every subject/topic creation fires a toast popup, which feels disruptive.

The 6 steps stay exactly as they are today: **Welcome → Subject → Topic → Timer → Features → Done**. All existing hooks (`useUser`, `useSubjects`, `useCreateSubject`, `useCreateTopic`, `useUpdateUser`), validation (`timerSchema`), and step-advancement rules (`onNext`, `onBack`, `completeOnboarding`) are unchanged. This is a presentation-layer rework, not a behavior change.

## Scope boundaries

- Stays within the existing design system (`docs/DESIGN-SYSTEM.md`): dark navy background, violet accent, Geist Mono, existing color tokens. No new palette or font.
- Step header icons stay as emoji (🚀 📚 🎯 ⏱️ 🌟 ✅) — not switched to lucide-react, despite the rest of the app using lucide. This is an intentional exception for onboarding's friendlier tone.
- Progress indicator stays a dot row (not pills/numbers, not a progress bar) — restyled only, not restructured.
- Layout paradigm stays a single-panel wizard (not a sidebar stepper, not split-screen with live preview).
- Toast removal is scoped to the onboarding page only. `app/subjects/page.tsx`, `app/subjects/[id]/page.tsx`, and `app/subjects/[id]/decks/page.tsx` keep their existing toast usage — out of scope for this change.

## File structure

Split the current single 864-line file into:

```
app/onboarding/page.tsx                        — orchestrator (state, mutations, step index, validation — mostly unchanged)
components/onboarding/wizard-shell.tsx         — outer panel, flow-message banner, progress dots, Back/Continue nav
components/onboarding/steps/welcome-step.tsx
components/onboarding/steps/subject-step.tsx
components/onboarding/steps/topic-step.tsx
components/onboarding/steps/timer-step.tsx
components/onboarding/steps/features-step.tsx
components/onboarding/steps/done-step.tsx
components/onboarding/inline-feedback.tsx      — small reusable success-flash used by subject-step and topic-step
```

`page.tsx` renders `<WizardShell>` and passes the active step's component + the props each step needs (form values, handlers, loading state). Each step component is self-contained and only receives what it uses — no shared giant props blob.

`QuickStat` (used only in welcome-step) and `TimerField` (used only in timer-step) move into their respective step files as local helpers, same as today.

## Visual rework

**Content panel.** Currently step content renders directly on the page's gradient background with no bounding container. Wrap the active step in:

```
rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-8 sm:p-12
```

This matches the card language used elsewhere (dashboard, subjects) but with more generous padding, appropriate for a single-focus screen.

**Spacing rhythm.** Increase internal spacing from `space-y-6` to `space-y-8`/`space-y-10` between icon badge → heading → subtext → step content, on every step.

**Touch targets / density fixes per step:**
- *Welcome*: larger `QuickStat` cards, more gap between them.
- *Subject / Topic*: separate the input+button row from the "already added" chips into distinct sub-sections with real vertical spacing (today they crowd together immediately below the input).
- *Timer*: `TimerField` padding increases from `px-3 py-2.5` to more generous padding; grid gap increases.
- *Features*: grid gap increases from `gap-3` to `gap-4`, card padding from `p-4` to `p-5`/`p-6`.
- *Done*: the two CTA cards get more padding and gap between them.

**Progress dots.** Same dot-row indicator and same active/completed/upcoming states, just larger with more spacing and a slightly stronger glow on the active dot. No structural change (still bottom-of-page, still a plain row).

## Feedback rework (toast removal)

Today, `onCreateSubject`/`onCreateTopic` call `toast.success(...)` then immediately `setStep(n+1)` — the toast is the only confirmation the user sees before the screen changes, since the auto-advance happens right away.

New behavior:
- **Success**: show `<InlineFeedback>` — a small checkmark that scales/fades in next to the input (framer-motion) — then advance to the next step after a ~450ms delay (`setTimeout` before `setStep`) instead of advancing instantly. No toast.
- **Error**: reuse the existing amber `flowMessage` banner (already rendered above the step content, already used for validation messages like "Create your first subject to continue") instead of `toast.error`. `onCreateSubject`/`onCreateTopic` set `flowMessage` on failure the same way `onNext`/`completeOnboarding` already do.
- The `sonner` import and `toast` calls are removed from `app/onboarding/page.tsx` entirely. `<Toaster>` itself (used by other pages) is untouched.

## Testing

No new automated tests required — this is a presentation-layer rework, not new business logic. Manual verification: walk through all 6 steps in a browser, confirm no toast appears on subject/topic creation, confirm the panel/spacing changes render correctly, confirm existing Playwright tests (`authenticated-flow.spec.ts`, which drives the Subject/Topic onboarding steps) still pass — those tests only assert on button/input text and headings, which are unchanged, so they should continue to pass unmodified.
