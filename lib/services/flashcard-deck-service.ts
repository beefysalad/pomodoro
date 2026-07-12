import prisma from '@/lib/prisma'
import * as flashcardDeckRepository from '@/lib/repositories/flashcard-deck-repository'
import { assertOwnedSubject } from '@/lib/services/subject-service'
import { NotFoundError } from '@/lib/errors'
import type { FlashcardDeck } from '@/app/generated/prisma/client'

export async function assertOwnedDeck(
  userId: string,
  subjectId: string,
  deckId: string
): Promise<FlashcardDeck> {
  await assertOwnedSubject(userId, subjectId)
  const deck = await flashcardDeckRepository.findById(prisma, deckId)
  if (!deck || deck.subjectId !== subjectId) {
    throw new NotFoundError('Deck not found')
  }
  return deck
}

export async function listDecksForSubject(userId: string, subjectId: string) {
  await assertOwnedSubject(userId, subjectId)
  return flashcardDeckRepository.findManyBySubjectId(prisma, subjectId)
}

export async function createDeck(userId: string, subjectId: string, name: string) {
  await assertOwnedSubject(userId, subjectId)
  return flashcardDeckRepository.create(prisma, { name, subjectId })
}

export async function updateDeck(userId: string, subjectId: string, deckId: string, name: string) {
  await assertOwnedDeck(userId, subjectId, deckId)
  return flashcardDeckRepository.update(prisma, deckId, name)
}

export async function deleteDeck(userId: string, subjectId: string, deckId: string) {
  await assertOwnedDeck(userId, subjectId, deckId)
  await flashcardDeckRepository.deleteById(prisma, deckId)
}
