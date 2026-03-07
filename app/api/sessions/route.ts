import { withAuth, AuthContext } from '@/lib/with-auth-guard'
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { z } from 'zod'
import { getLevelFromXp, getNextStreak, MODE_XP } from '@/lib/progression'

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

export const POST = withAuth(
  async (req: NextRequest, { user }: AuthContext) => {
    try {
      const body = await req.json()
      const parsed = CreateSessionSchema.parse(body)
      const now = new Date()
      const timezone = resolveTimezone(
        req.headers.get('x-timezone'),
        user.timezone || 'UTC'
      )
      const xpAwarded = MODE_XP[parsed.mode]
      const previousLevel = getLevelFromXp(user.totalXP)
      const newTotalXP = user.totalXP + xpAwarded
      const newLevel = getLevelFromXp(newTotalXP)
      const nextStreak = getNextStreak({
        currentStreak: user.streak,
        lastStudiedAt: user.lastStudiedAt,
        timezone,
        now,
      })

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

      // Create the session
      const session = await prisma.session.create({
        data: {
          userId: user.id,
          topicId: parsed.topicId,
          mode: parsed.mode,
          duration: parsed.duration,
          xpEarned: xpAwarded,
          rating: parsed.rating,
        },
      })

      // Update topic stats in the same transaction
      await prisma.$transaction([
        prisma.topic.update({
          where: { id: parsed.topicId },
          data: {
            sessionCount: { increment: 1 },
            totalTime: { increment: parsed.duration }, // store as seconds
            lastRating: parsed.rating,
            status: 'IN_PROGRESS',
            statusUpdatedAt: now,
            doneAt: null,
          },
        }),
        // Award XP and update streak for the user
        prisma.user.update({
          where: { id: user.id },
          data: {
            totalXP: newTotalXP,
            streak: nextStreak,
            lastStudiedAt: now,
            ...(timezone !== user.timezone ? { timezone } : {}),
          },
        }),
      ])

      return NextResponse.json(
        {
          session,
          progression: {
            xpAwarded,
            totalXP: newTotalXP,
            previousLevel,
            newLevel,
            leveledUp: newLevel > previousLevel,
            streak: nextStreak,
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
  }
)
