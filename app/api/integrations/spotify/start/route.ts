import { NextResponse } from 'next/server'
import {
  createCodeChallenge,
  createCodeVerifier,
  createOAuthState,
  getSpotifyConfig,
  SPOTIFY_SCOPES,
} from '@/lib/spotify'

export async function GET() {
  const { clientId, redirectUri } = getSpotifyConfig()

  if (!clientId) {
    return NextResponse.json(
      { error: 'Missing SPOTIFY_CLIENT_ID' },
      { status: 500 }
    )
  }

  const verifier = createCodeVerifier()
  const challenge = createCodeChallenge(verifier)
  const state = createOAuthState()

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    code_challenge_method: 'S256',
    code_challenge: challenge,
    state,
    scope: SPOTIFY_SCOPES.join(' '),
    show_dialog: 'true',
  })

  const authUrl = `https://accounts.spotify.com/authorize?${params.toString()}`
  const response = NextResponse.redirect(authUrl)

  response.cookies.set('spotify_oauth_state', state, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 10,
  })

  response.cookies.set('spotify_code_verifier', verifier, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 10,
  })

  return response
}
