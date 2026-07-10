import type { FlashcardDeck } from '@/app/generated/prisma/client'
import type { Db } from '@/lib/db'

export function findManyBySubjectId(db: Db, subjectId: string): Promise<FlashcardDeck[]> {
  return db.flashcardDeck.findMany({
    where: { subjectId },
    orderBy: { createdAt: 'desc' },
  })
}

export function findById(db: Db, id: string): Promise<FlashcardDeck | null> {
  return db.flashcardDeck.findUnique({ where: { id } })
}

export function findByIdWithSubject(db: Db, id: string) {
  return db.flashcardDeck.findUnique({
    where: { id },
    include: { subject: true },
  })
}

export interface CreateDeckInput {
  name: string
  subjectId: string
}

export function create(db: Db, data: CreateDeckInput): Promise<FlashcardDeck> {
  return db.flashcardDeck.create({ data })
}

export function update(db: Db, id: string, name: string): Promise<FlashcardDeck> {
  return db.flashcardDeck.update({ where: { id }, data: { name } })
}

export function deleteById(db: Db, id: string): Promise<FlashcardDeck> {
  return db.flashcardDeck.delete({ where: { id } })
}
