import { describe, expect, it, vi, beforeEach } from 'vitest'
import prisma from '@/lib/prisma'
import * as flashcardDeckRepository from '@/lib/repositories/flashcard-deck-repository'
import * as subjectRepository from '@/lib/repositories/subject-repository'
import { NotFoundError } from '@/lib/errors'
import { createDeck, updateDeck, deleteDeck } from './flashcard-deck-service'
import type { Subject, FlashcardDeck } from '@/app/generated/prisma/client'

vi.mock('@/lib/prisma', () => ({ default: {} }))
vi.mock('@/lib/repositories/flashcard-deck-repository')
vi.mock('@/lib/repositories/subject-repository')

// Builds a fake of T from a partial shape without using `any` — every test
// file in this plan that needs a fake Prisma-shaped object uses this same
// helper, redefined locally per file.
function fake<T>(partial: Partial<T>): T {
  return partial as T
}

describe('createDeck', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('throws NotFoundError when the subject does not belong to the user', async () => {
    vi.mocked(subjectRepository.findById).mockResolvedValue(
      fake<Subject>({ id: 'subj_1', userId: 'someone_else' })
    )

    await expect(createDeck('user_1', 'subj_1', 'Deck A')).rejects.toThrow(NotFoundError)
  })

  it('creates the deck under the subject once ownership is confirmed', async () => {
    vi.mocked(subjectRepository.findById).mockResolvedValue(
      fake<Subject>({ id: 'subj_1', userId: 'user_1' })
    )
    const fakeDeck = fake<FlashcardDeck>({ id: 'deck_1' })
    vi.mocked(flashcardDeckRepository.create).mockResolvedValue(fakeDeck)

    const result = await createDeck('user_1', 'subj_1', 'Deck A')

    expect(flashcardDeckRepository.create).toHaveBeenCalledWith(prisma, {
      name: 'Deck A',
      subjectId: 'subj_1',
    })
    expect(result).toBe(fakeDeck)
  })
})

describe('updateDeck', () => {
  it('throws NotFoundError when the deck belongs to a different subject', async () => {
    vi.mocked(subjectRepository.findById).mockResolvedValue(
      fake<Subject>({ id: 'subj_1', userId: 'user_1' })
    )
    vi.mocked(flashcardDeckRepository.findById).mockResolvedValue(
      fake<FlashcardDeck>({ id: 'deck_1', subjectId: 'subj_other' })
    )

    await expect(updateDeck('user_1', 'subj_1', 'deck_1', 'Renamed')).rejects.toThrow(NotFoundError)
  })
})

describe('deleteDeck', () => {
  it('deletes after confirming ownership', async () => {
    vi.mocked(subjectRepository.findById).mockResolvedValue(
      fake<Subject>({ id: 'subj_1', userId: 'user_1' })
    )
    vi.mocked(flashcardDeckRepository.findById).mockResolvedValue(
      fake<FlashcardDeck>({ id: 'deck_1', subjectId: 'subj_1' })
    )
    vi.mocked(flashcardDeckRepository.deleteById).mockResolvedValue(fake<FlashcardDeck>({ id: 'deck_1' }))

    await deleteDeck('user_1', 'subj_1', 'deck_1')

    expect(flashcardDeckRepository.deleteById).toHaveBeenCalledWith(prisma, 'deck_1')
  })
})
