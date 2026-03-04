import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
  Subject,
} from '@/lib/api/subjects'

export const queryKeys = {
  subjects: ['subjects'] as const,
  subject: (id: string) => ['subject', id] as const,
}

export function useSubjects() {
  return useQuery({
    queryKey: queryKeys.subjects,
    queryFn: getSubjects,
  })
}

export function useCreateSubject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createSubject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.subjects })
    },
  })
}

export function useUpdateSubject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<Subject> }) =>
      updateSubject(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.subjects })
      queryClient.invalidateQueries({
        queryKey: queryKeys.subject(variables.id),
      })
    },
  })
}

export function useDeleteSubject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteSubject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.subjects })
    },
  })
}
