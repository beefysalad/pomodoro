import { TrendingDown, TrendingUp } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface Trend {
  value: number
  deltaPct: number
}

export function StatCard({
  id,
  icon: Icon,
  label,
  value,
  trend,
}: {
  id?: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  trend?: Trend
}) {
  const showTrend = trend !== undefined && trend.deltaPct !== 0
  const isPositive = (trend?.deltaPct ?? 0) > 0

  return (
    <Card id={id} className="border-border bg-surface py-0">
      <CardContent className="flex items-center justify-between px-4 py-4 sm:px-5">
        <div>
          <p className="text-xs text-text-sub">{label}</p>
          <p className="mt-1 text-2xl font-extrabold text-foreground">{value}</p>
          {showTrend && trend && (
            <p
              className={`mt-1 inline-flex items-center gap-1 text-xs font-semibold ${
                isPositive ? 'text-success' : 'text-destructive'
              }`}
            >
              {isPositive ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {Math.abs(trend.deltaPct)}% vs last week
            </p>
          )}
        </div>
        <div className="rounded-xl border border-violet/30 bg-violet-glow p-2.5">
          <Icon className="h-4 w-4 text-violet-mid" />
        </div>
      </CardContent>
    </Card>
  )
}
