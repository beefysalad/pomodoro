import type { Db } from '@/lib/db'

export interface SubjectWithTopics {
  id: string
  name: string
  color: string
  icon: string | null
  topics: Array<{
    id: string
    name: string
    status: string
    totalTime: number
    sessionCount: number
  }>
}

export interface SessionSlice {
  createdAt: Date
  duration: number
  xpEarned: number
}

export function findSubjectsWithTopics(db: Db, userId: string): Promise<SubjectWithTopics[]> {
  return db.subject.findMany({
    where: { userId },
    select: {
      id: true,
      name: true,
      color: true,
      icon: true,
      topics: {
        select: {
          id: true,
          name: true,
          status: true,
          totalTime: true,
          sessionCount: true,
        },
      },
    },
  })
}

export function findRecentSessions(db: Db, userId: string, since: Date): Promise<SessionSlice[]> {
  return db.session.findMany({
    where: { userId, createdAt: { gte: since } },
    select: { createdAt: true, duration: true, xpEarned: true },
    orderBy: { createdAt: 'asc' },
  })
}
