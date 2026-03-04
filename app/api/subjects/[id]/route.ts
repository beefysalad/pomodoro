import prisma from '@/lib/prisma'
import { withAuth, AuthContext } from '@/lib/with-auth-guard'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const DeleteSchemaApi = z.object({
  id: z.string(),
})

export const DELETE = withAuth(
  async (req: NextRequest, { user }: AuthContext) => {
    try {
      const body = await req.json()
      const { id } = DeleteSchemaApi.parse(body)

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
  }
)
