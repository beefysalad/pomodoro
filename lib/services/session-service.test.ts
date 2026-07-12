import { describe, expect, it, vi, beforeEach } from 'vitest'
import prisma from '@/lib/prisma'
import * as sessionRepository from '@/lib/repositories/session-repository'
import * as topicRepository from '@/lib/repositories/topic-repository'
import * as userRepository from '@/lib/repositories/user-repository'
import { NotFoundError } from '@/lib/errors'
import { recordSession, resolveTimezone } from './session-service'
import type { Db } from '@/lib/db'
import type { Topic, Subject, Session } from '@/app/generated/prisma/client'

vi.mock('@/lib/prisma', () => ({
  default: { $transaction: vi.fn() },
}))
vi.mock('@/lib/repositories/session-repository')
vi.mock('@/lib/repositories/topic-repository')
vi.mock('@/lib/repositories/user-repository')

// Builds a fake of T from a partial shape without using `any` — every test
// file in this plan that needs a fake Prisma-shaped object uses this same
// helper, redefined locally per file.
function fake<T>(partial: Partial<T>): T {
  return partial as T
}

type TopicWithSubject = NonNullable<
  Awaited<ReturnType<typeof topicRepository.findByIdWithSubject>>
>

const FAKE_TX = fake<Db>({})

// Typed stand-in for prisma.$transaction's interactive-callback overload, so
// mockImplementation below never needs an `any`-typed parameter.
function runWithFakeTx<T>(fn: (tx: Db) => Promise<T>): Promise<T> {
  return fn(FAKE_TX)
}

describe('resolveTimezone', () => {
  it('returns the candidate when it is a valid IANA timezone', () => {
    expect(resolveTimezone('America/New_York', 'UTC')).toBe('America/New_York')
  })

  it('falls back when the candidate is not a valid timezone', () => {
    expect(resolveTimezone('Not/A/Zone', 'UTC')).toBe('UTC')
  })

  it('falls back when there is no candidate', () => {
    expect(resolveTimezone(null, 'America/Chicago')).toBe('America/Chicago')
  })
})

describe('recordSession', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(prisma.$transaction).mockImplementation(runWithFakeTx as typeof prisma.$transaction)
  })

  it('throws NotFoundError when the topic does not belong to the user', async () => {
    vi.mocked(topicRepository.findByIdWithSubject).mockResolvedValue(
      fake<TopicWithSubject>({
        id: 'topic_1',
        subject: fake<Subject>({ userId: 'someone_else' }),
      })
    )

    await expect(
      recordSession('user_1', { topicId: 'topic_1', mode: 'focus', duration: 1500, rating: 2 }, null)
    ).rejects.toThrow(NotFoundError)

    expect(prisma.$transaction).not.toHaveBeenCalled()
  })

  it('awards MODE_XP for the mode and computes the new level/streak from the locked row', async () => {
    vi.mocked(topicRepository.findByIdWithSubject).mockResolvedValue(
      fake<TopicWithSubject>({
        id: 'topic_1',
        subject: fake<Subject>({ userId: 'user_1' }),
      })
    )
    vi.mocked(userRepository.lockForUpdate).mockResolvedValue({
      totalXP: 90,
      streak: 2,
      lastStudiedAt: null,
      timezone: 'UTC',
    })
    vi.mocked(sessionRepository.create).mockResolvedValue(fake<Session>({ id: 'session_1' }))
    vi.mocked(topicRepository.incrementSessionStats).mockResolvedValue(fake<Topic>({ id: 'topic_1' }))
    vi.mocked(userRepository.updateProgression).mockResolvedValue(fake<Awaited<ReturnType<typeof userRepository.updateProgression>>>({ id: 'user_1' }))

    const result = await recordSession(
      'user_1',
      { topicId: 'topic_1', mode: 'focus', duration: 1500, rating: 3 },
      null
    )

    expect(result.xpAwarded).toBe(25)
    expect(result.newTotalXP).toBe(115)
    expect(result.previousLevel).toBe(1)
    expect(result.newLevel).toBe(2)
    expect(result.nextStreak).toBe(1)

    expect(sessionRepository.create).toHaveBeenCalledWith(FAKE_TX, {
      userId: 'user_1',
      topicId: 'topic_1',
      mode: 'focus',
      duration: 1500,
      xpEarned: 25,
      rating: 3,
    })
    expect(topicRepository.incrementSessionStats).toHaveBeenCalledWith(
      FAKE_TX,
      'topic_1',
      expect.objectContaining({ duration: 1500, rating: 3 })
    )
    expect(userRepository.updateProgression).toHaveBeenCalledWith(
      FAKE_TX,
      'user_1',
      expect.objectContaining({ totalXP: 115, streak: 1 })
    )
  })

  it('throws when the locked user row is missing', async () => {
    vi.mocked(topicRepository.findByIdWithSubject).mockResolvedValue(
      fake<TopicWithSubject>({
        id: 'topic_1',
        subject: fake<Subject>({ userId: 'user_1' }),
      })
    )
    vi.mocked(userRepository.lockForUpdate).mockResolvedValue(null)

    await expect(
      recordSession('user_1', { topicId: 'topic_1', mode: 'blitz', duration: 600, rating: 1 }, null)
    ).rejects.toThrow('User not found')
  })
})
