import { BarChart3, Clock3, Flame, Trophy } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { SnapshotRow } from '@/components/stats/snapshot-row'
import { formatDuration } from '@/lib/format'

interface HighlightsCardProps {
  streakDays: number
  topicCount: number
  avgSessionSeconds: number
  topSubject: { name: string; totalSeconds: number; sessionCount: number } | null
  momentumMessage: string
}

export function HighlightsCard({
  streakDays,
  topicCount,
  avgSessionSeconds,
  topSubject,
  momentumMessage,
}: HighlightsCardProps) {
  return (
    <Card className="border-border bg-surface py-0">
      <CardContent className="space-y-3 px-4 py-5 sm:px-5">
        <h2 className="text-base font-bold text-foreground">Highlights</h2>

        <SnapshotRow
          label="Current streak"
          value={`${streakDays} day${streakDays === 1 ? '' : 's'}`}
          icon={Flame}
        />
        <SnapshotRow label="Tracked topics" value={String(topicCount)} icon={BarChart3} />
        <SnapshotRow label="Avg session" value={formatDuration(avgSessionSeconds)} icon={Clock3} />

        <div className="border-t border-border pt-3">
          <p className="text-xs font-semibold tracking-[0.1em] text-muted-foreground uppercase">
            Top subject
          </p>
          {topSubject ? (
            <>
              <p className="mt-1 text-lg font-extrabold text-foreground">{topSubject.name}</p>
              <p className="text-sm text-text-sub">
                {formatDuration(topSubject.totalSeconds)} across {topSubject.sessionCount} sessions.
              </p>
            </>
          ) : (
            <p className="mt-1 text-sm text-text-sub">No sessions yet.</p>
          )}
        </div>

        <div className="border-t border-border pt-3">
          <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-violet-mid">
            <Trophy className="h-4 w-4" />
            Momentum insight
          </p>
          <p className="mt-2 text-sm text-text-sub">{momentumMessage}</p>
        </div>
      </CardContent>
    </Card>
  )
}
