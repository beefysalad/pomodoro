import { NextResponse } from 'next/server'
import { z } from 'zod'
import { NotFoundError, ForbiddenError } from '@/lib/errors'

export function toErrorResponse(error: unknown, logLabel: string): NextResponse {
  if (error instanceof z.ZodError) {
    return NextResponse.json(
      { error: 'Invalid request', issues: error.issues },
      { status: 400 }
    )
  }
  if (error instanceof NotFoundError) {
    return NextResponse.json({ error: error.message }, { status: 404 })
  }
  if (error instanceof ForbiddenError) {
    return NextResponse.json({ error: error.message }, { status: 403 })
  }
  console.error(logLabel, error)
  return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
}
