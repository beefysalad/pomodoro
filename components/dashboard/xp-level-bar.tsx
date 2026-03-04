'use client'

import { motion } from 'framer-motion'
import { Zap } from 'lucide-react'

export function XpLevelBar() {
  const level = 12
  const current = 840
  const total = 1000
  const pct = (current / total) * 100

  return (
    <div className="border-border bg-surface flex items-center gap-4 rounded-2xl border px-5 py-4">
      {/* Level badge */}
      <div className="from-violet to-violet/70 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br shadow-[0_0_14px_var(--color-violet-glow)]">
        <span className="text-[13px] font-[900] text-white">{level}</span>
      </div>

      {/* Bar */}
      <div className="flex-1">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-foreground text-[13px] font-[700]">
            Level {level}
          </span>
          <span className="text-muted-foreground/50 font-mono text-[11px] font-[600]">
            {current.toLocaleString()} / {total.toLocaleString()} XP
          </span>
        </div>
        <div className="bg-surface-up h-1.5 w-full overflow-hidden rounded-full">
          <motion.div
            className="h-full rounded-full"
            style={{
              background:
                'linear-gradient(90deg, var(--color-violet), #a855f7)',
            }}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
          />
        </div>
      </div>

      <Zap className="text-violet h-4 w-4 shrink-0 opacity-60" />
    </div>
  )
}
