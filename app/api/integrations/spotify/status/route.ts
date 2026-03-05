import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const accessToken = req.cookies.get('spotify_access_token')?.value

  if (!accessToken) {
    return NextResponse.json({ connected: false })
  }

  const meRes = await fetch('https://api.spotify.com/v1/me', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: 'no-store',
  })

  if (!meRes.ok) {
    return NextResponse.json({ connected: false })
  }

  const me = (await meRes.json()) as {
    id: string
    display_name: string
    email?: string
    product?: string
  }

  return NextResponse.json({
    connected: true,
    profile: {
      id: me.id,
      displayName: me.display_name,
      email: me.email,
      product: me.product,
    },
  })
}
