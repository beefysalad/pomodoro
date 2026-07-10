import type { Topic } from '@/app/generated/prisma/client'
import type { Db } from '@/lib/db'
import type { TopicStatus } from '@/lib/topic-status'

export function findManyBySubjectId(db: Db, subjectId: string) {
  return db.topic.findMany({
    where: { subjectId },
    orderBy: { position: 'asc' },
    include: {
      _count: { select: { sessions: true } },
    },
  })
}

export function findById(db: Db, id: string): Promise<Topic | null> {
  return db.topic.findUnique({ where: { id } })
}

export function findByIdWithSubject(db: Db, id: string) {
  return db.topic.findUnique({
    where: { id },
    include: { subject: true },
  })
}

export function findLastPositionBySubjectId(db: Db, subjectId: string) {
  return db.topic.findFirst({
    where: { subjectId },
    orderBy: { position: 'desc' },
    select: { position: true },
  })
}

export interface CreateTopicInput {
  name: string
  subjectId: string
  position: number
}

export function create(db: Db, data: CreateTopicInput): Promise<Topic> {
  return db.topic.create({ data })
}

export interface UpdateTopicInput {
  name?: string
  position?: number
  lastRating?: number | null
  status?: TopicStatus
  statusUpdatedAt?: Date
  doneAt?: Date | null
}

export function update(db: Db, id: string, data: UpdateTopicInput): Promise<Topic> {
  return db.topic.update({ where: { id }, data })
}

export function deleteById(db: Db, id: string): Promise<Topic> {
  return db.topic.delete({ where: { id } })
}

export interface IncrementSessionStatsInput {
  duration: number
  rating: number
  now: Date
}

export function incrementSessionStats(
  db: Db,
  topicId: string,
  input: IncrementSessionStatsInput
): Promise<Topic> {
  return db.topic.update({
    where: { id: topicId },
    data: {
      sessionCount: { increment: 1 },
      totalTime: { increment: input.duration },
      lastRating: input.rating,
      status: 'IN_PROGRESS',
      statusUpdatedAt: input.now,
      doneAt: null,
    },
  })
}
