import type { User } from '@/app/generated/prisma/client'
import api from '../axios'
import { TUpdateUserSchemaApi } from '../schemas/user'

export const getUser = async (): Promise<User> => {
  const { data } = await api.get<{ user: User }>('/user')
  return data.user
}

export const updateUser = async (
  payload: TUpdateUserSchemaApi
): Promise<User> => {
  const { data } = await api.patch<{ user: User }>('/user', payload)
  return data.user
}
