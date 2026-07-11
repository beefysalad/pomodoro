import type { User } from '@/app/generated/prisma/client'
import type { Db } from '@/lib/db'

export interface UpsertUserInput {
  clerkUserId: string
  email: string
  firstName: string | null
  lastName: string | null
}

export function findById(db: Db, id: string): Promise<User | null> {
  return db.user.findUnique({ where: { id } })
}

export function findByClerkId(db: Db, clerkUserId: string): Promise<User | null> {
  return db.user.findUnique({ where: { clerkUserId } })
}

export function upsertByClerkId(db: Db, input: UpsertUserInput): Promise<User> {
  return db.user.upsert({
    where: { clerkUserId: input.clerkUserId },
    update: {
      email: input.email,
      firstName: input.firstName,
      lastName: input.lastName,
    },
    create: input,
  })
}

export function createByClerkId(db: Db, input: UpsertUserInput): Promise<User> {
  return db.user.create({ data: input })
}

export function updateByClerkId(
  db: Db,
  clerkUserId: string,
  data: { email: string; firstName: string | null; lastName: string | null }
): Promise<User> {
  return db.user.update({ where: { clerkUserId }, data })
}

export function deleteByClerkId(db: Db, clerkUserId: string): Promise<User> {
  return db.user.delete({ where: { clerkUserId } })
}

export interface UpdatePreferencesInput {
  onboarded?: boolean
  timezone?: string
  blitzMinutes?: number
  focusMinutes?: number
  deepMinutes?: number
  shortBreakMinutes?: number
  longBreakMinutes?: number
  hasSeenTutorial?: boolean
}

export function updatePreferences(db: Db, id: string, data: UpdatePreferencesInput): Promise<User> {
  return db.user.update({ where: { id }, data })
}

export interface UpdateProgressionInput {
  totalXP: number
  streak: number
  lastStudiedAt: Date
  timezone?: string
}

export function updateProgression(db: Db, id: string, data: UpdateProgressionInput): Promise<User> {
  return db.user.update({ where: { id }, data })
}

export interface LockedUserRow {
  totalXP: number
  streak: number
  lastStudiedAt: Date | null
  timezone: string
}

export async function lockForUpdate(db: Db, userId: string): Promise<LockedUserRow | null> {
  const rows = await db.$queryRaw<LockedUserRow[]>`
    SELECT "totalXP", streak, "lastStudiedAt", timezone
    FROM "User"
    WHERE id = ${userId}
    FOR UPDATE
  `
  return rows[0] ?? null
}
