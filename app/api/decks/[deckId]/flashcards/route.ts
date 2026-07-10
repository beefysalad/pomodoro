import { withAuth, AuthContext } from '@/lib/with-auth-guard'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { DEFAULT_MUTATION_RATE_LIMIT } from '@/lib/rate-limit'
import { listCardsForDeck, createCard } from '@/lib/services/flashcard-service'

const CreateFlashcardSchema = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
  hint: z.string().optional().nullable(),
  choices: z.array(z.string().min(1)).optional(),
})

export const GET = withAuth(
  async (_req: NextRequest, { user, params }: AuthContext) => {
    const deckId = params?.deckId
    if (!deckId) {
      return NextResponse.json({ error: 'Deck not found or unauthorized' }, { status: 404 })
    }

    const cards = await listCardsForDeck(user.id, deckId)
    return NextResponse.json({ cards })
  }
)

export const POST = withAuth(
  async (req: NextRequest, { user, params }: AuthContext) => {
    const deckId = params?.deckId
    if (!deckId) {
      return NextResponse.json({ error: 'Deck not found or unauthorized' }, { status: 404 })
    }

    const body = await req.json()
    const parsed = CreateFlashcardSchema.parse(body)
    const card = await createCard(user.id, deckId, parsed)
    return NextResponse.json({ card })
  },
  { rateLimit: DEFAULT_MUTATION_RATE_LIMIT }
)
