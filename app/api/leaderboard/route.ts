import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { withAuth, type AuthContext } from '@/lib/with-auth-guard'
import { getLevelFromXp } from '@/lib/progression'

const CACHE_TTL_MS = 1000 * 60 * 3
type WeeklyRankRow = {
  rank: number
  sessions: number
  totalSeconds: number
  weeklyXP: number
}
type LeaderboardCache = {
  cachedAt: number
  weekStartIso: string
  globalTop: Array<{
    rank: number
    userId: string
    name: string
    totalXP: number
    level: number
    streak: number
  }>
  weeklyTop: Array<{
    rank: number
    userId: string
    name: string
    sessions: number
    focusMinutes: number
    weeklyXP: number
  }>
  weeklyRankByUser: Record<string, WeeklyRankRow>
}
let leaderboardCache: LeaderboardCache | null = null

function getDisplayName(user: {
  firstName: string | null
  lastName: string | null
  email: string
}) {
  const full = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim()
  if (full) return full
  return user.email.split('@')[0]
}

function rankWithTies<T>(
  rows: T[],
  getSortValue: (row: T) => number
): Array<T & { rank: number }> {
  let previousValue: number | null = null
  let previousRank = 0

  return rows.map((row, index) => {
    const value = getSortValue(row)
    const rank =
      previousValue === null || value !== previousValue ? index + 1 : previousRank
    previousValue = value
    previousRank = rank
    return { ...row, rank }
  })
}

function getCurrentWeekStartUtc() {
  const now = new Date()
  const day = now.getUTCDay() // 0(Sun)-6(Sat)
  const diffToMonday = day === 0 ? 6 : day - 1
  return new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() - diffToMonday,
      0,
      0,
      0,
      0
    )
  )
}

export const GET = withAuth(
  async (_req: NextRequest, { user }: AuthContext) => {
    try {
      const weekStart = getCurrentWeekStartUtc()
      const weekStartIso = weekStart.toISOString()
      const topLimit = 50

      const cacheIsFresh =
        leaderboardCache &&
        Date.now() - leaderboardCache.cachedAt < CACHE_TTL_MS &&
        leaderboardCache.weekStartIso === weekStartIso

      if (!cacheIsFresh) {
        const topUsers = await prisma.user.findMany({
          orderBy: [{ totalXP: 'desc' }, { createdAt: 'asc' }],
          take: topLimit,
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

        const globalTop = rankWithTies(topUsers, (row) => row.totalXP).map((row) => ({
          rank: row.rank,
          userId: row.id,
          name: getDisplayName(row),
          totalXP: row.totalXP,
          level: getLevelFromXp(row.totalXP),
          streak: row.streak,
        }))

        const weeklySnapshots = await prisma.weeklyLeaderboardSnapshot.findMany({
          where: { weekStart },
          orderBy: { rank: 'asc' },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        })

        const weeklyTop = weeklySnapshots.slice(0, topLimit).map((row) => ({
          rank: row.rank,
          userId: row.userId,
          name: getDisplayName(row.user),
          sessions: row.sessions,
          focusMinutes: row.focusMinutes,
          weeklyXP: row.xpGained,
        }))

        const weeklyRankByUser: Record<string, WeeklyRankRow> = {}
        for (const row of weeklySnapshots) {
          weeklyRankByUser[row.userId] = {
            rank: row.rank,
            sessions: row.sessions,
            totalSeconds: row.focusMinutes * 60,
            weeklyXP: row.xpGained,
          }
        }

        leaderboardCache = {
          cachedAt: Date.now(),
          weekStartIso,
          globalTop,
          weeklyTop,
          weeklyRankByUser,
        }
      }

      const { globalTop, weeklyTop, weeklyRankByUser } = leaderboardCache!

      const usersAboveMe = await prisma.user.count({
        where: {
          OR: [
            { totalXP: { gt: user.totalXP } },
            {
              totalXP: user.totalXP,
              createdAt: { lt: user.createdAt },
            },
          ],
        },
      })

      const meGlobal = {
        rank: usersAboveMe + 1,
        userId: user.id,
        name: getDisplayName(user),
        totalXP: user.totalXP,
        level: getLevelFromXp(user.totalXP),
        streak: user.streak,
      }

      const meWeeklyRaw = weeklyRankByUser[user.id]
      const meWeekly = meWeeklyRaw
        ? {
            rank: meWeeklyRaw.rank,
            userId: user.id,
            name: getDisplayName(user),
            sessions: meWeeklyRaw.sessions,
            focusMinutes: Math.floor(meWeeklyRaw.totalSeconds / 60),
            weeklyXP: meWeeklyRaw.weeklyXP,
          }
        : {
            rank: null,
            userId: user.id,
            name: getDisplayName(user),
            sessions: 0,
            focusMinutes: 0,
            weeklyXP: 0,
          }

      return NextResponse.json({
        generatedAt: new Date().toISOString(),
        weekStart: weekStartIso,
        global: {
          top: globalTop,
          me: meGlobal,
        },
        weekly: {
          top: weeklyTop,
          me: meWeekly,
        },
      })
    } catch (error) {
      console.error('Leaderboard error:', error)
      return NextResponse.json(
        { error: 'Internal Server Error' },
        { status: 500 }
      )
    }
  }
)
