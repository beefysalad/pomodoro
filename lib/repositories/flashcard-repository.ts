import type { Flashcard } from '@/app/generated/prisma/client'
import type { Db } from '@/lib/db'

export function findManyByDeckId(db: Db, deckId: string): Promise<Flashcard[]> {
  return db.flashcard.findMany({
    where: { deckId },
    orderBy: { createdAt: 'desc' },
  })
}

export function findById(db: Db, id: string): Promise<Flashcard | null> {
  return db.flashcard.findUnique({ where: { id } })
}

export function findByIdWithDeckSubject(db: Db, id: string) {
  return db.flashcard.findUnique({
    where: { id },
    include: { deck: { include: { subject: true } } },
  })
}

export interface CreateFlashcardInput {
  deckId: string
  question: string
  answer: string
  hint: string | null
  choices: string[]
}

export function create(db: Db, data: CreateFlashcardInput): Promise<Flashcard> {
  return db.flashcard.create({ data })
}

export interface UpdateFlashcardInput {
  question?: string
  answer?: string
  hint?: string | null
  choices?: string[]
  status?: string
  lastReviewedAt?: Date | null
}

export function update(db: Db, id: string, data: UpdateFlashcardInput): Promise<Flashcard> {
  return db.flashcard.update({ where: { id }, data })
}

export function deleteById(db: Db, id: string): Promise<Flashcard> {
  return db.flashcard.delete({ where: { id } })
}
