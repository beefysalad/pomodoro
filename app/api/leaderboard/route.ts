import { NextRequest, NextResponse } from 'next/server'
import { withAuth, type AuthContext } from '@/lib/with-auth-guard'
import { getLeaderboard } from '@/lib/services/leaderboard-service'

export const GET = withAuth(async (_req: NextRequest, { user }: AuthContext) => {
  const leaderboard = await getLeaderboard(user)
  return NextResponse.json(leaderboard)
})
