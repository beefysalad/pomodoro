import { describe, expect, it, vi, beforeEach } from 'vitest'
import prisma from '@/lib/prisma'
import * as subjectRepository from '@/lib/repositories/subject-repository'
import * as helper from '@/lib/helper'
import { NotFoundError } from '@/lib/errors'
import {
  createSubject,
  reorderSubjects,
  deleteSubject,
  assertOwnedSubject,
} from './subject-service'
import type { Subject } from '@/app/generated/prisma/client'

vi.mock('@/lib/prisma', () => ({
  default: { $transaction: vi.fn((ops) => Promise.all(ops)) },
}))
vi.mock('@/lib/repositories/subject-repository')
vi.mock('@/lib/helper')

// Builds a fake of T from a partial shape without using `any` — every test
// file in this plan that needs a fake Prisma-shaped object uses this same
// helper, redefined locally per file.
function fake<T>(partial: Partial<T>): T {
  return partial as T
}

describe('assertOwnedSubject', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('throws NotFoundError when the subject belongs to another user', async () => {
    vi.mocked(subjectRepository.findById).mockResolvedValue(
      fake<Subject>({ id: 'subj_1', userId: 'someone_else' })
    )

    await expect(assertOwnedSubject('user_1', 'subj_1')).rejects.toThrow(NotFoundError)
  })

  it('throws NotFoundError when the subject does not exist', async () => {
    vi.mocked(subjectRepository.findById).mockResolvedValue(null)

    await expect(assertOwnedSubject('user_1', 'subj_1')).rejects.toThrow(NotFoundError)
  })

  it('returns the subject when it belongs to the user', async () => {
    const fakeSubject = fake<Subject>({ id: 'subj_1', userId: 'user_1' })
    vi.mocked(subjectRepository.findById).mockResolvedValue(fakeSubject)

    await expect(assertOwnedSubject('user_1', 'subj_1')).resolves.toBe(fakeSubject)
  })
})

describe('createSubject', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('positions the new subject after the current last one and generates a slug', async () => {
    vi.mocked(subjectRepository.findLastPositionByUserId).mockResolvedValue({ position: 2 })
    vi.mocked(helper.generateUniqueSlug).mockResolvedValue('algebra')
    const fakeSubject = fake<Subject>({ id: 'subj_1' })
    vi.mocked(subjectRepository.create).mockResolvedValue(fakeSubject)

    const result = await createSubject('user_1', { name: 'Algebra', color: '#EF4444' })

    expect(subjectRepository.create).toHaveBeenCalledWith(prisma, {
      name: 'Algebra',
      userId: 'user_1',
      color: '#EF4444',
      position: 3,
      slug: 'algebra',
    })
    expect(result).toBe(fakeSubject)
  })

  it('defaults new subjects to position 0 when the user has none yet', async () => {
    vi.mocked(subjectRepository.findLastPositionByUserId).mockResolvedValue(null)
    vi.mocked(helper.generateUniqueSlug).mockResolvedValue('biology')
    vi.mocked(subjectRepository.create).mockResolvedValue(fake<Subject>({ id: 'subj_2' }))

    await createSubject('user_1', { name: 'Biology', color: '#10B981' })

    expect(subjectRepository.create).toHaveBeenCalledWith(
      prisma,
      expect.objectContaining({ position: 0 })
    )
  })
})

describe('reorderSubjects', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('updates every subject position scoped to the owning user inside one transaction', async () => {
    vi.mocked(subjectRepository.updatePosition).mockResolvedValue(fake<{ count: number }>({ count: 1 }))

    await reorderSubjects('user_1', [
      { id: 'subj_1', position: 0 },
      { id: 'subj_2', position: 1 },
    ])

    expect(subjectRepository.updatePosition).toHaveBeenCalledWith(prisma, 'subj_1', 'user_1', 0)
    expect(subjectRepository.updatePosition).toHaveBeenCalledWith(prisma, 'subj_2', 'user_1', 1)
    expect(prisma.$transaction).toHaveBeenCalled()
  })
})

describe('deleteSubject', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deletes scoped to the owning user', async () => {
    vi.mocked(subjectRepository.findById).mockResolvedValue(
      fake<Subject>({ id: 'subj_1', userId: 'user_1' })
    )
    vi.mocked(subjectRepository.deleteByIdForUser).mockResolvedValue(fake<Subject>({ id: 'subj_1' }))

    await deleteSubject('user_1', 'subj_1')

    expect(subjectRepository.deleteByIdForUser).toHaveBeenCalledWith(prisma, 'subj_1', 'user_1')
  })

  it('throws NotFoundError instead of deleting when the subject belongs to another user', async () => {
    vi.mocked(subjectRepository.findById).mockResolvedValue(
      fake<Subject>({ id: 'subj_1', userId: 'someone_else' })
    )

    await expect(deleteSubject('user_1', 'subj_1')).rejects.toThrow(NotFoundError)
    expect(subjectRepository.deleteByIdForUser).not.toHaveBeenCalled()
  })
})
