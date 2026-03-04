'use client'

import { useState } from 'react'
import XpBar from '../landing/xp-bar'

interface TimerMode {
  id: string
  label: string
  icon: string
  duration: string
  xp: number
  active: boolean
}

const TIMER_MODES: TimerMode[] = [
  {
    id: 'blitz',
    label: 'Blitz',
    icon: '⚡',
    duration: '10:00',
    xp: 10,
    active: false,
  },
  {
    id: 'focus',
    label: 'Focus',
    icon: '🎯',
    duration: '25:00',
    xp: 25,
    active: true,
  },
  {
    id: 'deep',
    label: 'Deep',
    icon: '🔬',
    duration: '50:00',
    xp: 50,
    active: false,
  },
]

export function TimerSection() {
  const [activeMode, setActiveMode] = useState('focus')

  return (
    <div className="border-violet/20 from-violet/[0.08] flex flex-col items-center gap-5 rounded-2xl border bg-gradient-to-br to-indigo-500/[0.04] p-6 md:p-8">
      {/* Mode Selector */}
      <div className="flex gap-2">
        {TIMER_MODES.map((mode) => (
          <button
            key={mode.id}
            onClick={() => setActiveMode(mode.id)}
            className={`rounded-lg px-3.5 py-2 text-[11px] font-[700] tracking-[0.04em] transition-all ${
              activeMode === mode.id
                ? 'border-violet-mid/40 bg-violet/20 text-violet-mid border shadow-[0_0_10px_var(--color-violet-glow)]'
                : 'border-border text-muted-foreground border hover:border-border-up'
            }`}
          >
            <span className="mr-1">{mode.icon}</span>
            {mode.label}
          </button>
        ))}
      </div>

      {/* Timer Display */}
      <div className="font-mono text-[56px] md:text-[64px] font-[900] leading-none text-foreground tracking-[-0.06em]">
        {TIMER_MODES.find((m) => m.id === activeMode)?.duration || '25:00'}
      </div>

      {/* XP Progress */}
      <div className="w-full max-w-[240px]">
        <XpBar value={0} />
      </div>

      {/* Start Button with XP Info */}
      <div className="flex flex-col items-center gap-2 w-full">
        <button className="border-violet bg-violet cursor-pointer rounded-xl border px-8 py-3 text-[12px] font-[700] text-white shadow-[0_0_20px_var(--color-violet-glow)] hover:shadow-[0_0_30px_var(--color-violet-glow)] transition-all hover:-translate-y-0.5">
          Start Session →
        </button>
        <p className="text-muted-foreground/60 text-[10px] font-[600]">
          Earn{' '}
          <span className="text-amber font-[700]">
            {TIMER_MODES.find((m) => m.id === activeMode)?.xp}
          </span>{' '}
          XP
        </p>
      </div>
    </div>
  )
}
