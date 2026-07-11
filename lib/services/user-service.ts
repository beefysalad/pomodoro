import prisma from '@/lib/prisma'
import * as userRepository from '@/lib/repositories/user-repository'
import type { User } from '@/app/generated/prisma/client'
import type { UpdatePreferencesInput } from '@/lib/repositories/user-repository'

export async function updateUserPreferences(
  userId: string,
  input: UpdatePreferencesInput
): Promise<User> {
  return userRepository.updatePreferences(prisma, userId, input)
}
