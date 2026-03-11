import { useQuery } from '@tanstack/react-query'
import { getQuote } from '@/lib/api/quote'

export const quoteQueryKey = ['quote'] as const

export function useQuote() {
  return useQuery({
    queryKey: quoteQueryKey,
    queryFn: getQuote,
    staleTime: 1000 * 60 * 60,
    refetchOnWindowFocus: false,
  })
}
