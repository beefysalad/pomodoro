import { auth, currentUser } from '@clerk/nextjs/server'
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

      let resolvedUser = user
      if (!resolvedUser) {
        const clerkProfile = await currentUser()
        const email = clerkProfile?.emailAddresses?.[0]?.emailAddress

        if (!email) {
          return NextResponse.json(
            { error: 'User email not available from Clerk' },
            { status: 400 }
          )
        }

        resolvedUser = await prisma.user.upsert({
          where: { clerkUserId },
          update: {
            email,
            firstName: clerkProfile?.firstName ?? null,
            lastName: clerkProfile?.lastName ?? null,
          },
          create: {
            clerkUserId,
            email,
            firstName: clerkProfile?.firstName ?? null,
            lastName: clerkProfile?.lastName ?? null,
          },
        })
      }

      const resolvedParams =
        context?.params instanceof Promise
          ? await context.params
          : context?.params || {}

      const authContext: AuthContext = {
        user: resolvedUser,
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
