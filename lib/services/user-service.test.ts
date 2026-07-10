import { describe, expect, it, vi, beforeEach } from 'vitest'
import prisma from '@/lib/prisma'
import * as userRepository from '@/lib/repositories/user-repository'
import { updateUserPreferences } from './user-service'

vi.mock('@/lib/prisma', () => ({ default: {} }))
vi.mock('@/lib/repositories/user-repository')

describe('updateUserPreferences', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('passes the input through to the repository with the shared prisma client', async () => {
    const fakeUser = { id: 'user_1' } as any
    vi.mocked(userRepository.updatePreferences).mockResolvedValue(fakeUser)

    const result = await updateUserPreferences('user_1', {
      onboarded: true,
      timezone: 'America/New_York',
    })

    expect(userRepository.updatePreferences).toHaveBeenCalledWith(prisma, 'user_1', {
      onboarded: true,
      timezone: 'America/New_York',
    })
    expect(result).toBe(fakeUser)
  })
})
