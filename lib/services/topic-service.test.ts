import { describe, expect, it, vi, beforeEach } from 'vitest'
import prisma from '@/lib/prisma'
import * as topicRepository from '@/lib/repositories/topic-repository'
import * as subjectRepository from '@/lib/repositories/subject-repository'
import { NotFoundError } from '@/lib/errors'
import { createTopic, updateTopic, deleteTopic } from './topic-service'
import type { Topic, Subject } from '@/app/generated/prisma/client'

vi.mock('@/lib/prisma', () => ({ default: {} }))
vi.mock('@/lib/repositories/topic-repository')
vi.mock('@/lib/repositories/subject-repository')

// Builds a fake of T from a partial shape without using `any` — every test
// file in this plan that needs a fake Prisma-shaped object uses this same
// helper, redefined locally per file.
function fake<T>(partial: Partial<T>): T {
  return partial as T
}

type TopicWithSubject = NonNullable<
  Awaited<ReturnType<typeof topicRepository.findByIdWithSubject>>
>

describe('createTopic', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('throws NotFoundError when the subject does not belong to the user', async () => {
    vi.mocked(subjectRepository.findById).mockResolvedValue(
      fake<Subject>({ id: 'subj_1', userId: 'someone_else' })
    )

    await expect(createTopic('user_1', 'subj_1', { name: 'Chapter 1' })).rejects.toThrow(
      NotFoundError
    )
  })

  it('positions the new topic after the current last one', async () => {
    vi.mocked(subjectRepository.findById).mockResolvedValue(
      fake<Subject>({ id: 'subj_1', userId: 'user_1' })
    )
    vi.mocked(topicRepository.findLastPositionBySubjectId).mockResolvedValue({ position: 4 })
    const fakeTopic = fake<Topic>({ id: 'topic_1' })
    vi.mocked(topicRepository.create).mockResolvedValue(fakeTopic)

    const result = await createTopic('user_1', 'subj_1', { name: 'Chapter 2' })

    expect(topicRepository.create).toHaveBeenCalledWith(prisma, {
      name: 'Chapter 2',
      subjectId: 'subj_1',
      position: 5,
    })
    expect(result).toBe(fakeTopic)
  })
})

describe('updateTopic', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('throws NotFoundError when the topic belongs to a different subject', async () => {
    vi.mocked(topicRepository.findByIdWithSubject).mockResolvedValue(
      fake<TopicWithSubject>({
        id: 'topic_1',
        subjectId: 'subj_other',
        subject: fake<Subject>({ userId: 'user_1' }),
      })
    )

    await expect(
      updateTopic('user_1', 'subj_1', 'topic_1', { name: 'Renamed' })
    ).rejects.toThrow(NotFoundError)
  })

  it('stamps statusUpdatedAt and doneAt when status moves to DONE', async () => {
    vi.mocked(topicRepository.findByIdWithSubject).mockResolvedValue(
      fake<TopicWithSubject>({
        id: 'topic_1',
        subjectId: 'subj_1',
        subject: fake<Subject>({ userId: 'user_1' }),
      })
    )
    vi.mocked(topicRepository.update).mockResolvedValue(fake<Topic>({ id: 'topic_1' }))

    await updateTopic('user_1', 'subj_1', 'topic_1', { status: 'DONE' })

    expect(topicRepository.update).toHaveBeenCalledWith(
      prisma,
      'topic_1',
      expect.objectContaining({ status: 'DONE', doneAt: expect.any(Date) })
    )
  })

  it('clears doneAt when status moves to a non-DONE state', async () => {
    vi.mocked(topicRepository.findByIdWithSubject).mockResolvedValue(
      fake<TopicWithSubject>({
        id: 'topic_1',
        subjectId: 'subj_1',
        subject: fake<Subject>({ userId: 'user_1' }),
      })
    )
    vi.mocked(topicRepository.update).mockResolvedValue(fake<Topic>({ id: 'topic_1' }))

    await updateTopic('user_1', 'subj_1', 'topic_1', { status: 'IN_PROGRESS' })

    expect(topicRepository.update).toHaveBeenCalledWith(
      prisma,
      'topic_1',
      expect.objectContaining({ status: 'IN_PROGRESS', doneAt: null })
    )
  })
})

describe('deleteTopic', () => {
  it('deletes after confirming ownership', async () => {
    vi.mocked(topicRepository.findByIdWithSubject).mockResolvedValue(
      fake<TopicWithSubject>({
        id: 'topic_1',
        subjectId: 'subj_1',
        subject: fake<Subject>({ userId: 'user_1' }),
      })
    )
    vi.mocked(topicRepository.deleteById).mockResolvedValue(fake<Topic>({ id: 'topic_1' }))

    await deleteTopic('user_1', 'subj_1', 'topic_1')

    expect(topicRepository.deleteById).toHaveBeenCalledWith(prisma, 'topic_1')
  })
})
