'use client'

import { useMemo } from 'react'
import { useQueries } from '@tanstack/react-query'
import {
  BarChart3,
  CheckCircle2,
  Clock3,
  Flame,
  Lock,
  Rocket,
  Trophy,
  Zap,
} from 'lucide-react'
import { AppHeader } from '@/components/app-header'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { getTopics } from '@/lib/api/topics'
import { useSubjects } from '@/hooks/use-subjects'
import { useUser } from '@/hooks/use-user'

function formatDuration(totalSeconds: number) {
  const totalMinutes = Math.floor(totalSeconds / 60)
  if (totalMinutes < 60) return `${totalMinutes}m`
  const hours = Math.floor(totalMinutes / 60)
  const mins = totalMinutes % 60
  return `${hours}h ${mins}m`
}

function getLevel(totalXP: number) {
  return Math.floor(Math.sqrt(totalXP / 100)) + 1
}

export default function StatsPage() {
  const { data: user } = useUser()
  const { data: subjects = [], isLoading: subjectsLoading } = useSubjects()

  const topicQueries = useQueries({
    queries: subjects.map((subject) => ({
      queryKey: ['subject', subject.id],
      queryFn: () => getTopics(subject.id),
      enabled: !!subject.id,
    })),
  })

  const isLoading =
    subjectsLoading ||
    (subjects.length > 0 && topicQueries.some((query) => query.isLoading))

  const stats = useMemo(() => {
    const subjectSummaries = subjects.map((subject, index) => {
      const topics = topicQueries[index]?.data?.topics ?? []
      const totalSeconds = topics.reduce((sum, topic) => sum + topic.totalTime, 0)
      const totalSessions = topics.reduce(
        (sum, topic) => sum + topic._count.sessions,
        0
      )

      return {
        ...subject,
        topicCount: topics.length,
        totalSeconds,
        totalSessions,
      }
    })

    const totalSeconds = subjectSummaries.reduce(
      (sum, subject) => sum + subject.totalSeconds,
      0
    )
    const totalSessions = subjectSummaries.reduce(
      (sum, subject) => sum + subject.totalSessions,
      0
    )
    const topicCount = subjectSummaries.reduce(
      (sum, subject) => sum + subject.topicCount,
      0
    )

    const avgSessionSeconds = totalSessions
      ? Math.round(totalSeconds / totalSessions)
      : 0

    const topSubject = [...subjectSummaries].sort(
      (a, b) => b.totalSeconds - a.totalSeconds
    )[0]

    const achievements = [
      {
        id: 'first-focus-hour',
        title: 'First Focus Hour',
        unlocked: totalSeconds >= 60 * 60,
        progress: Math.min(100, Math.round((totalSeconds / (60 * 60)) * 100)),
      },
      {
        id: 'ten-sessions',
        title: 'Session Sprinter',
        unlocked: totalSessions >= 10,
        progress: Math.min(100, Math.round((totalSessions / 10) * 100)),
      },
      {
        id: 'streak-7',
        title: 'Streak Survivor',
        unlocked: (user?.streak ?? 0) >= 7,
        progress: Math.min(100, Math.round(((user?.streak ?? 0) / 7) * 100)),
      },
    ]

    const quests = [
      {
        id: 'quest-sessions',
        label: 'Complete 3 sessions',
        current: Math.min(3, totalSessions),
        target: 3,
      },
      {
        id: 'quest-time',
        label: 'Study 90 minutes',
        current: Math.min(90, Math.floor(totalSeconds / 60)),
        target: 90,
      },
      {
        id: 'quest-topics',
        label: 'Touch 5 topics',
        current: Math.min(5, topicCount),
        target: 5,
      },
    ]

    return {
      subjectSummaries,
      totalSeconds,
      totalSessions,
      topicCount,
      avgSessionSeconds,
      topSubject,
      achievements,
      quests,
    }
  }, [subjects, topicQueries, user?.streak])

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#070b16] text-slate-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 left-[-140px] h-[420px] w-[420px] rounded-full bg-cyan-500/12 blur-[140px]" />
        <div className="absolute right-[-120px] bottom-[-100px] h-[420px] w-[420px] rounded-full bg-violet-600/15 blur-[140px]" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-10">
        <AppHeader />

        <section>
          <p className="text-xs font-semibold tracking-[0.18em] text-cyan-300 uppercase">
            Advanced Stats
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">
            Your full study analytics
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Deep breakdowns across XP, session volume, subject performance, and time distribution.
          </p>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard icon={Zap} label="Total XP" value={String(user?.totalXP ?? 0)} />
          <StatCard
            icon={Rocket}
            label="Current Level"
            value={`Lvl ${getLevel(user?.totalXP ?? 0)}`}
          />
          <StatCard
            icon={Clock3}
            label="Focus Time"
            value={formatDuration(stats.totalSeconds)}
          />
          <StatCard
            icon={BarChart3}
            label="Sessions"
            value={String(stats.totalSessions)}
          />
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <Card className="border-white/10 bg-white/[0.05] py-0 backdrop-blur-xl">
            <CardContent className="space-y-4 px-4 py-5 sm:px-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white">Subject breakdown</h2>
                <Badge className="bg-violet-500/20 text-violet-200">
                  {stats.subjectSummaries.length} subjects
                </Badge>
              </div>

              {isLoading ? (
                <p className="text-sm text-slate-400">Loading analytics...</p>
              ) : !stats.subjectSummaries.length ? (
                <p className="text-sm text-slate-400">Create your first subject to unlock analytics.</p>
              ) : (
                <div className="space-y-3">
                  {stats.subjectSummaries
                    .sort((a, b) => b.totalSeconds - a.totalSeconds)
                    .map((subject) => {
                      const percentage = stats.totalSeconds
                        ? Math.round((subject.totalSeconds / stats.totalSeconds) * 100)
                        : 0

                      return (
                        <div key={subject.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                          <div className="mb-1.5 flex items-center justify-between text-sm">
                            <span className="font-semibold text-white">{subject.name}</span>
                            <span className="text-slate-300">{formatDuration(subject.totalSeconds)}</span>
                          </div>
                          <Progress value={Math.max(4, percentage)} className="h-2 bg-white/10" />
                          <div className="mt-1.5 flex items-center justify-between text-xs text-slate-400">
                            <span>{subject.totalSessions} sessions</span>
                            <span>{subject.topicCount} topics</span>
                          </div>
                        </div>
                      )
                    })}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border-white/10 bg-white/[0.05] py-0 backdrop-blur-xl">
              <CardContent className="space-y-3 px-4 py-5 sm:px-5">
                <h2 className="text-base font-bold text-white">Daily quests</h2>
                {stats.quests.map((quest) => {
                  const progress = Math.round((quest.current / quest.target) * 100)
                  const done = quest.current >= quest.target
                  return (
                    <div
                      key={quest.id}
                      className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5"
                    >
                      <div className="mb-1.5 flex items-center justify-between text-sm">
                        <span className="text-slate-200">{quest.label}</span>
                        <span
                          className={done ? 'text-emerald-300' : 'text-slate-400'}
                        >
                          {quest.current}/{quest.target}
                        </span>
                      </div>
                      <Progress value={Math.max(4, progress)} className="h-2 bg-white/10" />
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-white/[0.05] py-0 backdrop-blur-xl">
              <CardContent className="space-y-3 px-4 py-5 sm:px-5">
                <h2 className="text-base font-bold text-white">Achievements</h2>
                {stats.achievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5"
                  >
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="inline-flex items-center gap-2 text-slate-200">
                        {achievement.unlocked ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />
                        ) : (
                          <Lock className="h-3.5 w-3.5 text-slate-500" />
                        )}
                        {achievement.title}
                      </span>
                      <span className="text-slate-400">{achievement.progress}%</span>
                    </div>
                    <Progress
                      value={Math.max(4, achievement.progress)}
                      className="h-2 bg-white/10"
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-white/[0.05] py-0 backdrop-blur-xl">
              <CardContent className="space-y-3 px-4 py-5 sm:px-5">
                <h2 className="text-base font-bold text-white">Performance snapshot</h2>
                <SnapshotRow label="Current streak" value={`${user?.streak ?? 0} days`} icon={Flame} />
                <SnapshotRow label="Tracked topics" value={String(stats.topicCount)} icon={BarChart3} />
                <SnapshotRow
                  label="Avg session"
                  value={formatDuration(stats.avgSessionSeconds)}
                  icon={Clock3}
                />
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-white/[0.05] py-0 backdrop-blur-xl">
              <CardContent className="space-y-2 px-4 py-5 sm:px-5">
                <h2 className="text-base font-bold text-white">Top subject</h2>
                {stats.topSubject ? (
                  <>
                    <p className="text-lg font-extrabold text-white">{stats.topSubject.name}</p>
                    <p className="text-sm text-slate-300">
                      {formatDuration(stats.topSubject.totalSeconds)} across {stats.topSubject.totalSessions} sessions.
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-slate-400">No sessions yet.</p>
                )}
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-gradient-to-br from-violet-500/15 to-cyan-500/10 py-0 backdrop-blur-xl">
              <CardContent className="px-4 py-5 sm:px-5">
                <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-violet-100">
                  <Trophy className="h-4 w-4" />
                  Momentum insight
                </p>
                <p className="mt-2 text-sm text-slate-200">
                  {stats.totalSessions >= 20
                    ? 'You have built a strong study rhythm. Keep consistency to compound gains.'
                    : 'Stack small wins. Short daily sessions build faster long-term retention.'}
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
}) {
  return (
    <Card className="border-white/10 bg-white/[0.05] py-0 backdrop-blur-xl">
      <CardContent className="flex items-center justify-between px-4 py-4 sm:px-5">
        <div>
          <p className="text-xs text-slate-400">{label}</p>
          <p className="mt-1 text-2xl font-extrabold text-white">{value}</p>
        </div>
        <div className="rounded-xl border border-white/15 bg-white/5 p-2.5">
          <Icon className="h-4 w-4 text-slate-100" />
        </div>
      </CardContent>
    </Card>
  )
}

function SnapshotRow({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string
  icon: React.ComponentType<{ className?: string }>
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5">
      <span className="inline-flex items-center gap-2 text-sm text-slate-300">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </span>
      <span className="text-sm font-semibold text-white">{value}</span>
    </div>
  )
}
