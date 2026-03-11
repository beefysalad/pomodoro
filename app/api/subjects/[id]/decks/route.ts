import { withAuth, AuthContext } from '@/lib/with-auth-guard'
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { z } from 'zod'

const CreateDeckSchema = z.object({
  name: z.string().min(1),
})

export const GET = withAuth(
  async (_req: NextRequest, { user, params }: AuthContext) => {
    try {
      const subjectId = params?.id
      if (!subjectId) {
        return NextResponse.json(
          { error: 'Subject ID is required' },
          { status: 400 }
        )
      }

      const subject = await prisma.subject.findUnique({ where: { id: subjectId } })
      if (!subject || subject.userId !== user.id) {
        return NextResponse.json(
          { error: 'Subject not found or unauthorized' },
          { status: 403 }
        )
      }

      const decks = await prisma.flashcardDeck.findMany({
        where: { subjectId },
        orderBy: { createdAt: 'desc' },
      })

      return NextResponse.json({ decks })
    } catch (error) {
      console.error('Deck fetch error:', error)
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

      const subject = await prisma.subject.findUnique({ where: { id: subjectId } })
      if (!subject || subject.userId !== user.id) {
        return NextResponse.json(
          { error: 'Subject not found or unauthorized' },
          { status: 403 }
        )
      }

      const body = await req.json()
      const parsed = CreateDeckSchema.parse(body)

      const deck = await prisma.flashcardDeck.create({
        data: {
          name: parsed.name,
          subjectId,
        },
      })

      return NextResponse.json({ deck })
    } catch (error) {
      console.error('Deck create error:', error)
      return NextResponse.json(
        { error: 'Internal Server Error' },
        { status: 500 }
      )
    }
  }
)
