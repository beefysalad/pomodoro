import { NextResponse } from 'next/server'

const ZEN_QUOTES_URL = 'https://zenquotes.io/api/random'
const CACHE_TTL_MS = 1000 * 60 * 10

let cachedQuote: { text: string; author: string } | null = null
let cachedAt = 0

export async function GET() {
  try {
    const now = Date.now()
    if (cachedQuote && now - cachedAt < CACHE_TTL_MS) {
      return NextResponse.json(cachedQuote)
    }

    const response = await fetch(ZEN_QUOTES_URL, { cache: 'no-store' })

    if (!response.ok) {
      if (cachedQuote) {
        return NextResponse.json(cachedQuote)
      }
      return NextResponse.json(
        { error: 'Failed to fetch quote' },
        { status: response.status }
      )
    }

    const data = (await response.json()) as Array<{ q: string; a: string }>
    const first = data?.[0]

    if (!first?.q || !first?.a) {
      if (cachedQuote) {
        return NextResponse.json(cachedQuote)
      }
      return NextResponse.json(
        { error: 'Quote not available' },
        { status: 502 }
      )
    }

    cachedQuote = { text: first.q, author: first.a }
    cachedAt = now
    return NextResponse.json(cachedQuote)
  } catch (error) {
    console.error('Quote fetch error:', error)
    if (cachedQuote) {
      return NextResponse.json(cachedQuote)
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
