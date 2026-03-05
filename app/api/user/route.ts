import { withAuth, AuthContext } from '@/lib/with-auth-guard'
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { UpdateUserSchemaApi } from '@/lib/schemas/user'

export const GET = withAuth(async (req: NextRequest, { user }: AuthContext) => {
  return NextResponse.json({ user })
})

export const PATCH = withAuth(
  async (req: NextRequest, { user }: AuthContext) => {
    try {
      const body = await req.json()
      const parsed = UpdateUserSchemaApi.parse(body)

      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          ...(parsed.onboarded !== undefined && {
            onboarded: parsed.onboarded,
          }),
          ...(parsed.timezone && { timezone: parsed.timezone }),
          ...(parsed.blitzMinutes !== undefined && {
            blitzMinutes: parsed.blitzMinutes,
          }),
          ...(parsed.focusMinutes !== undefined && {
            focusMinutes: parsed.focusMinutes,
          }),
          ...(parsed.deepMinutes !== undefined && {
            deepMinutes: parsed.deepMinutes,
          }),
        },
      })

      return NextResponse.json({ user: updatedUser })
    } catch (error) {
      console.error('Update user error:', error)
      return NextResponse.json(
        { error: 'Internal Server Error' },
        { status: 500 }
      )
    }
  }
)
