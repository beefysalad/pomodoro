# Onboarding UI Rework Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rework the visual design of `app/onboarding/page.tsx` (more breathing room, defined content panel, no toast popups) without changing its 6 steps or any business logic.

**Architecture:** Split the current 864-line single-file page into an orchestrator (`app/onboarding/page.tsx`, keeps all state/mutations/validation) + a presentational shell (`components/onboarding/wizard-shell.tsx`) + one component per step (`components/onboarding/steps/*.tsx`) + a small reusable success-flash component (`components/onboarding/inline-feedback.tsx`) that replaces the `sonner` toast calls.

**Tech Stack:** Next.js 16 App Router, React, TypeScript, Tailwind CSS 4, framer-motion, react-hook-form + zod, lucide-react. No new dependencies.

## Global Constraints

- Stay within `docs/DESIGN-SYSTEM.md` tokens (dark navy background, violet accent, Geist Mono, existing color classes) — no new palette or font.
- Step header icons stay emoji (🚀 📚 🎯 ⏱️ 🌟 ✅) — do not switch to lucide-react.
- Progress indicator stays a dot row, restyled only (larger, more spacing, glow on active) — no numbered pills, no progress bar.
- Layout stays a single-panel wizard — no sidebar stepper, no split-screen preview.
- Toast removal is scoped to `app/onboarding/page.tsx` only. Do not touch `app/subjects/page.tsx`, `app/subjects/[id]/page.tsx`, or `app/subjects/[id]/decks/page.tsx` — they keep their existing `sonner` toast usage.
- No new automated test framework — this repo has no component/unit test setup (only Playwright e2e). Verification per task is `npx tsc --noEmit`; final verification adds `npm run lint`, the existing Playwright suite, and a manual dev-server walkthrough.
- On success (subject/topic creation), show `<InlineFeedback>` for a beat, then advance via `setTimeout(..., 450)` — do not advance instantly, and do not use a toast.
- On failure (subject/topic creation), reuse the existing amber `flowMessage` banner pattern already used for step-validation errors — do not use a toast.

---

### Task 1: InlineFeedback component

**Files:**
- Create: `components/onboarding/inline-feedback.tsx`

**Interfaces:**
- Produces: `InlineFeedback({ show: boolean; label: string })` — a small pill that fades/scales in when `show` is true, used by Task 4 (SubjectStep) and Task 5 (TopicStep).

- [ ] **Step 1: Write the component**

```tsx
'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2 } from 'lucide-react'

interface InlineFeedbackProps {
  show: boolean
  label: string
}

export function InlineFeedback({ show, label }: InlineFeedbackProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.85, y: -4 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300"
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          {label}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors mentioning `inline-feedback.tsx`

- [ ] **Step 3: Commit**

```bash
git add components/onboarding/inline-feedback.tsx
git commit -m "feat: add InlineFeedback component for onboarding"
```

---

### Task 2: WizardShell component

**Files:**
- Create: `components/onboarding/wizard-shell.tsx`

**Interfaces:**
- Consumes: nothing from other new components (uses `Button` from `@/components/ui/button`, `UserButton` from `@clerk/nextjs`, icons from `lucide-react`).
- Produces: `WizardShell({ step, totalSteps, flowMessage, onBack, backDisabled, showNext, nextLabel, nextDisabled, onNext, children })` — the outer page chrome (background, header, flow-message banner, content panel, back/next nav, restyled progress dots). `children` is whatever step content the orchestrator (Task 9) renders inside the panel.

- [ ] **Step 1: Write the component**

```tsx
'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { UserButton } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'

interface WizardShellProps {
  step: number
  totalSteps: number
  flowMessage: string
  onBack: () => void
  backDisabled: boolean
  showNext: boolean
  nextLabel: string
  nextDisabled: boolean
  onNext: () => void
  children: React.ReactNode
}

