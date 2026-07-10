import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { toErrorResponse } from './api-errors'
import { NotFoundError, ForbiddenError } from './errors'

describe('toErrorResponse', () => {
  it('maps a ZodError to 400 with issues', async () => {
    const schema = z.object({ name: z.string().min(1) })
    const result = schema.safeParse({ name: '' })
    if (result.success) throw new Error('expected parse to fail')

    const response = toErrorResponse(result.error, 'test')
    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toBe('Invalid request')
    expect(Array.isArray(body.issues)).toBe(true)
  })

  it('maps NotFoundError to 404', async () => {
    const response = toErrorResponse(new NotFoundError('Subject not found'), 'test')
    expect(response.status).toBe(404)
    const body = await response.json()
    expect(body.error).toBe('Subject not found')
  })

  it('maps ForbiddenError to 403', async () => {
    const response = toErrorResponse(new ForbiddenError('Not your subject'), 'test')
    expect(response.status).toBe(403)
    const body = await response.json()
    expect(body.error).toBe('Not your subject')
  })

  it('maps unknown errors to 500 and logs them under the given label', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const response = toErrorResponse(new Error('boom'), 'test label')
    expect(response.status).toBe(500)
    const body = await response.json()
    expect(body.error).toBe('Internal Server Error')
    expect(consoleSpy).toHaveBeenCalledWith('test label', expect.any(Error))
    consoleSpy.mockRestore()
  })
})
