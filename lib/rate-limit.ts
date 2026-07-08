import prisma from './prisma'

export interface RateLimitConfig {
  limit: number
  windowMs: number
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  retryAfterSeconds: number
}

// Fixed-window counter backed by Postgres (see RateLimitBucket in schema.prisma).
// The upsert's increment is a single atomic statement, so concurrent requests
// across any number of serverless instances still count correctly.
const CLEANUP_PROBABILITY = 0.02

export async function checkRateLimit(
  identifier: string,
  { limit, windowMs }: RateLimitConfig
): Promise<RateLimitResult> {
  const now = Date.now()
  const windowStart = Math.floor(now / windowMs) * windowMs
  const key = `${identifier}:${windowStart}`
  const expiresAt = new Date(windowStart + windowMs)

  const bucket = await prisma.rateLimitBucket.upsert({
    where: { key },
    create: { key, count: 1, expiresAt },
    update: { count: { increment: 1 } },
  })

  if (Math.random() < CLEANUP_PROBABILITY) {
    void prisma.rateLimitBucket
      .deleteMany({ where: { expiresAt: { lt: new Date() } } })
      .catch(() => undefined)
  }

  return {
    allowed: bucket.count <= limit,
    remaining: Math.max(0, limit - bucket.count),
    retryAfterSeconds: Math.max(1, Math.ceil((expiresAt.getTime() - now) / 1000)),
  }
}

// XP-awarding endpoint: the tightest limit since it's the direct abuse vector
// for farming XP/streak. 12/5min is generous for real usage (the shortest mode
// takes 10 real minutes) but blocks scripted spam.
export const SESSION_CREATE_RATE_LIMIT: RateLimitConfig = {
  limit: 12,
  windowMs: 5 * 60 * 1000,
}

// Default for other authenticated mutation routes (create/update/delete/reorder).
export const DEFAULT_MUTATION_RATE_LIMIT: RateLimitConfig = {
  limit: 30,
  windowMs: 60 * 1000,
}
