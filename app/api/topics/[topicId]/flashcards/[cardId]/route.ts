import { withAuth, AuthContext } from '@/lib/with-auth-guard'
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { z } from 'zod'

const UpdateFlashcardSchema = z.object({
  question: z.string().min(1).optional(),
  answer: z.string().min(1).optional(),
  hint: z.string().optional().nullable(),
  choices: z.array(z.string().min(1)).optional(),
  status: z.string().optional(),
  lastReviewedAt: z.string().datetime().optional().nullable(),
})

async function assertOwnedCard(
  userId: string,
  deckId?: string,
  cardId?: string
) {
  if (!deckId || !cardId) return null
  const card = await prisma.flashcard.findUnique({
    where: { id: cardId },
    include: { deck: { include: { subject: true } } },
  })
  if (!card) return null
  if (card.deckId !== deckId || card.deck.subject.userId !== userId) return null
  return card
}

export const PATCH = withAuth(
  async (req: NextRequest, { user, params }: AuthContext) => {
    try {
      const deckId = params?.topicId
      const cardId = params?.cardId

      const owned = await assertOwnedCard(user.id, deckId, cardId)
      if (!owned || !cardId) {
        return NextResponse.json(
          { error: 'Flashcard not found or unauthorized' },
          { status: 403 }
        )
      }

      const body = await req.json()
      const parsed = UpdateFlashcardSchema.parse(body)

      const rawChoices = parsed.choices
        ?.map((choice) => choice.trim())
        .filter(Boolean)
      const uniqueChoices = rawChoices
        ? Array.from(new Set(rawChoices))
        : undefined
      const withAnswer =
        uniqueChoices && parsed.answer
          ? uniqueChoices.includes(parsed.answer)
            ? uniqueChoices
            : [...uniqueChoices, parsed.answer]
          : uniqueChoices

      const card = await prisma.flashcard.update({
        where: { id: cardId },
        data: {
          ...(parsed.question !== undefined && { question: parsed.question }),
          ...(parsed.answer !== undefined && { answer: parsed.answer }),
          ...(parsed.hint !== undefined && { hint: parsed.hint }),
          ...(withAnswer !== undefined && { choices: withAnswer.slice(0, 6) }),
          ...(parsed.status !== undefined && { status: parsed.status }),
          ...(parsed.lastReviewedAt !== undefined && {
            lastReviewedAt: parsed.lastReviewedAt
              ? new Date(parsed.lastReviewedAt)
              : null,
          }),
        },
      })

      return NextResponse.json({ card })
    } catch (error) {
      console.error('Flashcard update error:', error)
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
      const deckId = params?.topicId
      const cardId = params?.cardId

      const owned = await assertOwnedCard(user.id, deckId, cardId)
      if (!owned || !cardId) {
        return NextResponse.json(
          { error: 'Flashcard not found or unauthorized' },
          { status: 403 }
        )
      }

      await prisma.flashcard.delete({ where: { id: cardId } })
      return NextResponse.json({ success: true })
    } catch (error) {
      console.error('Flashcard delete error:', error)
      return NextResponse.json(
        { error: 'Internal Server Error' },
        { status: 500 }
      )
    }
  }
)
