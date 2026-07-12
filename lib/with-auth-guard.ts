import { auth, currentUser } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import prisma from './prisma'
import { User } from '@/app/generated/prisma/client'
import { checkRateLimit, type RateLimitConfig } from './rate-limit'
import * as userRepository from './repositories/user-repository'
import { toErrorResponse } from './api-errors'

export interface AuthContext {
  user: User
  params: Record<string, string>
}

export interface WithAuthOptions {
  rateLimit?: RateLimitConfig
}

export function withAuth(
  handler: (req: NextRequest, context: AuthContext) => Promise<NextResponse>,
  options?: WithAuthOptions
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

      const user = await userRepository.findByClerkId(prisma, clerkUserId)

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

        resolvedUser = await userRepository.upsertByClerkId(prisma, {
          clerkUserId,
          email,
          firstName: clerkProfile?.firstName ?? null,
          lastName: clerkProfile?.lastName ?? null,
        })
      }

      if (options?.rateLimit) {
        const routeKey = `${req.method}:${req.nextUrl.pathname}`
        const result = await checkRateLimit(
          `${resolvedUser.id}:${routeKey}`,
          options.rateLimit
        )

        if (!result.allowed) {
          return NextResponse.json(
            { error: 'Too many requests. Please slow down.' },
            {
              status: 429,
              headers: { 'Retry-After': String(result.retryAfterSeconds) },
            }
          )
        }
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
      return toErrorResponse(error, 'Auth helper error')
    }
  }
}
