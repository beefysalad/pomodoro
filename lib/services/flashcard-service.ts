import prisma from '@/lib/prisma'
import * as flashcardRepository from '@/lib/repositories/flashcard-repository'
import * as flashcardDeckRepository from '@/lib/repositories/flashcard-deck-repository'
import { NotFoundError } from '@/lib/errors'

function normalizeChoices(choices: string[] | undefined, answer: string | undefined) {
  if (choices === undefined) return undefined
  const trimmed = choices.map((choice) => choice.trim()).filter(Boolean)
  const unique = Array.from(new Set(trimmed))
  const withAnswer = answer && !unique.includes(answer) ? [...unique, answer] : unique
  return withAnswer.slice(0, 6)
}

async function assertOwnedDeck(userId: string, deckId: string) {
  const deck = await flashcardDeckRepository.findByIdWithSubject(prisma, deckId)
  if (!deck || deck.subject.userId !== userId) {
    throw new NotFoundError('Deck not found or unauthorized')
  }
  return deck
}

async function assertOwnedCard(userId: string, deckId: string, cardId: string) {
  const card = await flashcardRepository.findByIdWithDeckSubject(prisma, cardId)
  if (!card || card.deckId !== deckId || card.deck.subject.userId !== userId) {
    throw new NotFoundError('Flashcard not found or unauthorized')
  }
  return card
}

export async function listCardsForDeck(userId: string, deckId: string) {
  await assertOwnedDeck(userId, deckId)
  return flashcardRepository.findManyByDeckId(prisma, deckId)
}

export interface CreateCardInput {
  question: string
  answer: string
  hint?: string | null
  choices?: string[]
}

export async function createCard(userId: string, deckId: string, input: CreateCardInput) {
  await assertOwnedDeck(userId, deckId)

  const choices = normalizeChoices(input.choices ?? [], input.answer) ?? []

  return flashcardRepository.create(prisma, {
    deckId,
    question: input.question,
    answer: input.answer,
    hint: input.hint ?? null,
    choices,
  })
}

export interface UpdateCardInput {
  question?: string
  answer?: string
  hint?: string | null
  choices?: string[]
  status?: string
  lastReviewedAt?: string | null
}

export async function updateCard(
  userId: string,
  deckId: string,
  cardId: string,
  input: UpdateCardInput
) {
  await assertOwnedCard(userId, deckId, cardId)

  const choices = normalizeChoices(input.choices, input.answer)

  return flashcardRepository.update(prisma, cardId, {
    ...(input.question !== undefined && { question: input.question }),
    ...(input.answer !== undefined && { answer: input.answer }),
    ...(input.hint !== undefined && { hint: input.hint }),
    ...(choices !== undefined && { choices }),
    ...(input.status !== undefined && { status: input.status }),
    ...(input.lastReviewedAt !== undefined && {
      lastReviewedAt: input.lastReviewedAt ? new Date(input.lastReviewedAt) : null,
    }),
  })
}

export async function deleteCard(userId: string, deckId: string, cardId: string) {
  await assertOwnedCard(userId, deckId, cardId)
  await flashcardRepository.deleteById(prisma, cardId)
}
