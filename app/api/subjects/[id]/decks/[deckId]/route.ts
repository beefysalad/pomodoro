import { withAuth, AuthContext } from '@/lib/with-auth-guard'
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { z } from 'zod'

const UpdateDeckSchema = z.object({
  name: z.string().min(1),
})

export const PATCH = withAuth(
  async (req: NextRequest, { user, params }: AuthContext) => {
    try {
      const subjectId = params?.id
      const deckId = params?.deckId

      if (!subjectId || !deckId) {
        return NextResponse.json(
          { error: 'Subject ID and Deck ID are required' },
          { status: 400 }
        )
      }

      const subject = await prisma.subject.findUnique({
        where: { id: subjectId },
      })
      if (!subject || subject.userId !== user.id) {
        return NextResponse.json(
          { error: 'Subject not found or unauthorized' },
          { status: 403 }
        )
      }

      const deck = await prisma.flashcardDeck.findUnique({
        where: { id: deckId },
      })
      if (!deck || deck.subjectId !== subjectId) {
        return NextResponse.json({ error: 'Deck not found' }, { status: 404 })
      }

      const body = await req.json()
      const parsed = UpdateDeckSchema.parse(body)

      const updatedDeck = await prisma.flashcardDeck.update({
        where: { id: deckId },
        data: { name: parsed.name },
      })

      return NextResponse.json({ deck: updatedDeck })
    } catch (error) {
      console.error('Deck update error:', error)
      return NextResponse.json(
        { error: 'Internal Server Error' },
        { status: 500 }
      )
    }
  }
)

export const DELETE = withAuth(
  async (_req: NextRequest, { user, params }: AuthContext) => {
    try {
      const subjectId = params?.id
      const deckId = params?.deckId

      if (!subjectId || !deckId) {
        return NextResponse.json(
          { error: 'Subject ID and Deck ID are required' },
          { status: 400 }
        )
      }

      const subject = await prisma.subject.findUnique({
        where: { id: subjectId },
      })
      if (!subject || subject.userId !== user.id) {
        return NextResponse.json(
          { error: 'Subject not found or unauthorized' },
          { status: 403 }
        )
      }

      const deck = await prisma.flashcardDeck.findUnique({
        where: { id: deckId },
      })
      if (!deck || deck.subjectId !== subjectId) {
        return NextResponse.json({ error: 'Deck not found' }, { status: 404 })
      }

      await prisma.flashcardDeck.delete({
        where: { id: deckId },
      })

      return new NextResponse(null, { status: 204 })
    } catch (error) {
      console.error('Deck delete error:', error)
      return NextResponse.json(
        { error: 'Internal Server Error' },
        { status: 500 }
      )
    }
  }
)
