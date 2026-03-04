import { withAuth, AuthContext } from '@/lib/with-auth-guard'
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { CreateSubjectSchemaApi, SUBJECT_COLORS } from '@/lib/schemas/subject'

export const GET = withAuth(async (req: NextRequest, { user }: AuthContext) => {
  try {
    const subjects = await prisma.subject.findMany({
      where: { userId: user.id },
      orderBy: { position: 'asc' },
    })
    return NextResponse.json({ subjects })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
})

export const POST = withAuth(
  async (req: NextRequest, { user }: AuthContext) => {
    try {
      const body = await req.json()
      const parsed = CreateSubjectSchemaApi.parse(body)

      const color =
        parsed.color ||
        SUBJECT_COLORS[Math.floor(Math.random() * SUBJECT_COLORS.length)]

      const lastSubject = await prisma.subject.findFirst({
        where: { userId: user.id },
        orderBy: { position: 'desc' },
        select: { position: true },
      })

      const newPosition = lastSubject ? lastSubject.position + 1 : 0

      const subject = await prisma.subject.create({
        data: {
          name: parsed.name,
          userId: user.id,
          color,
          position: newPosition,
        },
      })

      return NextResponse.json({ subject })
    } catch (error) {
      return NextResponse.json(
        { error: 'Internal Server Error' },
        { status: 500 }
      )
    }
  }
)
