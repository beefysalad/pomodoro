import { withAuth, AuthContext } from '@/lib/with-auth-guard'
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { z } from 'zod'
import { TOPIC_STATUSES } from '@/lib/topic-status'

const UpdateTopicSchema = z.object({
  name: z.string().min(1).optional(),
  position: z.number().int().nonnegative().optional(),
  lastRating: z.number().int().min(1).max(3).nullable().optional(),
  status: z.enum(TOPIC_STATUSES).optional(),
})

async function assertOwnedTopic(
  userId: string,
  subjectId?: string,
  topicId?: string
) {
  if (!subjectId || !topicId) return null

  const topic = await prisma.topic.findUnique({
    where: { id: topicId },
    include: { subject: true },
  })

  if (!topic) return null
  if (topic.subjectId !== subjectId || topic.subject.userId !== userId) return null

  return topic
}

export const PATCH = withAuth(
  async (req: NextRequest, { user, params }: AuthContext) => {
    try {
      const subjectId = params?.id
      const topicId = params?.topicId

      const ownedTopic = await assertOwnedTopic(user.id, subjectId, topicId)
      if (!ownedTopic || !topicId) {
        return NextResponse.json(
          { error: 'Topic not found or unauthorized' },
          { status: 403 }
        )
      }

      const body = await req.json()
      const parsed = UpdateTopicSchema.parse(body)
      const statusUpdate =
        parsed.status === undefined
          ? {}
          : {
              status: parsed.status,
              statusUpdatedAt: new Date(),
              doneAt: parsed.status === 'DONE' ? new Date() : null,
            }

      const topic = await prisma.topic.update({
        where: { id: topicId },
        data: {
          ...parsed,
          ...statusUpdate,
        },
      })

      return NextResponse.json({ topic })
    } catch (error) {
      console.error('Topic update error:', error)
      return NextResponse.json(
        { error: 'Internal Server Error' },
        { status: 500 }
      )
    }
  }
)

export const DELETE = withAuth(
  async (req: NextRequest, { user, params }: AuthContext) => {
    try {
      const subjectId = params?.id
      const topicId = params?.topicId

      const ownedTopic = await assertOwnedTopic(user.id, subjectId, topicId)
      if (!ownedTopic || !topicId) {
        return NextResponse.json(
          { error: 'Topic not found or unauthorized' },
          { status: 403 }
        )
      }

      await prisma.topic.delete({
        where: { id: topicId },
      })

      return NextResponse.json({ success: true })
    } catch (error) {
      console.error('Topic delete error:', error)
      return NextResponse.json(
        { error: 'Internal Server Error' },
        { status: 500 }
      )
    }
  }
)
