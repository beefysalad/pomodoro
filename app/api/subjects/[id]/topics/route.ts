import { withAuth, AuthContext } from '@/lib/with-auth-guard'
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { z } from 'zod'

const CreateTopicSchema = z.object({
  name: z.string().min(1),
})

export const GET = withAuth(
  async (req: NextRequest, { user, params }: AuthContext) => {
    try {
      const subjectId = params?.id
      if (!subjectId) {
        return NextResponse.json(
          { error: 'Subject ID is required' },
          { status: 400 }
        )
      }

      const subject = await prisma.subject.findUnique({
        where: { id: subjectId },
        include: {
          topics: { orderBy: { position: 'asc' } },
        },
      })

      if (!subject || subject.userId !== user.id) {
        return NextResponse.json(
          { error: 'Subject not found or unauthorized' },
          { status: 403 }
        )
      }

      return NextResponse.json({ subject, topics: subject.topics })
    } catch (error) {
      console.error('Subject fetch error:', error)
      return NextResponse.json(
        { error: 'Internal Server Error' },
        { status: 500 }
      )
    }
  }
)

export const POST = withAuth(
  async (req: NextRequest, { user, params }: AuthContext) => {
    try {
      const subjectId = params?.id
      if (!subjectId) {
        return NextResponse.json(
          { error: 'Subject ID is required' },
          { status: 400 }
        )
      }

      // Verify the subject belongs to the user
      const subject = await prisma.subject.findUnique({
        where: { id: subjectId },
      })

      if (!subject || subject.userId !== user.id) {
        return NextResponse.json(
          { error: 'Subject not found or unauthorized' },
          { status: 403 }
        )
      }

      const body = await req.json()
      const parsed = CreateTopicSchema.parse(body)

      const lastTopic = await prisma.topic.findFirst({
        where: { subjectId },
        orderBy: { position: 'desc' },
        select: { position: true },
      })

      const newPosition = lastTopic ? lastTopic.position + 1 : 0

      const topic = await prisma.topic.create({
        data: {
          name: parsed.name,
          subjectId,
          position: newPosition,
        },
      })

      return NextResponse.json({ topic })
    } catch (error) {
      console.error('Topic create error:', error)
      return NextResponse.json(
        { error: 'Internal Server Error' },
        { status: 500 }
      )
    }
  }
)
