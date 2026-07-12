import prisma from '@/lib/prisma'
import * as leaderboardRepository from '@/lib/repositories/leaderboard-repository'
import { getLevelFromXp } from '@/lib/progression'
import type { User } from '@/app/generated/prisma/client'

const XP_PER_MINUTE = 1
const TOP_LIMIT = 50

export function getDisplayName(user: {
  firstName: string | null
  lastName: string | null
  email: string
}) {
  const full = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim()
  if (full) return full
  return user.email.split('@')[0]
}

export function rankWithTies<T>(
  rows: T[],
  getSortValue: (row: T) => number
): Array<T & { rank: number }> {
  let previousValue: number | null = null
  let previousRank = 0

  return rows.map((row, index) => {
    const value = getSortValue(row)
    const rank = previousValue === null || value !== previousValue ? index + 1 : previousRank
    previousValue = value
    previousRank = rank
    return { ...row, rank }
  })
}

function getCurrentWeekStartUtc() {
  const now = new Date()
  const day = now.getUTCDay()
  const diffToMonday = day === 0 ? 6 : day - 1
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - diffToMonday, 0, 0, 0, 0)
  )
}

interface WeeklyRankRow {
  rank: number
  sessions: number
  totalSeconds: number
  weeklyXP: number
}

export async function getLeaderboard(currentUser: User) {
  const weekStart = getCurrentWeekStartUtc()
  const weekStartIso = weekStart.toISOString()

  const topUsers = await leaderboardRepository.getTopUsersByXp(prisma, TOP_LIMIT)
  const globalTop = rankWithTies(topUsers, (row) => row.totalXP).map((row) => ({
    rank: row.rank,
    userId: row.id,
    name: getDisplayName(row),
    totalXP: row.totalXP,
    level: getLevelFromXp(row.totalXP),
    streak: row.streak,
  }))

  const weeklySnapshots = await leaderboardRepository.getWeeklySnapshotRows(prisma, weekStart)

  let weeklyTop: Array<{
    rank: number
    userId: string
    name: string
    sessions: number
    focusMinutes: number
    weeklyXP: number
  }> = []
  const weeklyRankByUser: Record<string, WeeklyRankRow> = {}

  if (weeklySnapshots.length > 0) {
    weeklyTop = weeklySnapshots.slice(0, TOP_LIMIT).map((row) => ({
      rank: row.rank,
      userId: row.userId,
      name: getDisplayName(row.user),
      sessions: row.sessions,
      focusMinutes: row.focusMinutes,
      weeklyXP: row.xpGained,
    }))

    for (const row of weeklySnapshots) {
      weeklyRankByUser[row.userId] = {
        rank: row.rank,
        sessions: row.sessions,
        totalSeconds: row.focusMinutes * 60,
        weeklyXP: row.xpGained,
      }
    }
  } else {
    const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000)
    const aggregates = await leaderboardRepository.getWeeklySessionAggregates(
      prisma,
      weekStart,
      weekEnd
    )

    const userIds = aggregates.map((row) => row.userId)
    const weeklyUsers = await leaderboardRepository.findUsersByIds(prisma, userIds)

    const weeklyRows = aggregates.map((row) => {
      const focusMinutes = Math.floor(row.totalDuration / 60)
      return {
        userId: row.userId,
        sessions: row.sessions,
        focusMinutes,
        weeklyXP: Math.max(0, focusMinutes * XP_PER_MINUTE),
      }
    })

    const ranked = rankWithTies(weeklyRows, (row) => row.weeklyXP)
      .sort((a, b) => b.weeklyXP - a.weeklyXP)
      .map((row, index) => ({ ...row, rank: row.rank ?? index + 1 }))

    weeklyTop = ranked.slice(0, TOP_LIMIT).map((row) => {
      const user = weeklyUsers.find((entry) => entry.id === row.userId)
      return {
        rank: row.rank,
        userId: row.userId,
        name: user ? getDisplayName(user) : 'Unknown',
        sessions: row.sessions,
        focusMinutes: row.focusMinutes,
        weeklyXP: row.weeklyXP,
      }
    })

    for (const row of ranked) {
      weeklyRankByUser[row.userId] = {
        rank: row.rank,
        sessions: row.sessions,
        totalSeconds: row.focusMinutes * 60,
        weeklyXP: row.weeklyXP,
      }
    }
  }

  const usersAboveMe = await leaderboardRepository.countUsersAbove(
    prisma,
    currentUser.totalXP,
    currentUser.createdAt
  )

  const meGlobal = {
    rank: usersAboveMe + 1,
    userId: currentUser.id,
    name: getDisplayName(currentUser),
    totalXP: currentUser.totalXP,
    level: getLevelFromXp(currentUser.totalXP),
    streak: currentUser.streak,
  }

  const meWeeklyRaw = weeklyRankByUser[currentUser.id]
  const meWeekly = meWeeklyRaw
    ? {
        rank: meWeeklyRaw.rank,
        userId: currentUser.id,
        name: getDisplayName(currentUser),
        sessions: meWeeklyRaw.sessions,
        focusMinutes: Math.floor(meWeeklyRaw.totalSeconds / 60),
        weeklyXP: meWeeklyRaw.weeklyXP,
      }
    : {
        rank: null,
        userId: currentUser.id,
        name: getDisplayName(currentUser),
        sessions: 0,
        focusMinutes: 0,
        weeklyXP: 0,
      }

  return {
    generatedAt: new Date().toISOString(),
    weekStart: weekStartIso,
    global: { top: globalTop, me: meGlobal },
    weekly: { top: weeklyTop, me: meWeekly },
  }
}
