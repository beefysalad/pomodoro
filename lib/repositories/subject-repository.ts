import type { Subject } from '@/app/generated/prisma/client'
import type { Db } from '@/lib/db'

export function findManyByUserId(db: Db, userId: string): Promise<Subject[]> {
  return db.subject.findMany({
    where: { userId },
    orderBy: { position: 'asc' },
  })
}

export function findById(db: Db, id: string): Promise<Subject | null> {
  return db.subject.findUnique({ where: { id } })
}

export function findLastPositionByUserId(db: Db, userId: string) {
  return db.subject.findFirst({
    where: { userId },
    orderBy: { position: 'desc' },
    select: { position: true },
  })
}

export interface CreateSubjectInput {
  name: string
  userId: string
  color: string
  position: number
  slug: string
}

export function create(db: Db, data: CreateSubjectInput): Promise<Subject> {
  return db.subject.create({ data })
}

// Not async — must return the Prisma call's lazy PrismaPromise directly
// (no await) so callers can batch it inside prisma.$transaction([...]).
// Wrapping this in an async function would execute it immediately and
// break the atomicity of a batched reorder.
export function updatePosition(db: Db, id: string, userId: string, position: number) {
  return db.subject.updateMany({
    where: { id, userId },
    data: { position },
  })
}

export function deleteByIdForUser(db: Db, id: string, userId: string): Promise<Subject> {
  return db.subject.delete({ where: { id, userId } })
}
