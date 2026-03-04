import type { Topic } from '@/app/generated/prisma/client'
import api from '../axios'

export interface Subject {
  id: string
  userId: string
  name: string
  color: string
  position: number
  createdAt: string
  updatedAt: string
  topics?: Topic[]
}

export const getSubjects = async (): Promise<Subject[]> => {
  const { data } = await api.get<{ subjects: Subject[] }>('/subjects')
  return data.subjects
}

export const createSubject = async (payload: {
  name: string
  color?: string
}): Promise<Subject> => {
  const { data } = await api.post<{ subject: Subject }>('/subjects', payload)
  return data.subject
}

export const updateSubject = async (
  id: string,
  payload: Partial<Subject>
): Promise<Subject> => {
  const { data } = await api.patch<{ subject: Subject }>(
    `/subjects/${id}`,
    payload
  )
  return data.subject
}

export const deleteSubject = async (id: string): Promise<void> => {
  await api.delete(`/subjects/${id}`)
}
