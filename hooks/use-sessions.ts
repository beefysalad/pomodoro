import { useMutation, useQueryClient } from '@tanstack/react-query'
import { completeSession, CompleteSessionPayload } from '@/lib/api/sessions'
import { queryKeys } from './use-subjects'

export function useCompleteSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CompleteSessionPayload) => completeSession(payload),
    onSuccess: () => {
      // Refresh subjects (for topic stats) and user (for XP)
      queryClient.invalidateQueries({ queryKey: queryKeys.subjects })
      queryClient.invalidateQueries({ queryKey: ['user'] })
    },
  })
}
