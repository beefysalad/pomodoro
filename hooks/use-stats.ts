import { useQuery } from '@tanstack/react-query'
import { getStats } from '@/lib/api/stats'

export const queryKeys = {
  stats: ['stats'] as const,
}

export function useStats() {
  return useQuery({
    queryKey: queryKeys.stats,
    queryFn: getStats,
  })
}
