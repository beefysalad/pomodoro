import prisma from '@/lib/prisma'
import * as sessionRepository from '@/lib/repositories/session-repository'
import * as topicRepository from '@/lib/repositories/topic-repository'
import * as userRepository from '@/lib/repositories/user-repository'
import { getLevelFromXp, getNextStreak, MODE_XP } from '@/lib/progression'
import { NotFoundError } from '@/lib/errors'

export function resolveTimezone(candidate: string | null, fallback: string) {
  if (!candidate) return fallback
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: candidate }).format(new Date())
    return candidate
  } catch {
    return fallback
  }
}

export interface RecordSessionInput {
  topicId: string
  mode: 'blitz' | 'focus' | 'deep'
  duration: number
  rating: number
}

export async function recordSession(
  userId: string,
  input: RecordSessionInput,
  timezoneHeader: string | null
) {
  const now = new Date()
  const xpAwarded = MODE_XP[input.mode]

  const topic = await topicRepository.findByIdWithSubject(prisma, input.topicId)
  if (!topic || topic.subject.userId !== userId) {
    throw new NotFoundError('Topic not found or unauthorized')
  }

  return prisma.$transaction(async (tx) => {
    // Lock the user row for the duration of the transaction so concurrent
    // session submissions (multiple tabs/devices) can't both read the same
    // starting totalXP/streak and clobber each other's write.
    const lockedUser = await userRepository.lockForUpdate(tx, userId)
    if (!lockedUser) {
      throw new Error('User not found')
    }

    const timezone = resolveTimezone(timezoneHeader, lockedUser.timezone || 'UTC')
    const previousLevel = getLevelFromXp(lockedUser.totalXP)
    const newTotalXP = lockedUser.totalXP + xpAwarded
    const newLevel = getLevelFromXp(newTotalXP)
    const nextStreak = getNextStreak({
      currentStreak: lockedUser.streak,
      lastStudiedAt: lockedUser.lastStudiedAt,
      timezone,
      now,
    })

    const session = await sessionRepository.create(tx, {
      userId,
      topicId: input.topicId,
      mode: input.mode,
      duration: input.duration,
      xpEarned: xpAwarded,
      rating: input.rating,
    })

    await topicRepository.incrementSessionStats(tx, input.topicId, {
      duration: input.duration,
      rating: input.rating,
      now,
    })

    await userRepository.updateProgression(tx, userId, {
      totalXP: newTotalXP,
      streak: nextStreak,
      lastStudiedAt: now,
      ...(timezone !== lockedUser.timezone ? { timezone } : {}),
    })

    return { session, xpAwarded, newTotalXP, previousLevel, newLevel, nextStreak }
  })
}
