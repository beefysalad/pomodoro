import { withAuth, AuthContext } from '@/lib/with-auth-guard'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { SESSION_CREATE_RATE_LIMIT } from '@/lib/rate-limit'
import { recordSession } from '@/lib/services/session-service'

const CreateSessionSchema = z.object({
  topicId: z.string().min(1),
  mode: z.enum(['blitz', 'focus', 'deep']),
  duration: z.number().int().positive(),
  rating: z.number().int().min(1).max(3),
})

export const POST = withAuth(
  async (req: NextRequest, { user }: AuthContext) => {
    const body = await req.json()
    const parsed = CreateSessionSchema.parse(body)

    const result = await recordSession(user.id, parsed, req.headers.get('x-timezone'))

    return NextResponse.json(
      {
        session: result.session,
        progression: {
          xpAwarded: result.xpAwarded,
          totalXP: result.newTotalXP,
          previousLevel: result.previousLevel,
          newLevel: result.newLevel,
          leveledUp: result.newLevel > result.previousLevel,
          streak: result.nextStreak,
        },
      },
      { status: 201 }
    )
  },
  { rateLimit: SESSION_CREATE_RATE_LIMIT }
)
