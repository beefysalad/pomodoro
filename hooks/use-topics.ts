import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createTopic,
  updateTopic,
  deleteTopic,
  getTopics,
} from '@/lib/api/topics'
import { queryKeys as subjectQueryKeys } from './use-subjects'
import type { Topic } from '@/lib/api/topics'

export function useSubjectTopics(subjectId: string) {
  return useQuery({
    queryKey: subjectQueryKeys.subject(subjectId),
    queryFn: () => getTopics(subjectId),
    enabled: !!subjectId,
  })
}

export function useCreateTopic() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      subjectId,
      payload,
    }: {
      subjectId: string
      payload: { name: string; description?: string; tags?: string[] }
    }) => createTopic(subjectId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: subjectQueryKeys.subjects })
      queryClient.invalidateQueries({
        queryKey: subjectQueryKeys.subject(variables.subjectId),
      })
    },
  })
}

export function useUpdateTopic() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      subjectId,
      topicId,
      payload,
    }: {
      subjectId: string
      topicId: string
      payload: Partial<Topic>
    }) => updateTopic(subjectId, topicId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: subjectQueryKeys.subjects })
      queryClient.invalidateQueries({
        queryKey: subjectQueryKeys.subject(variables.subjectId),
      })
    },
  })
}

export function useDeleteTopic() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      subjectId,
      topicId,
    }: {
      subjectId: string
      topicId: string
    }) => deleteTopic(subjectId, topicId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: subjectQueryKeys.subjects })
      queryClient.invalidateQueries({
        queryKey: subjectQueryKeys.subject(variables.subjectId),
      })
    },
  })
}
