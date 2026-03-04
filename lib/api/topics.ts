import type { Topic, Subject } from '@/app/generated/prisma/client'
import api from '../axios'

export interface SubjectWithTopics extends Subject {
  topics: Topic[]
}

export const getTopics = async (
  subjectId: string
): Promise<SubjectWithTopics> => {
  const { data } = await api.get<{ subject: SubjectWithTopics }>(
    `/subjects/${subjectId}/topics`
  )
  return data.subject
}

export const createTopic = async (
  subjectId: string,
  payload: { name: string; description?: string; tags?: string[] }
): Promise<Topic> => {
  const { data } = await api.post<{ topic: Topic }>(
    `/subjects/${subjectId}/topics`,
    payload
  )
  return data.topic
}

export const updateTopic = async (
  subjectId: string,
  topicId: string,
  payload: Partial<Topic>
): Promise<Topic> => {
  const { data } = await api.patch<{ topic: Topic }>(
    `/subjects/${subjectId}/topics/${topicId}`,
    payload
  )
  return data.topic
}

export const deleteTopic = async (
  subjectId: string,
  topicId: string
): Promise<void> => {
  await api.delete(`/subjects/${subjectId}/topics/${topicId}`)
}
