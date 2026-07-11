import { Medal, Timer } from 'lucide-react'
import { formatDuration } from '@/lib/format'
import type { WeeklyEntry } from '@/lib/api/leaderboard'

interface WeeklyLeaderboardRowProps {
  entry: WeeklyEntry
}

export function WeeklyLeaderboardRow({ entry }: WeeklyLeaderboardRowProps) {
  return (
    <div className="grid grid-cols-[56px_1fr_auto] items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5">
      <span className="inline-flex items-center gap-1 text-sm font-bold text-slate-300">
        <Medal className="h-3.5 w-3.5 text-cyan-300" />#{entry.rank}
      </span>
      <div>
        <p className="truncate text-sm font-semibold text-white">
          {entry.name}
        </p>
        <p className="text-xs text-slate-400">{entry.sessions} sessions</p>
      </div>
      <div className="text-right">
        <p className="inline-flex items-center justify-end gap-1 text-sm font-semibold text-cyan-200">
          <Timer className="h-3.5 w-3.5" />
          {formatDuration(entry.focusMinutes * 60)}
        </p>
        <p className="text-xs text-slate-400">{entry.weeklyXP} XP</p>
      </div>
    </div>
  )
}
