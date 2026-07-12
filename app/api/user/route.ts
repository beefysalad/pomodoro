import { withAuth, AuthContext } from '@/lib/with-auth-guard'
import { NextRequest, NextResponse } from 'next/server'
import { UpdateUserSchemaApi } from '@/lib/schemas/user'
import { DEFAULT_MUTATION_RATE_LIMIT } from '@/lib/rate-limit'
import { updateUserPreferences } from '@/lib/services/user-service'

export const GET = withAuth(async (req: NextRequest, { user }: AuthContext) => {
  return NextResponse.json({ user })
})

export const PATCH = withAuth(
  async (req: NextRequest, { user }: AuthContext) => {
    const body = await req.json()
    const parsed = UpdateUserSchemaApi.parse(body)
    const updatedUser = await updateUserPreferences(user.id, parsed)
    return NextResponse.json({ user: updatedUser })
  },
  { rateLimit: DEFAULT_MUTATION_RATE_LIMIT }
)
