import type { Session } from '@/app/generated/prisma/client'
import type { Db } from '@/lib/db'

export interface CreateSessionInput {
  userId: string
  topicId: string
  mode: 'blitz' | 'focus' | 'deep'
  duration: number
  xpEarned: number
  rating: number
}

export function create(db: Db, data: CreateSessionInput): Promise<Session> {
  return db.session.create({ data })
}
