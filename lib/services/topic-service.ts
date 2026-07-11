import prisma from '@/lib/prisma'
import * as topicRepository from '@/lib/repositories/topic-repository'
import { assertOwnedSubject } from '@/lib/services/subject-service'
import { NotFoundError } from '@/lib/errors'
import type { TopicStatus } from '@/lib/topic-status'

async function assertOwnedTopic(userId: string, subjectId: string, topicId: string) {
  const topic = await topicRepository.findByIdWithSubject(prisma, topicId)
  if (!topic || topic.subjectId !== subjectId || topic.subject.userId !== userId) {
    throw new NotFoundError('Topic not found or unauthorized')
  }
  return topic
}

export async function listTopicsForSubject(userId: string, subjectId: string) {
  const subject = await assertOwnedSubject(userId, subjectId)
  const topics = await topicRepository.findManyBySubjectId(prisma, subjectId)
  return { subject, topics }
}

export interface CreateTopicInput {
  name: string
}

export async function createTopic(userId: string, subjectId: string, input: CreateTopicInput) {
  await assertOwnedSubject(userId, subjectId)

  const lastTopic = await topicRepository.findLastPositionBySubjectId(prisma, subjectId)
  const newPosition = lastTopic ? lastTopic.position + 1 : 0

  return topicRepository.create(prisma, {
    name: input.name,
    subjectId,
    position: newPosition,
  })
}

export interface UpdateTopicInput {
  name?: string
  position?: number
  lastRating?: number | null
  status?: TopicStatus
}

export async function updateTopic(
  userId: string,
  subjectId: string,
  topicId: string,
  input: UpdateTopicInput
) {
  await assertOwnedTopic(userId, subjectId, topicId)

  const statusUpdate =
    input.status === undefined
      ? {}
      : {
          status: input.status,
          statusUpdatedAt: new Date(),
          doneAt: input.status === 'DONE' ? new Date() : null,
        }

  return topicRepository.update(prisma, topicId, {
    ...input,
    ...statusUpdate,
  })
}

export async function deleteTopic(userId: string, subjectId: string, topicId: string) {
  await assertOwnedTopic(userId, subjectId, topicId)
  await topicRepository.deleteById(prisma, topicId)
}
