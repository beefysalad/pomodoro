import { withAuth, AuthContext } from '@/lib/with-auth-guard'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { DEFAULT_MUTATION_RATE_LIMIT } from '@/lib/rate-limit'
import { listTopicsForSubject, createTopic } from '@/lib/services/topic-service'

const CreateTopicSchema = z.object({
  name: z.string().min(1),
})

export const GET = withAuth(
  async (req: NextRequest, { user, params }: AuthContext) => {
    const subjectId = params?.id
    if (!subjectId) {
      return NextResponse.json({ error: 'Subject ID is required' }, { status: 400 })
    }

    const { subject, topics } = await listTopicsForSubject(user.id, subjectId)
    return NextResponse.json({
      subject: { ...subject, topics },
      topics,
    })
  }
)

export const POST = withAuth(
  async (req: NextRequest, { user, params }: AuthContext) => {
    const subjectId = params?.id
    if (!subjectId) {
      return NextResponse.json({ error: 'Subject ID is required' }, { status: 400 })
    }

    const body = await req.json()
    const parsed = CreateTopicSchema.parse(body)
    const topic = await createTopic(user.id, subjectId, parsed)
    return NextResponse.json({ topic })
  },
  { rateLimit: DEFAULT_MUTATION_RATE_LIMIT }
)
