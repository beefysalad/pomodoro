import { NextRequest, NextResponse } from 'next/server'
import { getSpotifyConfig } from '@/lib/spotify'

export async function GET(req: NextRequest) {
  const { clientId, clientSecret, redirectUri, appUrl } = getSpotifyConfig()

  if (!clientId) {
    return NextResponse.json(
      { error: 'Missing SPOTIFY_CLIENT_ID' },
      { status: 500 }
    )
  }

  const code = req.nextUrl.searchParams.get('code')
  const state = req.nextUrl.searchParams.get('state')
  const error = req.nextUrl.searchParams.get('error')

  if (error || !code || !state) {
    return NextResponse.redirect(`${appUrl}/spotify-poc?spotify=failed`)
  }

  const expectedState = req.cookies.get('spotify_oauth_state')?.value
  const verifier = req.cookies.get('spotify_code_verifier')?.value

  if (!expectedState || expectedState !== state || !verifier) {
    return NextResponse.redirect(`${appUrl}/spotify-poc?spotify=state_mismatch`)
  }

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    client_id: clientId,
    code_verifier: verifier,
  })

  const headers: Record<string, string> = {
    'Content-Type': 'application/x-www-form-urlencoded',
  }

  if (clientSecret) {
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString(
      'base64'
    )
    headers.Authorization = `Basic ${credentials}`
  }

  const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers,
    body,
    cache: 'no-store',
  })

  if (!tokenRes.ok) {
    return NextResponse.redirect(`${appUrl}/spotify-poc?spotify=token_failed`)
  }

  const tokenData = (await tokenRes.json()) as {
    access_token: string
    refresh_token?: string
    expires_in?: number
  }

  const response = NextResponse.redirect(`${appUrl}/spotify-poc?spotify=connected`)

  response.cookies.set('spotify_access_token', tokenData.access_token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: tokenData.expires_in || 3600,
  })

  if (tokenData.refresh_token) {
    response.cookies.set('spotify_refresh_token', tokenData.refresh_token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    })
  }

  response.cookies.delete('spotify_oauth_state')
  response.cookies.delete('spotify_code_verifier')

  return response
}
