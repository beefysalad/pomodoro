import { withAuth, AuthContext } from '@/lib/with-auth-guard'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { TOPIC_STATUSES } from '@/lib/topic-status'
import { DEFAULT_MUTATION_RATE_LIMIT } from '@/lib/rate-limit'
import { updateTopic, deleteTopic } from '@/lib/services/topic-service'

const UpdateTopicSchema = z.object({
  name: z.string().min(1).optional(),
  position: z.number().int().nonnegative().optional(),
  lastRating: z.number().int().min(1).max(3).nullable().optional(),
  status: z.enum(TOPIC_STATUSES).optional(),
})

export const PATCH = withAuth(
  async (req: NextRequest, { user, params }: AuthContext) => {
    const subjectId = params?.id
    const topicId = params?.topicId
    if (!subjectId || !topicId) {
      return NextResponse.json({ error: 'Topic not found or unauthorized' }, { status: 404 })
    }

    const body = await req.json()
    const parsed = UpdateTopicSchema.parse(body)
    const topic = await updateTopic(user.id, subjectId, topicId, parsed)
    return NextResponse.json({ topic })
  },
  { rateLimit: DEFAULT_MUTATION_RATE_LIMIT }
)

export const DELETE = withAuth(
  async (req: NextRequest, { user, params }: AuthContext) => {
    const subjectId = params?.id
    const topicId = params?.topicId
    if (!subjectId || !topicId) {
      return NextResponse.json({ error: 'Topic not found or unauthorized' }, { status: 404 })
    }

    await deleteTopic(user.id, subjectId, topicId)
    return NextResponse.json({ success: true })
  },
  { rateLimit: DEFAULT_MUTATION_RATE_LIMIT }
)
