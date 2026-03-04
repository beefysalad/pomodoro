import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import prisma from './prisma'
import { User } from '@/app/generated/prisma/client'

export interface AuthContext {
  user: User
  params: Record<string, string>
}

export function withAuth(
  handler: (req: NextRequest, context: AuthContext) => Promise<NextResponse>
) {
  return async (
    req: NextRequest,
    context: {
      params?: Promise<Record<string, string>> | Record<string, string>
    }
  ): Promise<NextResponse> => {
    try {
      const { userId: clerkUserId } = await auth()

      if (!clerkUserId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const user = await prisma.user.findUnique({
        where: { clerkUserId },
      })

      if (!user) {
        return NextResponse.json(
          { error: 'User not found in database' },
          { status: 404 }
        )
      }

      const resolvedParams =
        context?.params instanceof Promise
          ? await context.params
          : context?.params || {}

      const authContext: AuthContext = {
        user,
        params: resolvedParams,
      }

      return await handler(req, authContext)
    } catch (error) {
      console.error('Auth helper error:', error)
      return NextResponse.json(
        { error: 'Internal Server Error' },
        { status: 500 }
      )
    }
  }
}
