import { NextRequest, NextResponse } from 'next/server'
import { withAuth, type AuthContext } from '@/lib/with-auth-guard'
import { getStats } from '@/lib/services/stats-service'

export const GET = withAuth(async (_req: NextRequest, { user }: AuthContext) => {
  const stats = await getStats(user)
  return NextResponse.json(stats)
})
