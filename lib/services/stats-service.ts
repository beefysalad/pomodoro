import prisma from '@/lib/prisma'
import * as statsRepository from '@/lib/repositories/stats-repository'
import { getDateKeyInTimeZone, getLevelProgress } from '@/lib/progression'
import type { SessionSlice, SubjectWithTopics } from '@/lib/repositories/stats-repository'
import type { User } from '@/app/generated/prisma/client'

const HEATMAP_WEEKS = 12
const HEATMAP_DAYS = HEATMAP_WEEKS * 7
const TREND_WINDOW_DAYS = 7
const DAY_MS = 24 * 60 * 60 * 1000

export interface SubjectSummary {
  id: string
  name: string
  color: string
  icon: string | null
  totalSeconds: number
  sessionCount: number
  topicCount: number
  doneTopics: number
}

export interface TrendMetric {
  value: number
  deltaPct: number
}

export interface HeatmapDay {
  date: string
  seconds: number
  sessions: number
}

export function computeNextStreakGoal(streak: number): number {
  if (streak < 3) return 3
  if (streak < 7) return 7
  if (streak < 14) return 14
  return streak + 7
}

export function computeConsistencyScore(streak: number, totalSessions: number): number {
  return Math.min(100, Math.round(streak * 6 + Math.min(totalSessions, 20) * 3))
}

export function computeCompletionRate(topicCount: number, doneTopics: number): number {
  return topicCount ? (doneTopics / topicCount) * 100 : 0
}

export function computeConcentrationRate(topSubjectSeconds: number, totalSeconds: number): number {
  return totalSeconds ? (topSubjectSeconds / totalSeconds) * 100 : 0
}

export function summarizeSubjects(subjects: SubjectWithTopics[]): SubjectSummary[] {
  return subjects.map((subject) => {
    const totalSeconds = subject.topics.reduce((sum, topic) => sum + topic.totalTime, 0)
    const sessionCount = subject.topics.reduce((sum, topic) => sum + topic.sessionCount, 0)
    const doneTopics = subject.topics.filter((topic) => topic.status === 'DONE').length

    return {
      id: subject.id,
      name: subject.name,
      color: subject.color,
      icon: subject.icon,
      totalSeconds,
      sessionCount,
      topicCount: subject.topics.length,
      doneTopics,
    }
  })
}

export function getTopTopics(subjects: SubjectWithTopics[], limit = 6) {
  return subjects
    .flatMap((subject) =>
      subject.topics.map((topic) => ({
        id: topic.id,
        name: topic.name,
        subjectName: subject.name,
        totalSeconds: topic.totalTime,
        sessions: topic.sessionCount,
      }))
    )
    .sort((a, b) => b.totalSeconds - a.totalSeconds)
    .slice(0, limit)
}

function deltaPct(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return Math.round(((current - previous) / previous) * 100)
}

export function computeTrends(
  sessions: SessionSlice[],
  now: Date
): { xp: TrendMetric; focusSeconds: TrendMetric; sessions: TrendMetric } {
  const currentStart = now.getTime() - TREND_WINDOW_DAYS * DAY_MS
  const previousStart = now.getTime() - 2 * TREND_WINDOW_DAYS * DAY_MS

  const current = sessions.filter((session) => session.createdAt.getTime() >= currentStart)
  const previous = sessions.filter(
    (session) =>
      session.createdAt.getTime() >= previousStart && session.createdAt.getTime() < currentStart
  )

  const sum = (rows: SessionSlice[], key: 'xpEarned' | 'duration') =>
    rows.reduce((total, row) => total + row[key], 0)

  const currentXp = sum(current, 'xpEarned')
  const previousXp = sum(previous, 'xpEarned')
  const currentFocus = sum(current, 'duration')
  const previousFocus = sum(previous, 'duration')

  return {
    xp: { value: currentXp, deltaPct: deltaPct(currentXp, previousXp) },
    focusSeconds: { value: currentFocus, deltaPct: deltaPct(currentFocus, previousFocus) },
    sessions: { value: current.length, deltaPct: deltaPct(current.length, previous.length) },
  }
}

export function buildHeatmap(sessions: SessionSlice[], timezone: string, now: Date): HeatmapDay[] {
  const buckets = new Map<string, { seconds: number; sessions: number }>()

  for (let i = HEATMAP_DAYS - 1; i >= 0; i--) {
    const date = new Date(now.getTime() - i * DAY_MS)
    buckets.set(getDateKeyInTimeZone(date, timezone), { seconds: 0, sessions: 0 })
  }

  for (const session of sessions) {
    const key = getDateKeyInTimeZone(session.createdAt, timezone)
    const bucket = buckets.get(key)
    if (!bucket) continue
    bucket.seconds += session.duration
    bucket.sessions += 1
  }

  return Array.from(buckets.entries()).map(([date, bucket]) => ({ date, ...bucket }))
}

export interface StatsResponse {
  totals: { xp: number; level: number; focusSeconds: number; sessions: number }
  trends: { xp: TrendMetric; focusSeconds: TrendMetric; sessions: TrendMetric }
  levelProgress: ReturnType<typeof getLevelProgress>
  streak: { current: number; nextGoal: number }
  insights: { consistencyScore: number; completionRate: number; concentrationRate: number }
  subjects: SubjectSummary[]
  topTopics: ReturnType<typeof getTopTopics>
  heatmap: { days: HeatmapDay[] }
  topSubject: SubjectSummary | null
}

export async function getStats(user: User): Promise<StatsResponse> {
  const now = new Date()
  const since = new Date(now.getTime() - HEATMAP_DAYS * DAY_MS)

  const [subjects, sessions] = await Promise.all([
    statsRepository.findSubjectsWithTopics(prisma, user.id),
    statsRepository.findRecentSessions(prisma, user.id, since),
  ])

  const subjectSummaries = summarizeSubjects(subjects).sort(
    (a, b) => b.totalSeconds - a.totalSeconds
  )
  const totalSeconds = subjectSummaries.reduce((sum, subject) => sum + subject.totalSeconds, 0)
  const totalSessions = subjectSummaries.reduce((sum, subject) => sum + subject.sessionCount, 0)
  const topicCount = subjectSummaries.reduce((sum, subject) => sum + subject.topicCount, 0)
  const doneTopics = subjectSummaries.reduce((sum, subject) => sum + subject.doneTopics, 0)
  const topSubject = subjectSummaries[0] ?? null

  const levelProgress = getLevelProgress(user.totalXP)

  return {
    totals: {
      xp: user.totalXP,
      level: levelProgress.level,
      focusSeconds: totalSeconds,
      sessions: totalSessions,
    },
    trends: computeTrends(sessions, now),
    levelProgress,
    streak: { current: user.streak, nextGoal: computeNextStreakGoal(user.streak) },
    insights: {
      consistencyScore: computeConsistencyScore(user.streak, totalSessions),
      completionRate: computeCompletionRate(topicCount, doneTopics),
      concentrationRate: computeConcentrationRate(topSubject?.totalSeconds ?? 0, totalSeconds),
    },
    subjects: subjectSummaries,
    topTopics: getTopTopics(subjects),
    heatmap: { days: buildHeatmap(sessions, user.timezone, now) },
    topSubject,
  }
}
