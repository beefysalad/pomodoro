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
