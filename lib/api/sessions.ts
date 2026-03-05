import api from '../axios'

export interface CompleteSessionPayload {
  topicId: string
  mode: 'blitz' | 'focus' | 'deep'
  duration: number // seconds
  xpEarned: number
  rating: number
}

export const completeSession = async (
  payload: CompleteSessionPayload
): Promise<void> => {
  await api.post('/sessions', payload)
}
