import { withAuth, AuthContext } from '@/lib/with-auth-guard'
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { z } from 'zod'
import { getLevelFromXp, getNextStreak, MODE_XP } from '@/lib/progression'
import { SESSION_CREATE_RATE_LIMIT } from '@/lib/rate-limit'

const CreateSessionSchema = z.object({
  topicId: z.string().min(1),
  mode: z.enum(['blitz', 'focus', 'deep']),
  duration: z.number().int().positive(), // seconds actually elapsed
  rating: z.number().int().min(1).max(3),
})

function resolveTimezone(candidate: string | null, fallback: string) {
  if (!candidate) return fallback
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: candidate }).format(new Date())
    return candidate
  } catch {
    return fallback
  }
}

interface LockedUserRow {
  totalXP: number
  streak: number
  lastStudiedAt: Date | null
  timezone: string
}

export const POST = withAuth(
  async (req: NextRequest, { user }: AuthContext) => {
    try {
      const body = await req.json()
      const parsed = CreateSessionSchema.parse(body)
      const now = new Date()
      const xpAwarded = MODE_XP[parsed.mode]

      // Verify topic belongs to user
      const topic = await prisma.topic.findUnique({
        where: { id: parsed.topicId },
        include: { subject: true },
      })

      if (!topic || topic.subject.userId !== user.id) {
        return NextResponse.json(
          { error: 'Topic not found or unauthorized' },
          { status: 403 }
        )
      }

      const result = await prisma.$transaction(async (tx) => {
        // Lock the user row for the duration of the transaction so concurrent
        // session submissions (multiple tabs/devices) can't both read the same
        // starting totalXP/streak and clobber each other's write. Without this,
        // "increment" on totalXP alone would be safe, but streak (which depends
        // on lastStudiedAt) is a read-modify-write that needs serializing.
        const [lockedUser] = await tx.$queryRaw<LockedUserRow[]>`
          SELECT "totalXP", streak, "lastStudiedAt", timezone
          FROM "User"
          WHERE id = ${user.id}
          FOR UPDATE
        `

        if (!lockedUser) {
          throw new Error('User not found')
        }

        const timezone = resolveTimezone(
          req.headers.get('x-timezone'),
          lockedUser.timezone || 'UTC'
        )
        const previousLevel = getLevelFromXp(lockedUser.totalXP)
        const newTotalXP = lockedUser.totalXP + xpAwarded
        const newLevel = getLevelFromXp(newTotalXP)
        const nextStreak = getNextStreak({
          currentStreak: lockedUser.streak,
          lastStudiedAt: lockedUser.lastStudiedAt,
          timezone,
          now,
        })

        const session = await tx.session.create({
          data: {
            userId: user.id,
            topicId: parsed.topicId,
            mode: parsed.mode,
            duration: parsed.duration,
            xpEarned: xpAwarded,
            rating: parsed.rating,
          },
        })

        await tx.topic.update({
          where: { id: parsed.topicId },
          data: {
            sessionCount: { increment: 1 },
            totalTime: { increment: parsed.duration }, // store as seconds
            lastRating: parsed.rating,
            status: 'IN_PROGRESS',
            statusUpdatedAt: now,
            doneAt: null,
          },
        })

        await tx.user.update({
          where: { id: user.id },
          data: {
            totalXP: newTotalXP,
            streak: nextStreak,
            lastStudiedAt: now,
            ...(timezone !== lockedUser.timezone ? { timezone } : {}),
          },
        })

        return { session, xpAwarded, newTotalXP, previousLevel, newLevel, nextStreak }
      })

      return NextResponse.json(
        {
          session: result.session,
          progression: {
            xpAwarded: result.xpAwarded,
            totalXP: result.newTotalXP,
            previousLevel: result.previousLevel,
            newLevel: result.newLevel,
            leveledUp: result.newLevel > result.previousLevel,
            streak: result.nextStreak,
          },
        },
        { status: 201 }
      )
    } catch (error) {
      console.error('Session create error:', error)
      return NextResponse.json(
        { error: 'Internal Server Error' },
        { status: 500 }
      )
    }
  },
  { rateLimit: SESSION_CREATE_RATE_LIMIT }
)
