import { Medal, Zap } from 'lucide-react'
import type { GlobalEntry } from '@/lib/api/leaderboard'

interface GlobalLeaderboardRowProps {
  entry: GlobalEntry
}

export function GlobalLeaderboardRow({ entry }: GlobalLeaderboardRowProps) {
  return (
    <div className="bg-glass-subtle grid grid-cols-[56px_1fr_auto] items-center gap-2 rounded-lg border border-white/10 px-3 py-2.5">
      <span className="inline-flex items-center gap-1 text-sm font-bold text-slate-300">
        <Medal className="h-3.5 w-3.5 text-violet-300" />#{entry.rank}
      </span>
      <div>
        <p className="truncate text-sm font-semibold text-white">
          {entry.name}
        </p>
        <p className="text-xs text-slate-400">Level {entry.level}</p>
      </div>
      <div className="text-right">
        <p className="inline-flex items-center justify-end gap-1 text-sm font-semibold text-violet-200">
          <Zap className="h-3.5 w-3.5" />
          {entry.totalXP}
        </p>
        <p className="text-xs text-slate-400">{entry.streak}d streak</p>
      </div>
    </div>
  )
}