export function WizardShell({
  step,
  totalSteps,
  flowMessage,
  onBack,
  backDisabled,
  showNext,
  nextLabel,
  nextDisabled,
  onNext,
  children,
}: WizardShellProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#070b16] text-slate-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.05),transparent_55%)]" />
        <div className="absolute -top-32 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-violet-600/16 blur-[160px]" />
        <div className="absolute right-[-120px] -bottom-32 h-[440px] w-[440px] rounded-full bg-cyan-500/12 blur-[160px]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-6 sm:px-6 lg:px-10">
        <header className="flex items-center justify-between">
          <div className="leading-none text-white">
            <span className="block text-lg font-black tracking-tight sm:text-xl">
              Tempo
            </span>
            <span className="mt-0.5 block text-[10px] font-semibold tracking-[0.14em] text-slate-400 uppercase">
              onboarding
            </span>
          </div>
          <UserButton
            appearance={{
              elements: { avatarBox: 'w-9 h-9 border border-violet-400/40' },
            }}
          />
        </header>

        <main className="flex flex-1 flex-col items-center justify-center py-10 sm:py-12">
          <div className="w-full max-w-4xl space-y-6 text-center">
            <AnimatePresence>
              {!!flowMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="mx-auto max-w-2xl rounded-full border border-amber-500/25 bg-amber-500/10 px-5 py-2 text-sm text-amber-200"
                >
                  {flowMessage}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 backdrop-blur-xl sm:p-12">
              {children}
            </div>

            <div className="flex items-center justify-center gap-3">
              <Button
                variant="outline"
                className="h-11 rounded-full border-white/15 bg-white/[0.04] px-6 text-slate-300 hover:bg-white/10 hover:text-white"
                onClick={onBack}
                disabled={backDisabled}
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>

              {showNext && (
                <Button
                  className="h-11 rounded-full bg-violet-600 px-8 text-sm font-semibold text-white shadow-[0_0_20px_rgba(124,58,237,0.35)] hover:bg-violet-500"
                  onClick={onNext}
                  disabled={nextDisabled}
                >
                  {nextLabel}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>

            <p className="text-center text-xs text-slate-600">
              Timer and preferences can be changed anytime in Settings.
            </p>
          </div>
        </main>

        <div className="pb-6">
          <div className="mx-auto flex items-center justify-center gap-2.5">
            {Array.from({ length: totalSteps }).map((_, index) => (
              <div
                key={`step-dot-${index}`}
                className={`h-2 rounded-full transition-all ${
                  index === step
                    ? 'w-9 bg-violet-400 shadow-[0_0_10px_rgba(167,139,250,0.55)]'
                    : index < step
                      ? 'w-3.5 bg-violet-400/60'
                      : 'w-3.5 bg-white/10'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors mentioning `wizard-shell.tsx`

- [ ] **Step 3: Commit**

```bash
git add components/onboarding/wizard-shell.tsx
git commit -m "feat: add WizardShell component for onboarding"
```

---

### Task 3: WelcomeStep component

**Files:**
- Create: `components/onboarding/steps/welcome-step.tsx`

**Interfaces:**
- Consumes: `getLevelFromXp` from `@/lib/progression`.
- Produces: `WelcomeStep({ totalXP: number; streak: number })`, used by Task 9 for `step === 0`.

- [ ] **Step 1: Write the component**

```tsx
'use client'

import { getLevelFromXp } from '@/lib/progression'

interface WelcomeStepProps {
  totalXP: number
  streak: number
}

export function WelcomeStep({ totalXP, streak }: WelcomeStepProps) {
  return (
    <div className="space-y-10">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl border border-violet-500/30 bg-violet-600/20 text-4xl">
        🚀
      </div>
      <div className="space-y-3">
        <h2 className="text-4xl font-black tracking-tight text-white sm:text-5xl">
          Welcome to Tempo
        </h2>
        <p className="mx-auto max-w-2xl text-sm text-slate-400 sm:text-base">
          Let&apos;s personalize your focus flow. We will set up subjects,
          topics, and your timer style in a minute.
        </p>
      </div>
      <div className="mx-auto grid max-w-3xl gap-4 sm:grid-cols-3">
        <QuickStat
          label="Level"
          value={`Lvl ${getLevelFromXp(totalXP)}`}
          icon="⚡"
          color="violet"
        />
        <QuickStat
          label="Streak"
          value={`${streak} days`}
          icon="🔥"
          color="orange"
        />
        <QuickStat label="XP" value={`${totalXP}`} icon="✨" color="cyan" />
      </div>
    </div>
  )
}

function QuickStat({
  label,
  value,
  icon,
  color,
}: {
  label: string
  value: string
  icon: string
  color: 'violet' | 'cyan' | 'orange' | 'emerald'
}) {
  const colorMap = {
    violet: 'from-violet-600/20 to-violet-900/10 border-violet-500/20',
    cyan: 'from-cyan-600/20 to-cyan-900/10 border-cyan-500/20',
    orange: 'from-orange-600/20 to-orange-900/10 border-orange-500/20',
    emerald: 'from-emerald-600/20 to-emerald-900/10 border-emerald-500/20',
  }
  return (
    <div
      className={`rounded-2xl border bg-gradient-to-br px-4 py-5 ${colorMap[color]}`}
    >
      <div className="mb-1.5 text-xl">{icon}</div>
      <p className="text-[10px] tracking-widest text-slate-500 uppercase">
        {label}
      </p>
      <p className="mt-0.5 text-xl font-black text-white">{value}</p>
    </div>
  )
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors mentioning `welcome-step.tsx`

- [ ] **Step 3: Commit**

```bash
git add components/onboarding/steps/welcome-step.tsx
git commit -m "feat: add WelcomeStep component for onboarding"
```

---

### Task 4: SubjectStep component

**Files:**
- Create: `components/onboarding/steps/subject-step.tsx`

**Interfaces:**
- Consumes: `InlineFeedback` from `@/components/onboarding/inline-feedback` (Task 1), `Button`/`Input` from `@/components/ui/*`.
- Produces: `SubjectStep({ subjects, hasSubject, newSubjectName, onChangeName, onSubmit, isPending, showFeedback })`, used by Task 9 for `step === 1`. `subjects` items only need `{ id: string; name: string }`.

- [ ] **Step 1: Write the component**

```tsx
'use client'

import { CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { InlineFeedback } from '@/components/onboarding/inline-feedback'

interface SubjectStepProps {
  subjects: Array<{ id: string; name: string }>
  hasSubject: boolean
  newSubjectName: string
  onChangeName: (value: string) => void
  onSubmit: () => void
  isPending: boolean
  showFeedback: boolean
}

export function SubjectStep({
  subjects,
  hasSubject,
  newSubjectName,
  onChangeName,
  onSubmit,
  isPending,
  showFeedback,
}: SubjectStepProps) {
  return (
    <div className="space-y-8">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-violet-500/30 bg-violet-600/20 text-2xl">
        📚
      </div>
      <div className="space-y-2">
        <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
          Create your first subject
        </h2>
        <p className="mx-auto max-w-2xl text-sm text-slate-400">
          Subjects are your big buckets. Think Math, Biology, or System
          Design.
        </p>
      </div>

      <div className="mx-auto w-full max-w-xl space-y-6">
        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
          <Input
            id="subject-name"
            value={newSubjectName}
            onChange={(e) => onChangeName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
            placeholder="e.g. Mathematics"
            className="h-14 border-white/10 bg-white/5 text-white placeholder:text-slate-600 focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20"
          />
          <Button
            onClick={onSubmit}
            disabled={!newSubjectName.trim() || isPending}
            className="h-14 rounded-xl bg-violet-600 px-6 font-semibold text-white hover:bg-violet-500"
          >
            Add subject
          </Button>
        </div>

        <div className="flex min-h-8 flex-wrap items-center justify-center gap-2">
          <InlineFeedback show={showFeedback} label="Subject created" />
          {hasSubject &&
            subjects.map((s) => (
              <span
                key={s.id}
                className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300"
              >
                <CheckCircle2 className="h-3 w-3" />
                {s.name}
              </span>
            ))}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors mentioning `subject-step.tsx`

- [ ] **Step 3: Commit**

```bash
git add components/onboarding/steps/subject-step.tsx
git commit -m "feat: add SubjectStep component for onboarding"
```

---

### Task 5: TopicStep component

**Files:**
- Create: `components/onboarding/steps/topic-step.tsx`

**Interfaces:**
- Consumes: `InlineFeedback` from `@/components/onboarding/inline-feedback` (Task 1), `Button`/`Input` from `@/components/ui/*`.
- Produces: `TopicStep({ subjects, resolvedSubjectId, onChangeSubject, newTopicName, onChangeName, onSubmit, isPending, showFeedback })`, used by Task 9 for `step === 2`.

- [ ] **Step 1: Write the component**

```tsx
'use client'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { InlineFeedback } from '@/components/onboarding/inline-feedback'

interface TopicStepProps {
  subjects: Array<{ id: string; name: string }>
  resolvedSubjectId: string
  onChangeSubject: (id: string) => void
  newTopicName: string
  onChangeName: (value: string) => void
  onSubmit: () => void
  isPending: boolean
  showFeedback: boolean
}

export function TopicStep({
  subjects,
  resolvedSubjectId,
  onChangeSubject,
  newTopicName,
  onChangeName,
  onSubmit,
  isPending,
  showFeedback,
}: TopicStepProps) {
  return (
    <div className="space-y-8">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-500/30 bg-cyan-600/20 text-2xl">
        🎯
      </div>
      <div className="space-y-2">
        <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
          Add your first topic
        </h2>
        <p className="mx-auto max-w-2xl text-sm text-slate-400">
          Keep topics small and concrete so each session feels like a win.
        </p>
      </div>

      <div className="mx-auto w-full max-w-xl space-y-5">
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <label className="block text-xs tracking-widest text-slate-500 uppercase">
            Subject
          </label>
          <select
            value={resolvedSubjectId}
            onChange={(e) => onChangeSubject(e.target.value)}
            className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white transition-all outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20"
            disabled={!subjects.length}
          >
            {!subjects.length ? (
              <option value="">No subjects yet</option>
            ) : (
              subjects.map((subject) => (
                <option
                  key={subject.id}
                  value={subject.id}
                  className="bg-slate-900 text-white"
                >
                  {subject.name}
                </option>
              ))
            )}
          </select>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
          <Input
            id="topic-name"
            value={newTopicName}
            onChange={(e) => onChangeName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
            placeholder="e.g. Derivatives basics"
            className="h-14 border-white/10 bg-white/5 text-white placeholder:text-slate-600 focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/20"
          />
          <Button
            onClick={onSubmit}
            disabled={!newTopicName.trim() || !resolvedSubjectId || isPending}
            className="h-14 rounded-xl bg-cyan-600 px-6 font-semibold text-white hover:bg-cyan-500"
          >
            Add topic
          </Button>
        </div>

        <div className="flex min-h-8 items-center justify-center">
          <InlineFeedback show={showFeedback} label="Topic created" />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors mentioning `topic-step.tsx`

- [ ] **Step 3: Commit**

```bash
git add components/onboarding/steps/topic-step.tsx
git commit -m "feat: add TopicStep component for onboarding"
```

---

### Task 6: TimerStep component (+ shared schema/types)

**Files:**
- Create: `components/onboarding/steps/timer-step.tsx`

**Interfaces:**
- Consumes: `Input` from `@/components/ui/input`; `FieldErrors`, `UseFormRegister`, `UseFormRegisterReturn` types from `react-hook-form`; `z` from `zod`.
- Produces:
  - `timerSchema` (zod schema, moved from `page.tsx` — this is now its only home)
  - `type TimerFormInput = z.input<typeof timerSchema>`
  - `type TimerFormValues = z.output<typeof timerSchema>`
  - `TimerStep({ register: UseFormRegister<TimerFormInput>; errors: FieldErrors<TimerFormInput>; watchedBlitz: number | string | undefined; watchedFocus: number | string | undefined; watchedDeep: number | string | undefined })`, used by Task 9 for `step === 3`. Task 9's `page.tsx` imports `timerSchema`, `TimerFormInput`, `TimerFormValues` from this file for its own `useForm` call.

- [ ] **Step 1: Write the component**

```tsx
'use client'

import { z } from 'zod'
import type {
  FieldErrors,
  UseFormRegister,
  UseFormRegisterReturn,
} from 'react-hook-form'
import { Input } from '@/components/ui/input'

export const timerSchema = z
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

export type TimerFormInput = z.input<typeof timerSchema>
export type TimerFormValues = z.output<typeof timerSchema>

const TIMER_MODES = [
  {
    key: 'blitz',
    label: 'Blitz',
    hint: '5–120 min',
    desc: 'Quick bursts',
    emoji: '⚡',
  },
  {
    key: 'focus',
    label: 'Focus',
    hint: '10–180 min',
    desc: 'Standard flow',
    emoji: '🎯',
  },
  {
    key: 'deep',
    label: 'Deep',
    hint: '15–240 min',
    desc: 'Deep work',
    emoji: '🧠',
  },
] as const

interface TimerStepProps {
  register: UseFormRegister<TimerFormInput>
  errors: FieldErrors<TimerFormInput>
  watchedBlitz: number | string | undefined
  watchedFocus: number | string | undefined
  watchedDeep: number | string | undefined
}

export function TimerStep({
  register,
  errors,
  watchedBlitz,
  watchedFocus,
  watchedDeep,
}: TimerStepProps) {
  return (
    <div className="space-y-8">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-600/20 text-2xl">
        ⏱️
      </div>
      <div className="space-y-2">
        <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
          Set your timer style
        </h2>
        <p className="mx-auto max-w-2xl text-sm text-slate-400">
          Match your session lengths to how you actually work. You can tweak
          these later in Settings.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        {TIMER_MODES.map((mode) => (
          <span
            key={mode.key}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-slate-200"
          >
            <span className="text-base">{mode.emoji}</span>
            {mode.label} · {mode.desc}
          </span>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <TimerField
          label="Blitz"
          hint="5–120 min"
          registration={register('blitzMinutes')}
          error={errors.blitzMinutes?.message}
        />
        <TimerField
          label="Focus"
          hint="10–180 min"
          registration={register('focusMinutes')}
          error={errors.focusMinutes?.message}
        />
        <TimerField
          label="Deep"
          hint="15–240 min"
          registration={register('deepMinutes')}
          error={errors.deepMinutes?.message}
        />
      </div>
      <p className="text-center text-[11px] text-slate-500">
        Preview: Blitz {String(watchedBlitz || '-')}m · Focus{' '}
        {String(watchedFocus || '-')}m · Deep {String(watchedDeep || '-')}m
      </p>
    </div>
  )
}

function TimerField({
  label,
  hint,
  registration,
  error,
}: {
  label: string
  hint: string
  registration: UseFormRegisterReturn
  error?: string
}) {
  return (
    <div className="space-y-2.5 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4">
      <label className="text-[10px] font-semibold tracking-[0.2em] text-slate-500 uppercase">
        {label}
      </label>
      <Input
        type="number"
        inputMode="numeric"
        placeholder={hint}
        {...registration}
        className="h-11 border-white/15 bg-white/5 text-white placeholder:text-slate-500 focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/15"
      />
      <p
        className={
          error ? 'text-[11px] text-rose-300' : 'text-[11px] text-slate-600'
        }
      >
        {error ?? hint}
      </p>
    </div>
  )
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors mentioning `timer-step.tsx`

- [ ] **Step 3: Commit**

```bash
git add components/onboarding/steps/timer-step.tsx
git commit -m "feat: add TimerStep component and shared timer schema for onboarding"
```

---

### Task 7: FeaturesStep component

**Files:**
- Create: `components/onboarding/steps/features-step.tsx`

**Interfaces:**
- Consumes: `motion`, `Variants` from `framer-motion`; icons from `lucide-react`.
- Produces: `FeaturesStep()` (no props), used by Task 9 for `step === 4`.

- [ ] **Step 1: Write the component**

```tsx
'use client'

import { motion, type Variants } from 'framer-motion'
import {
  Flame,
  GalleryVerticalEnd,
  LayersIcon,
  Rocket,
  Trophy,
  Zap,
} from 'lucide-react'

const FEATURES = [
  {
    icon: Zap,
    title: 'XP + Levels',
    description: 'Finish sessions to earn XP and level up over time.',
    color: 'from-yellow-500/20 to-orange-500/10 border-yellow-500/30',
    iconColor: 'text-yellow-400',
  },
  {
    icon: Flame,
    title: 'Daily Streak',
    description: 'Study every day to build momentum you can feel.',
    color: 'from-orange-500/20 to-red-500/10 border-orange-500/30',
    iconColor: 'text-orange-400',
  },
  {
    icon: Trophy,
    title: 'Achievements',
    description: 'Unlock milestones for consistency and deep focus.',
    color: 'from-amber-500/20 to-yellow-500/10 border-amber-500/30',
    iconColor: 'text-amber-400',
  },
  {
    icon: LayersIcon,
    title: 'Flashcard Decks',
    description:
      "Create decks per subject and quiz yourself anytime. Set up whenever you're ready.",
    color: 'from-violet-500/20 to-purple-500/10 border-violet-500/30',
    iconColor: 'text-violet-400',
    badge: 'New',
  },
  {
    icon: Rocket,
    title: 'Quests',
    description: 'Daily quests guide your next move for fast progress.',
    color: 'from-cyan-500/20 to-blue-500/10 border-cyan-500/30',
    iconColor: 'text-cyan-400',
  },
  {
    icon: GalleryVerticalEnd,
    title: 'Leaderboard',
    description: 'See where you stack up against other learners weekly.',
    color: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/30',
    iconColor: 'text-emerald-400',
  },
]

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.96 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { delay: i * 0.08, duration: 0.35, ease: 'easeOut' },
  }),
}

export function FeaturesStep() {
  return (
    <div className="space-y-8">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-purple-500/30 bg-purple-600/20 text-2xl">
        🌟
      </div>
      <div className="space-y-2">
        <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
          Here is what you can do
        </h2>
        <p className="mx-auto max-w-2xl text-sm text-slate-400">
          Tools that keep you consistent and make study feel lighter.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((feature, i) => (
          <motion.div
            key={feature.title}
            custom={i}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileHover={{ scale: 1.02, y: -2 }}
            className={`relative rounded-2xl border bg-gradient-to-br p-5 ${feature.color} cursor-default transition-shadow hover:shadow-[0_0_24px_rgba(0,0,0,0.3)]`}
          >
            {feature.badge && (
              <span className="absolute top-2.5 right-2.5 rounded-full border border-violet-400/40 bg-violet-500/30 px-2 py-0.5 text-[10px] font-bold text-violet-300">
                {feature.badge}
              </span>
            )}
            <feature.icon className={`mb-3 h-6 w-6 ${feature.iconColor}`} />
            <p className="mb-1.5 text-[15px] font-bold text-white">
              {feature.title}
            </p>
            <p className="text-[13px] leading-relaxed text-slate-400">
              {feature.description}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors mentioning `features-step.tsx`

- [ ] **Step 3: Commit**

```bash
git add components/onboarding/steps/features-step.tsx
git commit -m "feat: add FeaturesStep component for onboarding"
```

---

### Task 8: DoneStep component

**Files:**
- Create: `components/onboarding/steps/done-step.tsx`

**Interfaces:**
- Consumes: `Button` from `@/components/ui/button`, `ArrowRight` from `lucide-react`.
- Produces: `DoneStep({ canComplete: boolean; isPending: boolean; onStartSession: () => void; onOpenFlashcards: () => void })`, used by Task 9 for `step === 5`.

- [ ] **Step 1: Write the component**

```tsx
'use client'

import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface DoneStepProps {
  canComplete: boolean
  isPending: boolean
  onStartSession: () => void
  onOpenFlashcards: () => void
}

export function DoneStep({
  canComplete,
  isPending,
  onStartSession,
  onOpenFlashcards,
}: DoneStepProps) {
  return (
    <div className="space-y-10">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-violet-500/30 bg-violet-600/20 text-3xl">
        ✅
      </div>
      <div className="space-y-2">
        <h2 className="text-4xl font-black tracking-tight text-white">
          You are ready
        </h2>
        <p className="mx-auto max-w-2xl text-sm text-slate-400">
          Pick how you want to start. You can always switch later.
        </p>
      </div>
      <div className="mx-auto grid w-full max-w-4xl gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-violet-500/25 bg-violet-500/10 p-8 text-left">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-violet-500/30 bg-violet-600/20 text-xl">
            ⏱️
          </div>
          <h3 className="text-lg font-bold text-white">Run a Pomodoro</h3>
          <p className="mt-1 text-sm text-slate-400">
            Jump into the dashboard and start a focused session.
          </p>
          <Button
            onClick={onStartSession}
            disabled={!canComplete || isPending}
            className="mt-6 w-full rounded-full bg-violet-600 text-white hover:bg-violet-500"
          >
            Start a session
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-8 text-left">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-cyan-500/30 bg-cyan-600/20 text-xl">
            🧠
          </div>
          <h3 className="text-lg font-bold text-white">Study or Quiz</h3>
          <p className="mt-1 text-sm text-slate-400">
            Open a subject to review flashcards or take a quick quiz.
          </p>
          <Button
            onClick={onOpenFlashcards}
            disabled={!canComplete || isPending}
            className="mt-6 w-full rounded-full border border-violet-400/40 bg-violet-500/15 text-violet-100 hover:bg-violet-500/25"
          >
            Open flashcards
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors mentioning `done-step.tsx`

- [ ] **Step 3: Commit**

```bash
git add components/onboarding/steps/done-step.tsx
git commit -m "feat: add DoneStep component for onboarding"
```

---

### Task 9: Rewire `app/onboarding/page.tsx`

**Files:**
- Modify: `app/onboarding/page.tsx` (full rewrite)

**Interfaces:**
- Consumes: `WizardShell` (Task 2), `WelcomeStep` (Task 3), `SubjectStep` (Task 4), `TopicStep` (Task 5), `TimerStep` + `timerSchema` + `TimerFormInput` + `TimerFormValues` (Task 6), `FeaturesStep` (Task 7), `DoneStep` (Task 8).
- Produces: the page component itself — nothing else depends on it.

This task removes the `sonner` `toast` import and all `toast.success`/`toast.error` calls, replacing them with the `flowMessage` banner (errors) and the two new `subjectFeedback`/`topicFeedback` boolean states driving `<InlineFeedback>` (success), each auto-advancing the step after a 450ms delay instead of immediately.

- [ ] **Step 1: Write the new page**

Replace the entire contents of `app/onboarding/page.tsx` with:

```tsx
'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueries } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'

import { useCreateSubject, useSubjects } from '@/hooks/use-subjects'
import { useCreateTopic } from '@/hooks/use-topics'
import { useUpdateUser, useUser } from '@/hooks/use-user'
import { getTopics } from '@/lib/api/topics'

import { WizardShell } from '@/components/onboarding/wizard-shell'
import { WelcomeStep } from '@/components/onboarding/steps/welcome-step'
import { SubjectStep } from '@/components/onboarding/steps/subject-step'
import { TopicStep } from '@/components/onboarding/steps/topic-step'
import {
  TimerStep,
  timerSchema,
  type TimerFormInput,
  type TimerFormValues,
} from '@/components/onboarding/steps/timer-step'
import { FeaturesStep } from '@/components/onboarding/steps/features-step'
import { DoneStep } from '@/components/onboarding/steps/done-step'

const TOTAL_STEPS = 6
const FEEDBACK_DELAY_MS = 450

export default function OnboardingPage() {
  const router = useRouter()
  const { data: user, isLoading: userLoading } = useUser()
  const { data: subjects = [] } = useSubjects()
  const createSubject = useCreateSubject()
  const createTopic = useCreateTopic()
  const updateUser = useUpdateUser()

  const [step, setStep] = useState(0)
  const [newSubjectName, setNewSubjectName] = useState('')
  const [newTopicName, setNewTopicName] = useState('')
  const [selectedSubjectId, setSelectedSubjectId] = useState('')
  const [flowMessage, setFlowMessage] = useState('')
  const [subjectFeedback, setSubjectFeedback] = useState(false)
  const [topicFeedback, setTopicFeedback] = useState(false)
  const [completionDestination, setCompletionDestination] = useState<
    '/dashboard' | '/subjects' | null
  >(null)

  const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    return () => {
      if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current)
    }
  }, [])

  const {
    register,
    reset,
    getValues,
    control,
    formState: { errors },
  } = useForm<TimerFormInput, unknown, TimerFormValues>({
    resolver: zodResolver(timerSchema),
    defaultValues: {
      blitzMinutes: user?.blitzMinutes ?? 10,
      focusMinutes: user?.focusMinutes ?? 25,
      deepMinutes: user?.deepMinutes ?? 50,
      shortBreakMinutes: user?.shortBreakMinutes ?? 5,
      longBreakMinutes: user?.longBreakMinutes ?? 10,
    },
  })

  useEffect(() => {
    if (!userLoading && user?.onboarded) {
      router.replace(completionDestination ?? '/dashboard')
    }
  }, [completionDestination, userLoading, user?.onboarded, router])

  const resolvedSubjectId = useMemo(() => {
    if (!subjects.length) return ''
    if (subjects.some((subject) => subject.id === selectedSubjectId)) {
      return selectedSubjectId
    }
    return subjects[0].id
  }, [subjects, selectedSubjectId])

  const topicQueries = useQueries({
    queries: subjects.map((subject) => ({
      queryKey: ['subject', subject.id],
      queryFn: () => getTopics(subject.id),
      enabled: !!subject.id,
    })),
  })

  const setup = useMemo(() => {
    const hasSubject = subjects.length > 0
    const allTopics = topicQueries.flatMap((query) => query.data?.topics ?? [])
    const hasTopic = allTopics.length > 0
    return { hasSubject, hasTopic, topicCount: allTopics.length }
  }, [subjects.length, topicQueries])

  const watchedBlitz = useWatch({ control, name: 'blitzMinutes' })
  const watchedFocus = useWatch({ control, name: 'focusMinutes' })
  const watchedDeep = useWatch({ control, name: 'deepMinutes' })

  const parseTimerPreferences = () => {
    const values = getValues()
    const parse = timerSchema.safeParse({
      blitzMinutes: values.blitzMinutes,
      focusMinutes: values.focusMinutes,
      deepMinutes: values.deepMinutes,
      shortBreakMinutes: user?.shortBreakMinutes ?? 5,
      longBreakMinutes: user?.longBreakMinutes ?? 10,
    })
    if (!parse.success) {
      setFlowMessage('Fix the highlighted timer fields to continue.')
      return null
    }
    return parse.data
  }

  useEffect(() => {
    if (!user) return
    reset({
      blitzMinutes: user.blitzMinutes ?? 10,
      focusMinutes: user.focusMinutes ?? 25,
      deepMinutes: user.deepMinutes ?? 50,
      shortBreakMinutes: user.shortBreakMinutes ?? 5,
      longBreakMinutes: user.longBreakMinutes ?? 10,
    })
  }, [reset, user])

  const onCreateSubject = async () => {
    const name = newSubjectName.trim()
    if (!name) return
    try {
      const subject = await createSubject.mutateAsync({ name })
      setNewSubjectName('')
      setSelectedSubjectId(subject.id)
      setFlowMessage('')
      setSubjectFeedback(true)
      feedbackTimeoutRef.current = setTimeout(() => {
        setSubjectFeedback(false)
        setStep(2)
      }, FEEDBACK_DELAY_MS)
    } catch {
      setFlowMessage('Could not create subject. Try again.')
    }
  }

  const onCreateTopic = async () => {
    const name = newTopicName.trim()
    if (!name || !resolvedSubjectId) return
    try {
      await createTopic.mutateAsync({
        subjectId: resolvedSubjectId,
        payload: { name },
      })
      setNewTopicName('')
      setFlowMessage('')
      setTopicFeedback(true)
      feedbackTimeoutRef.current = setTimeout(() => {
        setTopicFeedback(false)
        setStep(3)
      }, FEEDBACK_DELAY_MS)
    } catch {
      setFlowMessage('Could not create topic. Try again.')
    }
  }

  const onNext = async () => {
    if (step === 1 && !setup.hasSubject) {
      setFlowMessage('Create your first subject to continue.')
      return
    }
    if (step === 2 && !setup.hasTopic) {
      setFlowMessage('Add your first topic to continue.')
      return
    }
    if (step === 3) {
      const parsed = parseTimerPreferences()
      if (!parsed) return
      try {
        await updateUser.mutateAsync({
          blitzMinutes: parsed.blitzMinutes,
          focusMinutes: parsed.focusMinutes,
          deepMinutes: parsed.deepMinutes,
          shortBreakMinutes: user?.shortBreakMinutes ?? 5,
          longBreakMinutes: user?.longBreakMinutes ?? 10,
        })
      } catch {
        setFlowMessage('Could not save timer preferences right now.')
        return
      }
    }
    setFlowMessage('')
    setStep((prev) => Math.min(TOTAL_STEPS - 1, prev + 1))
  }

  const onBack = () => {
    setFlowMessage('')
    setStep((prev) => Math.max(0, prev - 1))
  }

  const completeOnboarding = async (
    destination: '/dashboard' | '/subjects' = '/dashboard'
  ) => {
    setCompletionDestination(destination)
    if (!setup.hasSubject || !setup.hasTopic) {
      setFlowMessage('Complete setup first.')
      return
    }
    const parsed = parseTimerPreferences()
    if (!parsed) return
    try {
      await updateUser.mutateAsync({
        onboarded: true,
        blitzMinutes: parsed.blitzMinutes,
        focusMinutes: parsed.focusMinutes,
        deepMinutes: parsed.deepMinutes,
        shortBreakMinutes: user?.shortBreakMinutes ?? 5,
        longBreakMinutes: user?.longBreakMinutes ?? 10,
      })
      setFlowMessage('Setup complete. Redirecting to your dashboard...')
      router.push(destination)
    } catch {
      setFlowMessage('Unable to complete onboarding right now.')
    }
  }

  if (userLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#070b16] text-slate-300">
        <motion.div
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-sm tracking-widest text-slate-500 uppercase"
        >
          Loading…
        </motion.div>
      </div>
    )
  }

  const nextLabel =
    step === 0
      ? 'Begin setup'
      : step === 3
        ? 'Save & continue'
        : step === 4
          ? 'I am ready'
          : 'Continue'

  return (
    <WizardShell
      step={step}
      totalSteps={TOTAL_STEPS}
      flowMessage={flowMessage}
      onBack={onBack}
      backDisabled={step === 0}
      showNext={step < TOTAL_STEPS - 1}
      nextLabel={nextLabel}
      nextDisabled={updateUser.isPending && step === 3}
      onNext={() => void onNext()}
    >
      <AnimatePresence mode="wait">
        <motion.section
          key={`onboarding-step-${step}`}
          initial={{ opacity: 0, y: 18, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -16, scale: 0.98 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          {step === 0 && (
            <WelcomeStep
              totalXP={user?.totalXP ?? 0}
              streak={user?.streak ?? 0}
            />
          )}
          {step === 1 && (
            <SubjectStep
              subjects={subjects}
              hasSubject={setup.hasSubject}
              newSubjectName={newSubjectName}
              onChangeName={setNewSubjectName}
              onSubmit={() => void onCreateSubject()}
              isPending={createSubject.isPending}
              showFeedback={subjectFeedback}
            />
          )}
          {step === 2 && (
            <TopicStep
              subjects={subjects}
              resolvedSubjectId={resolvedSubjectId}
              onChangeSubject={setSelectedSubjectId}
              newTopicName={newTopicName}
              onChangeName={setNewTopicName}
              onSubmit={() => void onCreateTopic()}
              isPending={createTopic.isPending}
              showFeedback={topicFeedback}
            />
          )}
          {step === 3 && (
            <TimerStep
              register={register}
              errors={errors}
              watchedBlitz={watchedBlitz}
              watchedFocus={watchedFocus}
              watchedDeep={watchedDeep}
            />
          )}
          {step === 4 && <FeaturesStep />}
          {step === 5 && (
            <DoneStep
              canComplete={setup.hasSubject && setup.hasTopic}
              isPending={updateUser.isPending}
              onStartSession={() => void completeOnboarding('/dashboard')}
              onOpenFlashcards={() => void completeOnboarding('/subjects')}
            />
          )}
        </motion.section>
      </AnimatePresence>
    </WizardShell>
  )
}
```

- [ ] **Step 2: Verify it compiles with no unused-import or type errors**

Run: `npx tsc --noEmit`
Expected: no errors mentioning `app/onboarding/page.tsx` or any `components/onboarding/**` file

- [ ] **Step 3: Verify no toast usage remains in this file**

Run: `grep -n "toast\|sonner" app/onboarding/page.tsx`
Expected: no output (empty)

- [ ] **Step 4: Commit**

```bash
git add app/onboarding/page.tsx
git commit -m "refactor: rewire onboarding page onto WizardShell + step components, drop toasts"
```

---

### Task 10: Full verification

**Files:** none (verification only)

- [ ] **Step 1: Full typecheck**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: 0 errors (pre-existing unrelated warnings in `app/api/subjects/route.ts` are fine and untouched by this change)

- [ ] **Step 3: Run the existing e2e suite for regressions**

Run: `npm run test:e2e`
Expected: `auth-routing.spec.ts` and `public-timer.spec.ts` pass unchanged (they don't touch onboarding). `authenticated-flow.spec.ts`'s onboarding test asserts on `#subject-name`, `#topic-name`, the "Begin setup"/"Add subject"/"Add topic" button text, and the "Add your first topic"/"Set your timer style" headings — all of which are unchanged by this rework, so it should pass if `E2E_CLERK_USER_USERNAME`/`E2E_CLERK_USER_PASSWORD` are set, or skip (not fail) if they aren't.

- [ ] **Step 4: Manual walkthrough**

Run: `npm run dev`, then in a browser sign in (or use an existing onboarded-false test account) and walk through all 6 steps at `/onboarding`. Confirm:
- The panel has visibly more breathing room than before at every step.
- Creating a subject shows the green "Subject created" pill (no toast), then advances to the Topic step after a brief pause.
- Creating a topic shows "Topic created" the same way, then advances to Timer.
- Submitting the subject/topic form with an error (e.g. stop the dev server's DB connection, or simulate by disconnecting network) shows the amber banner instead of a toast — restore normal operation after checking.
- Progress dots still show 6 dots with correct active/completed states as you move through steps.
- Back/Continue navigation still works at every step, including validation messages when trying to advance without a subject/topic.

- [ ] **Step 5: Commit any final fixups**

If Steps 1–4 required small fixes, stage and commit them:

```bash
git add -A
git commit -m "fix: address issues found during onboarding rework verification"
```

(Skip this step entirely if no fixes were needed.)
