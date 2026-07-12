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
