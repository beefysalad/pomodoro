import prisma from '@/lib/prisma'
import * as subjectRepository from '@/lib/repositories/subject-repository'
import { generateUniqueSlug } from '@/lib/helper'
import { SUBJECT_COLORS } from '@/lib/schemas/subject'
import { NotFoundError } from '@/lib/errors'
import type { Subject } from '@/app/generated/prisma/client'

export async function assertOwnedSubject(userId: string, subjectId: string): Promise<Subject> {
  const subject = await subjectRepository.findById(prisma, subjectId)
  if (!subject || subject.userId !== userId) {
    throw new NotFoundError('Subject not found or unauthorized')
  }
  return subject
}

export function listSubjects(userId: string): Promise<Subject[]> {
  return subjectRepository.findManyByUserId(prisma, userId)
}

export interface CreateSubjectInput {
  name: string
  color?: string
}

export async function createSubject(userId: string, input: CreateSubjectInput): Promise<Subject> {
  const color = input.color || SUBJECT_COLORS[Math.floor(Math.random() * SUBJECT_COLORS.length)]

  const lastSubject = await subjectRepository.findLastPositionByUserId(prisma, userId)
  const slug = await generateUniqueSlug(input.name)
  const newPosition = lastSubject ? lastSubject.position + 1 : 0

  return subjectRepository.create(prisma, {
    name: input.name,
    userId,
    color,
    position: newPosition,
    slug,
  })
}

export interface ReorderUpdate {
  id: string
  position: number
}

export async function reorderSubjects(userId: string, updates: ReorderUpdate[]): Promise<void> {
  await prisma.$transaction(
    updates.map((update) => subjectRepository.updatePosition(prisma, update.id, userId, update.position))
  )
}

export async function deleteSubject(userId: string, subjectId: string): Promise<void> {
  await assertOwnedSubject(userId, subjectId)
  await subjectRepository.deleteByIdForUser(prisma, subjectId, userId)
}
