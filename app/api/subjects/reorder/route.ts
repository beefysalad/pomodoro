import { withAuth, AuthContext } from '@/lib/with-auth-guard'
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { z } from 'zod'
import { DEFAULT_MUTATION_RATE_LIMIT } from '@/lib/rate-limit'

const ReorderSchemaApi = z.object({
  updates: z.array(
    z.object({
      id: z.string(),
      position: z.number(),
    })
  ),
})

export const PATCH = withAuth(
  async (req: NextRequest, { user }: AuthContext) => {
    try {
      const body = await req.json()
      const { updates } = ReorderSchemaApi.parse(body)

      await prisma.$transaction(
        updates.map((update) =>
          prisma.subject.updateMany({
            where: {
              id: update.id,
              userId: user.id,
            },
            data: {
              position: update.position,
            },
          })
        )
      )

      return NextResponse.json({ success: true })
    } catch (error) {
      console.error('Subject reorder error:', error)
      return NextResponse.json(
        { error: 'Internal Server Error' },
        { status: 500 }
      )
    }
  },
  { rateLimit: DEFAULT_MUTATION_RATE_LIMIT }
)
