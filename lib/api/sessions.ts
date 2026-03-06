import api from '../axios'

export interface CompleteSessionPayload {
  topicId: string
  mode: 'blitz' | 'focus' | 'deep'
  duration: number // seconds
  rating: number
}

export interface CompleteSessionResponse {
  progression: {
    xpAwarded: number
    totalXP: number
    previousLevel: number
    newLevel: number
    leveledUp: boolean
    streak: number
  }
}

export const completeSession = async (
  payload: CompleteSessionPayload
): Promise<CompleteSessionResponse> => {
  const { data } = await api.post<CompleteSessionResponse>('/sessions', payload)
  return data
}
