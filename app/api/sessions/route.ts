import { withAuth, AuthContext } from '@/lib/with-auth-guard'
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { z } from 'zod'

const CreateSessionSchema = z.object({
  topicId: z.string().min(1),
  mode: z.enum(['blitz', 'focus', 'deep']),
  duration: z.number().int().positive(), // seconds actually elapsed
  xpEarned: z.number().int().nonnegative(),
  rating: z.number().int().min(1).max(3),
})

export const POST = withAuth(
  async (req: NextRequest, { user }: AuthContext) => {
    try {
      const body = await req.json()
      const parsed = CreateSessionSchema.parse(body)

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
          xpEarned: parsed.xpEarned,
          rating: parsed.rating,
        },
      })

      // Update topic stats in the same transaction
      await prisma.$transaction([
        prisma.topic.update({
          where: { id: parsed.topicId },
          data: {
            sessionCount: { increment: 1 },
            totalTime: { increment: Math.round(parsed.duration / 60) }, // store as minutes
            lastRating: parsed.rating,
          },
        }),
        // Award XP and update streak for the user
        prisma.user.update({
          where: { id: user.id },
          data: {
            totalXP: { increment: parsed.xpEarned },
            lastStudiedAt: new Date(),
          },
        }),
      ])

      return NextResponse.json({ session }, { status: 201 })
    } catch (error) {
      console.error('Session create error:', error)
      return NextResponse.json(
        { error: 'Internal Server Error' },
        { status: 500 }
      )
    }
  }
)
