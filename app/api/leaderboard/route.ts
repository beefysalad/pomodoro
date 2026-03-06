import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { withAuth, type AuthContext } from '@/lib/with-auth-guard'
import { getLevelFromXp } from '@/lib/progression'

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
      const topLimit = 50

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

      const weeklyGrouped = await prisma.session.groupBy({
        by: ['userId'],
        where: {
          createdAt: { gte: weekStart },
        },
        _count: { _all: true },
        _sum: { duration: true, xpEarned: true },
      })

      const weeklySorted = [...weeklyGrouped].sort((a, b) => {
        const bySessions = b._count._all - a._count._all
        if (bySessions !== 0) return bySessions
        const byXp = (b._sum.xpEarned ?? 0) - (a._sum.xpEarned ?? 0)
        if (byXp !== 0) return byXp
        return (b._sum.duration ?? 0) - (a._sum.duration ?? 0)
      })

      const weeklyTopIds = weeklySorted.slice(0, topLimit).map((row) => row.userId)
      const meInTop = weeklyTopIds.includes(user.id)
      const usersForWeekly = await prisma.user.findMany({
        where: {
          id: {
            in: meInTop ? weeklyTopIds : [...weeklyTopIds, user.id],
          },
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      })
      const userMap = new Map(usersForWeekly.map((item) => [item.id, item]))

      const weeklyRanked = rankWithTies(weeklySorted, (row) => row._count._all).map(
        (row) => ({
          rank: row.rank,
          userId: row.userId,
          sessions: row._count._all,
          totalSeconds: row._sum.duration ?? 0,
          weeklyXP: row._sum.xpEarned ?? 0,
        })
      )

      const weeklyTop = weeklyRanked.slice(0, topLimit).map((row) => {
        const person = userMap.get(row.userId)
        return {
          rank: row.rank,
          userId: row.userId,
          name: person ? getDisplayName(person) : 'Unknown user',
          sessions: row.sessions,
          focusMinutes: Math.floor(row.totalSeconds / 60),
          weeklyXP: row.weeklyXP,
        }
      })

      const meWeeklyRaw = weeklyRanked.find((row) => row.userId === user.id)
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
        weekStart: weekStart.toISOString(),
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
