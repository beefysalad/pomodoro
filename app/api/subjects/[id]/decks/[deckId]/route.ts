import { withAuth, AuthContext } from '@/lib/with-auth-guard'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { DEFAULT_MUTATION_RATE_LIMIT } from '@/lib/rate-limit'
import { updateDeck, deleteDeck } from '@/lib/services/flashcard-deck-service'

const UpdateDeckSchema = z.object({
  name: z.string().min(1),
})

export const PATCH = withAuth(
  async (req: NextRequest, { user, params }: AuthContext) => {
    const subjectId = params?.id
    const deckId = params?.deckId
    if (!subjectId || !deckId) {
      return NextResponse.json({ error: 'Subject ID and Deck ID are required' }, { status: 400 })
    }

    const body = await req.json()
    const parsed = UpdateDeckSchema.parse(body)
    const deck = await updateDeck(user.id, subjectId, deckId, parsed.name)
    return NextResponse.json({ deck })
  },
  { rateLimit: DEFAULT_MUTATION_RATE_LIMIT }
)

export const DELETE = withAuth(
  async (_req: NextRequest, { user, params }: AuthContext) => {
    const subjectId = params?.id
    const deckId = params?.deckId
    if (!subjectId || !deckId) {
      return NextResponse.json({ error: 'Subject ID and Deck ID are required' }, { status: 400 })
    }

    await deleteDeck(user.id, subjectId, deckId)
    return new NextResponse(null, { status: 204 })
  },
  { rateLimit: DEFAULT_MUTATION_RATE_LIMIT }
)
