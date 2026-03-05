import api from '../axios'
import type { TopicStatus } from '@/lib/topic-status'

export interface Topic {
  id: string
  subjectId: string
  name: string
  status: TopicStatus
  statusUpdatedAt: string
  doneAt: string | null
  position: number
  sessionCount: number
  lastRating: number | null
  createdAt: string
  updatedAt: string
  totalTime: number
  _count: {
    sessions: number
  }
}

export interface SubjectWithTopics {
  id: string
  userId: string
  name: string
  slug: string | null
  icon: string | null
  color: string
  position: number
  createdAt: string
  updatedAt: string
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
