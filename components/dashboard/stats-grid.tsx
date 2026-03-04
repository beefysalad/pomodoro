'use client'

interface StatCard {
  label: string
  value: string
  icon: string
  color: string
  bgColor: string
}

const STATS: StatCard[] = [
  {
    label: 'Total XP',
    value: '2,840',
    icon: '⚡',
    color: 'text-violet-mid',
    bgColor: 'bg-violet/10',
  },
  {
    label: 'Level',
    value: '12',
    icon: '🏆',
    color: 'text-amber',
    bgColor: 'bg-amber/10',
  },
  {
    label: 'Sessions',
    value: '84',
    icon: '🎯',
    color: 'text-success',
    bgColor: 'bg-success/10',
  },
]

export function StatsGrid() {
  return (
    <div className="grid grid-cols-3 gap-3">
      {STATS.map((stat) => (
        <div
          key={stat.label}
          className={`border-border bg-surface rounded-xl border p-4 transition-all hover:border-border-up hover:bg-surface-up`}
        >
          <div className="mb-2 text-xl">{stat.icon}</div>
          <div className={`text-xl font-[800] tracking-[-0.02em] mb-1 ${stat.color}`}>
            {stat.value}
          </div>
          <div className="text-muted-foreground/40 text-[9px] font-[600] tracking-[0.08em] uppercase">
            {stat.label}
          </div>
        </div>
      ))}
    </div>
  )
}
