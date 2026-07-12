'use client'

import { useMemo } from 'react'
import { formatDuration } from '@/lib/format'
import type { HeatmapDay } from '@/lib/api/stats'

function intensityClass(seconds: number, max: number) {
  if (seconds <= 0) return 'bg-surface-hi'
  const ratio = max > 0 ? seconds / max : 0
  if (ratio > 0.75) return 'bg-violet'
  if (ratio > 0.5) return 'bg-violet/70'
  if (ratio > 0.25) return 'bg-violet/45'
  return 'bg-violet/25'
}

function formatDayLabel(date: string) {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

function formatMonthLabel(date: string) {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString('en-US', {
    month: 'short',
    timeZone: 'UTC',
  })
}

// Minimum gap (in week-columns) between two month labels so short months
// (e.g. Feb) never render with an adjacent label overlapping its text.
const MIN_LABEL_GAP_WEEKS = 2

function getMonthLabels(weeks: (HeatmapDay | null)[][]): (string | null)[] {
  let lastMonth = -1
  let lastLabelIndex = -Infinity

  return weeks.map((week, weekIndex) => {
    const firstDay = week.find((day): day is HeatmapDay => day !== null)
    if (!firstDay) return null

    const month = new Date(`${firstDay.date}T00:00:00Z`).getUTCMonth()
    const isNewMonth = month !== lastMonth
    lastMonth = month

    if (isNewMonth && weekIndex - lastLabelIndex >= MIN_LABEL_GAP_WEEKS) {
      lastLabelIndex = weekIndex
      return formatMonthLabel(firstDay.date)
    }
    return null
  })
}

export function ActivityHeatmap({ days }: { days: HeatmapDay[] }) {
  const { weeks, monthLabels, max } = useMemo(() => {
    const max = days.reduce((acc, day) => Math.max(acc, day.seconds), 0)
    const empty: { weeks: (HeatmapDay | null)[][]; monthLabels: (string | null)[]; max: number } = {
      weeks: [],
      monthLabels: [],
      max,
    }
    if (!days.length) return empty

    const firstWeekday = new Date(`${days[0].date}T00:00:00Z`).getUTCDay()
    const padded: (HeatmapDay | null)[] = [
      ...(Array(firstWeekday).fill(null) as null[]),
      ...days,
    ]

    const tailPadding = (7 - (padded.length % 7)) % 7
    if (tailPadding > 0) {
      padded.push(...(Array(tailPadding).fill(null) as null[]))
    }

    const built: (HeatmapDay | null)[][] = []
    for (let i = 0; i < padded.length; i += 7) {
      built.push(padded.slice(i, i + 7))
    }

    return { weeks: built, monthLabels: getMonthLabels(built), max }
  }, [days])

  if (!days.length) {
    return <p className="text-sm text-text-sub">No activity yet.</p>
  }

  return (
    <div>
      <div className="overflow-x-auto pb-1">
        <div className="mb-1 flex gap-1">
          {monthLabels.map((label, weekIndex) => (
            <div key={weekIndex} className="w-3 shrink-0 text-[10px] text-muted-foreground">
              {label && <span className="whitespace-nowrap">{label}</span>}
            </div>
          ))}
        </div>
        <div className="flex gap-1">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-1">
              {week.map((day, dayIndex) =>
                day ? (
                  <div
                    key={day.date}
                    title={`${formatDayLabel(day.date)} · ${formatDuration(day.seconds)} · ${day.sessions} session${day.sessions === 1 ? '' : 's'}`}
                    className={`h-3 w-3 rounded-sm ${intensityClass(day.seconds, max)}`}
                  />
                ) : (
                  <div key={`pad-${weekIndex}-${dayIndex}`} className="h-3 w-3" />
                )
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-2 flex items-center justify-end gap-1 text-[10px] text-muted-foreground">
        <span>Less</span>
        <div className="h-3 w-3 rounded-sm bg-surface-hi" />
        <div className="h-3 w-3 rounded-sm bg-violet/25" />
        <div className="h-3 w-3 rounded-sm bg-violet/45" />
        <div className="h-3 w-3 rounded-sm bg-violet/70" />
        <div className="h-3 w-3 rounded-sm bg-violet" />
        <span>More</span>
      </div>
    </div>
  )
}
