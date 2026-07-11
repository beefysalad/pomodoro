import { withAuth, AuthContext } from '@/lib/with-auth-guard'
import { NextRequest, NextResponse } from 'next/server'
import { DEFAULT_MUTATION_RATE_LIMIT } from '@/lib/rate-limit'
import { deleteSubject } from '@/lib/services/subject-service'

export const DELETE = withAuth(
  async (req: NextRequest, { user, params }: AuthContext) => {
    const id = params?.id
    if (!id) {
      return NextResponse.json({ error: 'Subject ID is required' }, { status: 400 })
    }

    await deleteSubject(user.id, id)
    return NextResponse.json({ success: true })
  },
  { rateLimit: DEFAULT_MUTATION_RATE_LIMIT }
)
