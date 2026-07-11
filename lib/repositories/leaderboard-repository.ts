import type { Db } from '@/lib/db'

const CACHE_TTL_MS = 1000 * 60 * 3

export interface TopUserRow {
  id: string
  firstName: string | null
  lastName: string | null
  email: string
  totalXP: number
  streak: number
  createdAt: Date
}

let topUsersCache: { cachedAt: number; rows: TopUserRow[] } | null = null

export async function getTopUsersByXp(db: Db, limit: number): Promise<TopUserRow[]> {
  const now = Date.now()
  if (topUsersCache && now - topUsersCache.cachedAt < CACHE_TTL_MS) {
    return topUsersCache.rows
  }

  const rows = await db.user.findMany({
    orderBy: [{ totalXP: 'desc' }, { createdAt: 'asc' }],
    take: limit,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      totalXP: true,
      streak: true,
      createdAt: true,
    },
  })

  topUsersCache = { cachedAt: now, rows }
  return rows
}

export interface WeeklySnapshotRow {
  userId: string
  rank: number
  sessions: number
  focusMinutes: number
  xpGained: number
  user: { firstName: string | null; lastName: string | null; email: string }
}

let weeklySnapshotsCache: { cachedAt: number; weekStartIso: string; rows: WeeklySnapshotRow[] } | null =
  null

export async function getWeeklySnapshotRows(db: Db, weekStart: Date): Promise<WeeklySnapshotRow[]> {
  const now = Date.now()
  const weekStartIso = weekStart.toISOString()

  if (
    weeklySnapshotsCache &&
    now - weeklySnapshotsCache.cachedAt < CACHE_TTL_MS &&
    weeklySnapshotsCache.weekStartIso === weekStartIso
  ) {
    return weeklySnapshotsCache.rows
  }

  const rows = await db.weeklyLeaderboardSnapshot.findMany({
    where: { weekStart },
    orderBy: { rank: 'asc' },
    include: {
      user: {
        select: { firstName: true, lastName: true, email: true },
      },
    },
  })

  weeklySnapshotsCache = { cachedAt: now, weekStartIso, rows }
  return rows
}

export interface WeeklySessionAggregateRow {
  userId: string
  sessions: number
  totalDuration: number
}

let weeklyAggregatesCache: {
  cachedAt: number
  weekStartIso: string
  rows: WeeklySessionAggregateRow[]
} | null = null

export async function getWeeklySessionAggregates(
  db: Db,
  weekStart: Date,
  weekEnd: Date
): Promise<WeeklySessionAggregateRow[]> {
  const now = Date.now()
  const weekStartIso = weekStart.toISOString()

  if (
    weeklyAggregatesCache &&
    now - weeklyAggregatesCache.cachedAt < CACHE_TTL_MS &&
    weeklyAggregatesCache.weekStartIso === weekStartIso
  ) {
    return weeklyAggregatesCache.rows
  }

  const groups = await db.session.groupBy({
    by: ['userId'],
    where: { createdAt: { gte: weekStart, lt: weekEnd } },
    _count: { _all: true },
    _sum: { duration: true },
  })

  const rows = groups.map((row) => ({
    userId: row.userId,
    sessions: row._count._all,
    totalDuration: row._sum.duration ?? 0,
  }))

  weeklyAggregatesCache = { cachedAt: now, weekStartIso, rows }
  return rows
}

export function findUsersByIds(db: Db, ids: string[]) {
  return db.user.findMany({
    where: { id: { in: ids } },
    select: { id: true, firstName: true, lastName: true, email: true },
  })
}

export function countUsersAbove(db: Db, totalXP: number, createdAt: Date): Promise<number> {
  return db.user.count({
    where: {
      OR: [{ totalXP: { gt: totalXP } }, { totalXP, createdAt: { lt: createdAt } }],
    },
  })
}
