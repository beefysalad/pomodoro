'use client'

import XpBar from '../landing/xp-bar'

export function XpLevelBar() {
  return (
    <div className="border-border bg-surface rounded-xl border p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-violet-mid text-[11px] font-[700] tracking-[0.04em] uppercase">
          Level 12
        </span>
        <span className="text-muted-foreground font-mono text-[10px]">
          840 / 1000 XP
        </span>
      </div>
      <XpBar value={84} delay={0} />
    </div>
  )
}
