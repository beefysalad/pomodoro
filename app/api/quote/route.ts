import { NextResponse } from 'next/server'

const ZEN_QUOTES_URL = 'https://zenquotes.io/api/random'

export async function GET() {
  try {
    const response = await fetch(ZEN_QUOTES_URL, { cache: 'no-store' })

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch quote' },
        { status: response.status }
      )
    }

    const data = (await response.json()) as Array<{ q: string; a: string }>
    const first = data?.[0]

    if (!first?.q || !first?.a) {
      return NextResponse.json(
        { error: 'Quote not available' },
        { status: 502 }
      )
    }

    return NextResponse.json({ text: first.q, author: first.a })
  } catch (error) {
    console.error('Quote fetch error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
