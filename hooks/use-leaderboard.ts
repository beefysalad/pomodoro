import { useQuery } from '@tanstack/react-query'
import { getLeaderboard } from '@/lib/api/leaderboard'

export function useLeaderboard() {
  return useQuery({
    queryKey: ['leaderboard'],
    queryFn: getLeaderboard,
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 60,
  })
}
