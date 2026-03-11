import { withAuth, AuthContext } from '@/lib/with-auth-guard'
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { z } from 'zod'

const CreateFlashcardSchema = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
  hint: z.string().optional().nullable(),
  choices: z.array(z.string().min(1)).optional(),
})

async function assertOwnedDeck(userId: string, deckId?: string) {
  if (!deckId) return null
  const deck = await prisma.flashcardDeck.findUnique({
    where: { id: deckId },
    include: { subject: true },
  })
  if (!deck || deck.subject.userId !== userId) return null
  return deck
}

export const GET = withAuth(
  async (_req: NextRequest, { user, params }: AuthContext) => {
    try {
      const deckId = params?.topicId
      const deck = await assertOwnedDeck(user.id, deckId)
      if (!deck) {
        return NextResponse.json(
          { error: 'Deck not found or unauthorized' },
          { status: 403 }
        )
      }

      const cards = await prisma.flashcard.findMany({
        where: { deckId },
        orderBy: { createdAt: 'desc' },
      })

      return NextResponse.json({ cards })
    } catch (error) {
      console.error('Flashcard fetch error:', error)
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
      const deckId = params?.topicId
      const deck = await assertOwnedDeck(user.id, deckId)
      if (!deck || !deckId) {
        return NextResponse.json(
          { error: 'Deck not found or unauthorized' },
          { status: 403 }
        )
      }

      const body = await req.json()
      const parsed = CreateFlashcardSchema.parse(body)

      const rawChoices =
        parsed.choices?.map((choice) => choice.trim()).filter(Boolean) ?? []
      const uniqueChoices = Array.from(new Set(rawChoices))
      const withAnswer = uniqueChoices.includes(parsed.answer)
        ? uniqueChoices
        : [...uniqueChoices, parsed.answer]

      const card = await prisma.flashcard.create({
        data: {
          deckId,
          question: parsed.question,
          answer: parsed.answer,
          hint: parsed.hint ?? null,
          choices: withAnswer.slice(0, 6),
        },
      })

      return NextResponse.json({ card })
    } catch (error) {
      console.error('Flashcard create error:', error)
      return NextResponse.json(
        { error: 'Internal Server Error' },
        { status: 500 }
      )
    }
  }
)
