import { withAuth, AuthContext } from '@/lib/with-auth-guard'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { DEFAULT_MUTATION_RATE_LIMIT } from '@/lib/rate-limit'
import { listDecksForSubject, createDeck } from '@/lib/services/flashcard-deck-service'

const CreateDeckSchema = z.object({
  name: z.string().min(1),
})

export const GET = withAuth(
  async (_req: NextRequest, { user, params }: AuthContext) => {
    const subjectId = params?.id
    if (!subjectId) {
      return NextResponse.json({ error: 'Subject ID is required' }, { status: 400 })
    }

    const decks = await listDecksForSubject(user.id, subjectId)
    return NextResponse.json({ decks })
  }
)

export const POST = withAuth(
  async (req: NextRequest, { user, params }: AuthContext) => {
    const subjectId = params?.id
    if (!subjectId) {
      return NextResponse.json({ error: 'Subject ID is required' }, { status: 400 })
    }

    const body = await req.json()
    const parsed = CreateDeckSchema.parse(body)
    const deck = await createDeck(user.id, subjectId, parsed.name)
    return NextResponse.json({ deck })
  },
  { rateLimit: DEFAULT_MUTATION_RATE_LIMIT }
)
