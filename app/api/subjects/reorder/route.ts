import { withAuth, AuthContext } from '@/lib/with-auth-guard'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { DEFAULT_MUTATION_RATE_LIMIT } from '@/lib/rate-limit'
import { reorderSubjects } from '@/lib/services/subject-service'

const ReorderSchemaApi = z.object({
  updates: z.array(
    z.object({
      id: z.string(),
      position: z.number(),
    })
  ),
})

export const PATCH = withAuth(
  async (req: NextRequest, { user }: AuthContext) => {
    const body = await req.json()
    const { updates } = ReorderSchemaApi.parse(body)
    await reorderSubjects(user.id, updates)
    return NextResponse.json({ success: true })
  },
  { rateLimit: DEFAULT_MUTATION_RATE_LIMIT }
)
