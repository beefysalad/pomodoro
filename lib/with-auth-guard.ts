import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import prisma from './prisma'
import { User } from '@/app/generated/prisma/client'

export async function withAuth(
  handler: (req: Request, user: User) => Promise<NextResponse>
) {
  return async (req: Request) => {
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

      return await handler(req, user)
    } catch (error) {
      console.error('Auth helper error:', error)
      return NextResponse.json(
        { error: 'Internal Server Error' },
        { status: 500 }
      )
    }
  }
}
