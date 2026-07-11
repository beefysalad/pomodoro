import { withAuth, AuthContext } from '@/lib/with-auth-guard'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { DEFAULT_MUTATION_RATE_LIMIT } from '@/lib/rate-limit'
import { updateCard, deleteCard } from '@/lib/services/flashcard-service'

const UpdateFlashcardSchema = z.object({
  question: z.string().min(1).optional(),
  answer: z.string().min(1).optional(),
  hint: z.string().optional().nullable(),
  choices: z.array(z.string().min(1)).optional(),
  status: z.string().optional(),
  lastReviewedAt: z.string().datetime().optional().nullable(),
})

export const PATCH = withAuth(
  async (req: NextRequest, { user, params }: AuthContext) => {
    const deckId = params?.deckId
    const cardId = params?.cardId
    if (!deckId || !cardId) {
      return NextResponse.json({ error: 'Flashcard not found or unauthorized' }, { status: 404 })
    }

    const body = await req.json()
    const parsed = UpdateFlashcardSchema.parse(body)
    const card = await updateCard(user.id, deckId, cardId, parsed)
    return NextResponse.json({ card })
  },
  { rateLimit: DEFAULT_MUTATION_RATE_LIMIT }
)

export const DELETE = withAuth(
  async (_req: NextRequest, { user, params }: AuthContext) => {
    const deckId = params?.deckId
    const cardId = params?.cardId
    if (!deckId || !cardId) {
      return NextResponse.json({ error: 'Flashcard not found or unauthorized' }, { status: 404 })
    }

    await deleteCard(user.id, deckId, cardId)
    return NextResponse.json({ success: true })
  },
  { rateLimit: DEFAULT_MUTATION_RATE_LIMIT }
)
