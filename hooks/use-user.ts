import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getUser, updateUser } from '@/lib/api/user'
import { TUpdateUserSchemaApi } from '@/lib/schemas/user'

export const queryKeys = {
  user: ['user'] as const,
}

export function useUser() {
  return useQuery({
    queryKey: queryKeys.user,
    queryFn: getUser,
  })
}

export function useUpdateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: TUpdateUserSchemaApi) => updateUser(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user })
    },
  })
}
