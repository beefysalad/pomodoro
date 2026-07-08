import prisma from '@/lib/prisma'
import { withAuth, AuthContext } from '@/lib/with-auth-guard'
import { NextRequest, NextResponse } from 'next/server'
import { DEFAULT_MUTATION_RATE_LIMIT } from '@/lib/rate-limit'
export const DELETE = withAuth(
  async (req: NextRequest, { user, params }: AuthContext) => {
    try {
      const id = params?.id
      if (!id) {
        return NextResponse.json(
          { error: 'Subject ID is required' },
          { status: 400 }
        )
      }

      await prisma.subject.delete({
        where: {
          id,
          userId: user.id,
        },
      })

      return NextResponse.json({ success: true })
    } catch (error) {
      console.error('Subject delete error:', error)
      return NextResponse.json(
        { error: 'Internal Server Error' },
        { status: 500 }
      )
    }
  },
  { rateLimit: DEFAULT_MUTATION_RATE_LIMIT }
)
