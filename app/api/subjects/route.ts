import { withAuth, AuthContext } from '@/lib/with-auth-guard'
import { NextRequest, NextResponse } from 'next/server'
import { CreateSubjectSchemaApi } from '@/lib/schemas/subject'
import { DEFAULT_MUTATION_RATE_LIMIT } from '@/lib/rate-limit'
import { listSubjects, createSubject } from '@/lib/services/subject-service'

export const GET = withAuth(async (req: NextRequest, { user }: AuthContext) => {
  const subjects = await listSubjects(user.id)
  return NextResponse.json({ subjects })
})

export const POST = withAuth(
  async (req: NextRequest, { user }: AuthContext) => {
    const body = await req.json()
    const parsed = CreateSubjectSchemaApi.parse(body)
    const subject = await createSubject(user.id, parsed)
    return NextResponse.json({ subject })
  },
  { rateLimit: DEFAULT_MUTATION_RATE_LIMIT }
)
