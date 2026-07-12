'use client'

import { BarChart3, CheckCircle2, Clock3, Flame, Rocket, Target, Zap } from 'lucide-react'
import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { AppHeader } from '@/components/app-header'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { ActivityHeatmap } from '@/components/stats/activity-heatmap'
import { HighlightsCard } from '@/components/stats/highlights-card'
import { InsightCard } from '@/components/stats/insight-card'
import { StatCard } from '@/components/stats/stat-card'
import { formatDuration, formatPercent } from '@/lib/format'
import { useStats } from '@/hooks/use-stats'

const CHART_COLORS = ['#7c3aed', '#a78bfa', '#ea580c', '#10b981', '#c4b5fd', '#fdba74']
const TOOLTIP_STYLE = {
  background: '#162032',
  border: '1px solid #2d4163',
  borderRadius: '10px',
  color: '#e2e8f0',
}

export default function StatsPage() {
  const { data: stats, isLoading } = useStats()

  const subjects = stats?.subjects ?? []
  const topTopics = stats?.topTopics ?? []
  const heatmapDays = stats?.heatmap.days ?? []

  const subjectChart = subjects.slice(0, 8).map((subject) => ({
    id: subject.id,
    name: subject.name.length > 16 ? `${subject.name.slice(0, 16)}...` : subject.name,
    timeMinutes: Math.round(subject.totalSeconds / 60),
    sessions: subject.sessionCount,
  }))

  const shareChart = subjectChart
    .map((subject, index) => ({
      ...subject,
      value: subject.timeMinutes,
      color: CHART_COLORS[index % CHART_COLORS.length],
    }))
    .filter((slice) => slice.value > 0)

  const avgSessionSeconds =
    stats && stats.totals.sessions
      ? Math.round(stats.totals.focusSeconds / stats.totals.sessions)
      : 0

  const momentumMessage =
    stats && stats.totals.sessions >= 20
      ? 'You have built a strong study rhythm. Keep consistency to compound gains.'
      : 'Stack small wins. Short daily sessions build faster long-term retention.'

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 left-[-140px] h-[420px] w-[420px] rounded-full bg-violet-glow blur-[140px]" />
        <div className="absolute right-[-120px] bottom-[-100px] h-[420px] w-[420px] rounded-full bg-streak-bg blur-[140px]" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-10">
        <AppHeader />

        <section>
          <p className="text-xs font-semibold tracking-[0.18em] text-violet-mid uppercase">
            Advanced Stats
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-foreground sm:text-4xl">
            Your full study analytics
          </h1>
          <p className="mt-2 text-sm text-text-sub">
            Deep breakdowns across XP, session volume, subject performance, and time
            distribution.
          </p>
        </section>

        {isLoading || !stats ? (
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-2xl" />
            ))}
          </section>
        ) : (
          <>
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                icon={Zap}
                label="Total XP"
                value={String(stats.totals.xp)}
                trend={stats.trends.xp}
              />
              <StatCard icon={Rocket} label="Current Level" value={`Lvl ${stats.totals.level}`} />
              <StatCard
                icon={Clock3}
                label="Focus Time"
                value={formatDuration(stats.totals.focusSeconds)}
                trend={stats.trends.focusSeconds}
              />
              <StatCard
                id="tutorial-stats-sessions"
                icon={BarChart3}
                label="Sessions"
                value={String(stats.totals.sessions)}
                trend={stats.trends.sessions}
              />
            </section>

            <Card id="tutorial-stats-level" className="border-border bg-surface py-0">
              <CardContent className="space-y-3 px-4 py-5 sm:px-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-base font-bold text-foreground">Level progress</h2>
                  <Badge className="border border-violet/30 bg-violet-glow text-violet-mid">
                    {stats.levelProgress.xpToNext} XP to Level {stats.levelProgress.level + 1}
                  </Badge>
                </div>
                <Progress value={stats.levelProgress.progressPct} className="h-2.5 bg-surface-hi" />
                <div className="flex items-center justify-between text-xs text-text-sub">
                  <span>
                    Level {stats.levelProgress.level} · {stats.levelProgress.xpIntoLevel}/
                    {stats.levelProgress.xpForLevel} XP
                  </span>
                  <span>{Math.round(stats.levelProgress.progressPct)}%</span>
                </div>
              </CardContent>
            </Card>

            <section
              id="tutorial-stats-streak"
              className="rounded-2xl border border-streak/35 bg-gradient-to-r from-streak-bg via-streak-bg to-transparent px-4 py-3 sm:px-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl border border-streak/45 bg-streak-bg p-2">
                    <Flame className="h-5 w-5 text-streak" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold tracking-[0.16em] text-streak uppercase">
                      Streak spotlight
                    </p>
                    <p className="text-3xl leading-none font-black text-foreground sm:text-4xl">
                      {stats.streak.current}
                      <span className="ml-1 text-lg font-semibold text-streak/90 sm:text-xl">
                        day{stats.streak.current === 1 ? '' : 's'}
                      </span>
                    </p>
                    <p className="text-xs text-streak/80">
                      Keep showing up daily to protect momentum.
                    </p>
                  </div>
                </div>
                <div className="rounded-xl border border-streak/35 bg-streak-bg px-3 py-2 text-right">
                  <p className="text-[10px] font-semibold tracking-[0.12em] text-streak uppercase">
                    Next goal
                  </p>
                  <p className="text-lg font-extrabold text-foreground">
                    {stats.streak.nextGoal} days
                  </p>
                </div>
              </div>
            </section>

            <Card className="border-border bg-surface py-0">
              <CardContent className="space-y-3 px-4 py-5 sm:px-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-foreground">Activity, last 12 weeks</h2>
                  <Badge className="border border-violet/30 bg-violet-glow text-violet-mid">
                    {heatmapDays.filter((d) => d.seconds > 0).length} active days
                  </Badge>
                </div>
                <ActivityHeatmap days={heatmapDays} />
              </CardContent>
            </Card>

            <section className="grid gap-4 sm:grid-cols-3">
              <InsightCard
                icon={Flame}
                label="Consistency score"
                value={formatPercent(stats.insights.consistencyScore)}
                hint="Derived from streak and session cadence."
                accent="bg-gradient-to-br from-streak-bg to-transparent"
              />
              <InsightCard
                icon={CheckCircle2}
                label="Topic completion"
                value={formatPercent(stats.insights.completionRate)}
                hint="Done topics across all tracked topics."
                accent="bg-gradient-to-br from-success-bg to-transparent"
              />
              <InsightCard
                icon={Target}
                label="Focus concentration"
                value={formatPercent(stats.insights.concentrationRate)}
                hint="How much time is concentrated in your top subject."
                accent="bg-gradient-to-br from-violet-glow to-transparent"
              />
            </section>

            <Card id="tutorial-stats-graph" className="border-border bg-surface py-0">
              <CardContent className="space-y-4 px-4 py-5 sm:px-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-foreground">
                    Time + sessions by subject
                  </h2>
                  <Badge className="border border-violet/30 bg-violet-glow text-violet-mid">
                    Top {subjectChart.length}
                  </Badge>
                </div>

                {!subjectChart.length ? (
                  <p className="text-sm text-text-sub">
                    Create your first subject to unlock analytics.
                  </p>
                ) : (
                  <div className="h-[320px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={subjectChart}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                        <XAxis
                          dataKey="name"
                          tick={{ fill: '#94a3b8', fontSize: 12 }}
                          axisLine={{ stroke: 'rgba(148,163,184,0.3)' }}
                          tickLine={{ stroke: 'rgba(148,163,184,0.3)' }}
                        />
                        <YAxis
                          yAxisId="left"
                          tick={{ fill: '#94a3b8', fontSize: 12 }}
                          axisLine={{ stroke: 'rgba(148,163,184,0.3)' }}
                          tickLine={{ stroke: 'rgba(148,163,184,0.3)' }}
                        />
                        <YAxis
                          yAxisId="right"
                          orientation="right"
                          tick={{ fill: '#94a3b8', fontSize: 12 }}
                          axisLine={{ stroke: 'rgba(148,163,184,0.3)' }}
                          tickLine={{ stroke: 'rgba(148,163,184,0.3)' }}
                        />
                        <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={{ color: '#e2e8f0' }} itemStyle={{ color: '#94a3b8' }} />
                        <Legend wrapperStyle={{ color: '#94a3b8' }} />
                        <Bar
                          yAxisId="left"
                          dataKey="timeMinutes"
                          name="Minutes"
                          radius={[6, 6, 0, 0]}
                          fill="#7c3aed"
                        />
                        <Bar
                          yAxisId="right"
                          dataKey="sessions"
                          name="Sessions"
                          radius={[6, 6, 0, 0]}
                          fill="#a78bfa"
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <Card className="border-border bg-surface py-0">
                <CardContent className="space-y-4 px-4 py-5 sm:px-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-foreground">Subject breakdown</h2>
                    <Badge className="border border-violet/30 bg-violet-glow text-violet-mid">
                      {subjects.length} subjects
                    </Badge>
                  </div>

                  {!subjects.length ? (
                    <p className="text-sm text-text-sub">No subject data yet.</p>
                  ) : (
                    <div className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
                      {subjects.map((subject) => {
                        const percentage = stats.totals.focusSeconds
                          ? Math.round((subject.totalSeconds / stats.totals.focusSeconds) * 100)
                          : 0

                        return (
                          <div
                            key={subject.id}
                            className="rounded-xl border border-border-up bg-surface-up p-3"
                          >
                            <div className="mb-1.5 flex items-center justify-between text-sm">
                              <span className="font-semibold text-foreground">{subject.name}</span>
                              <span className="text-text-sub">
                                {formatDuration(subject.totalSeconds)}
                              </span>
                            </div>
                            <Progress value={Math.max(4, percentage)} className="h-2 bg-surface-hi" />
                            <div className="mt-1.5 flex items-center justify-between text-xs text-text-sub">
                              <span>{subject.sessionCount} sessions</span>
                              <span>{subject.topicCount} topics</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-border bg-surface py-0">
                <CardContent className="space-y-4 px-4 py-5 sm:px-5">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-bold text-foreground">Time share</h2>
                    <Badge className="border border-violet/30 bg-violet-glow text-violet-mid">
                      {shareChart.length} slices
                    </Badge>
                  </div>
                  {!shareChart.length ? (
                    <p className="text-sm text-text-sub">No chart data yet.</p>
                  ) : (
                    <div className="h-[220px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={shareChart}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={56}
                            outerRadius={86}
                            paddingAngle={2}
                          >
                            {shareChart.map((entry) => (
                              <Cell key={entry.id} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={TOOLTIP_STYLE}
                            labelStyle={{ color: '#e2e8f0' }}
                            itemStyle={{ color: '#94a3b8' }}
                            formatter={(value: number | string | undefined) => [
                              `${value ?? 0}m`,
                              'Time',
                            ]}
                          />
                          <Legend wrapperStyle={{ color: '#94a3b8', fontSize: '12px' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  <div className="space-y-2 border-t border-border pt-3">
                    <h3 className="text-sm font-semibold text-foreground">Top topics</h3>
                    {!topTopics.length ? (
                      <p className="text-sm text-text-sub">No topic data yet.</p>
                    ) : (
                      topTopics.map((topic, index) => (
                        <div
                          key={topic.id}
                          className="rounded-lg border border-border-up bg-surface-up px-3 py-2"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate text-sm font-semibold text-foreground">
                              #{index + 1} {topic.name}
                            </p>
                            <p className="text-xs text-text-sub">
                              {formatDuration(topic.totalSeconds)}
                            </p>
                          </div>
                          <p className="mt-0.5 text-xs text-text-sub">
                            {topic.subjectName} · {topic.sessions} sessions
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              <HighlightsCard
                streakDays={stats.streak.current}
                topicCount={subjects.reduce((sum, s) => sum + s.topicCount, 0)}
                avgSessionSeconds={avgSessionSeconds}
                topSubject={
                  stats.topSubject
                    ? {
                        name: stats.topSubject.name,
                        totalSeconds: stats.topSubject.totalSeconds,
                        sessionCount: stats.topSubject.sessionCount,
                      }
                    : null
                }
                momentumMessage={momentumMessage}
              />
            </section>
          </>
        )}
      </div>
    </div>
  )
}
