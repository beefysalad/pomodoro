import { describe, expect, it, vi, beforeEach } from 'vitest'
import prisma from '@/lib/prisma'
import * as flashcardRepository from '@/lib/repositories/flashcard-repository'
import * as flashcardDeckRepository from '@/lib/repositories/flashcard-deck-repository'
import { NotFoundError } from '@/lib/errors'
import { createCard, updateCard } from './flashcard-service'
import type { Flashcard, Subject } from '@/app/generated/prisma/client'

vi.mock('@/lib/prisma', () => ({ default: {} }))
vi.mock('@/lib/repositories/flashcard-repository')
vi.mock('@/lib/repositories/flashcard-deck-repository')

// Builds a fake of T from a partial shape without using `any` — every test
// file in this plan that needs a fake Prisma-shaped object uses this same
// helper, redefined locally per file.
function fake<T>(partial: Partial<T>): T {
  return partial as T
}

type DeckWithSubject = NonNullable<
  Awaited<ReturnType<typeof flashcardDeckRepository.findByIdWithSubject>>
>
type CardWithDeckSubject = NonNullable<
  Awaited<ReturnType<typeof flashcardRepository.findByIdWithDeckSubject>>
>

describe('createCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('throws NotFoundError when the deck does not belong to the user', async () => {
    vi.mocked(flashcardDeckRepository.findByIdWithSubject).mockResolvedValue(
      fake<DeckWithSubject>({
        id: 'deck_1',
        subject: fake<Subject>({ userId: 'someone_else' }),
      })
    )

    await expect(
      createCard('user_1', 'deck_1', { question: 'Q', answer: 'A' })
    ).rejects.toThrow(NotFoundError)
  })

  it('de-duplicates choices, trims whitespace, adds the answer if missing, and caps at 6', async () => {
    vi.mocked(flashcardDeckRepository.findByIdWithSubject).mockResolvedValue(
      fake<DeckWithSubject>({
        id: 'deck_1',
        subject: fake<Subject>({ userId: 'user_1' }),
      })
    )
    vi.mocked(flashcardRepository.create).mockResolvedValue(fake<Flashcard>({ id: 'card_1' }))

    await createCard('user_1', 'deck_1', {
      question: 'Q',
      answer: 'Correct',
      choices: [' Correct ', 'Correct', 'B', 'C', 'D', 'E', 'F', 'G'],
    })

    expect(flashcardRepository.create).toHaveBeenCalledWith(prisma, {
      deckId: 'deck_1',
      question: 'Q',
      answer: 'Correct',
      hint: null,
      choices: ['Correct', 'B', 'C', 'D', 'E', 'F'],
    })
  })

  it('appends the answer when it is missing from the provided choices', async () => {
    vi.mocked(flashcardDeckRepository.findByIdWithSubject).mockResolvedValue(
      fake<DeckWithSubject>({
        id: 'deck_1',
        subject: fake<Subject>({ userId: 'user_1' }),
      })
    )
    vi.mocked(flashcardRepository.create).mockResolvedValue(fake<Flashcard>({ id: 'card_1' }))

    await createCard('user_1', 'deck_1', {
      question: 'Q',
      answer: 'Correct',
      choices: ['B', 'C'],
    })

    expect(flashcardRepository.create).toHaveBeenCalledWith(
      prisma,
      expect.objectContaining({ choices: ['B', 'C', 'Correct'] })
    )
  })
})

describe('updateCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('throws NotFoundError when the card does not belong to the given deck', async () => {
    vi.mocked(flashcardRepository.findByIdWithDeckSubject).mockResolvedValue(
      fake<CardWithDeckSubject>({
        id: 'card_1',
        deckId: 'deck_other',
        deck: fake<CardWithDeckSubject['deck']>({
          subject: fake<Subject>({ userId: 'user_1' }),
        }),
      })
    )

    await expect(
      updateCard('user_1', 'deck_1', 'card_1', { question: 'New question' })
    ).rejects.toThrow(NotFoundError)
  })

  it('leaves choices untouched when the update does not include them', async () => {
    vi.mocked(flashcardRepository.findByIdWithDeckSubject).mockResolvedValue(
      fake<CardWithDeckSubject>({
        id: 'card_1',
        deckId: 'deck_1',
        deck: fake<CardWithDeckSubject['deck']>({
          subject: fake<Subject>({ userId: 'user_1' }),
        }),
      })
    )
    vi.mocked(flashcardRepository.update).mockResolvedValue(fake<Flashcard>({ id: 'card_1' }))

    await updateCard('user_1', 'deck_1', 'card_1', { question: 'New question' })

    expect(flashcardRepository.update).toHaveBeenCalledWith(prisma, 'card_1', {
      question: 'New question',
    })
  })
})
