import { NextResponse } from 'next/server'

export async function POST() {
  const response = NextResponse.json({ success: true })
  response.cookies.delete('spotify_access_token')
  response.cookies.delete('spotify_refresh_token')
  response.cookies.delete('spotify_oauth_state')
  response.cookies.delete('spotify_code_verifier')
  return response
}
