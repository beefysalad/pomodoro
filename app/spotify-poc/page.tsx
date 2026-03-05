'use client'

import { useEffect, useState } from 'react'
import { Music2, PauseCircle, PlayCircle, Unplug } from 'lucide-react'
import { AppHeader } from '@/components/app-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

type SpotifyStatus = {
  connected: boolean
  profile?: {
    id: string
    displayName: string
    email?: string
    product?: string
  }
}

export default function SpotifyPocPage() {
  const [status, setStatus] = useState<SpotifyStatus>({ connected: false })
  const [loading, setLoading] = useState(true)

  const loadStatus = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/integrations/spotify/status', {
        cache: 'no-store',
      })
      const data = (await response.json()) as SpotifyStatus
      setStatus(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadStatus()
  }, [])

  const onConnect = () => {
    window.location.href = '/api/integrations/spotify/start'
  }

  const onDisconnect = async () => {
    await fetch('/api/integrations/spotify/disconnect', { method: 'POST' })
    await loadStatus()
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#070b16] text-slate-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-[-120px] right-[-120px] h-[350px] w-[350px] rounded-full bg-green-500/10 blur-[120px]" />
        <div className="absolute bottom-[-100px] left-[-100px] h-[350px] w-[350px] rounded-full bg-violet-600/12 blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-10">
        <AppHeader />

        <section>
          <p className="text-xs font-semibold tracking-[0.18em] text-green-300 uppercase">
            Spotify POC
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">
            Pomodoro soundtrack integration
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Proof-of-concept OAuth wiring for connecting Spotify to your study sessions.
          </p>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <Card className="border-white/10 bg-white/[0.05] py-0 backdrop-blur-xl">
            <CardContent className="space-y-4 px-4 py-5 sm:px-6">
              <h2 className="text-lg font-bold text-white">Connection</h2>

              {loading ? (
                <p className="text-sm text-slate-400">Checking Spotify status...</p>
              ) : status.connected ? (
                <div className="space-y-2 text-sm text-slate-200">
                  <p className="inline-flex items-center gap-2 text-green-300">
                    <Music2 className="h-4 w-4" />
                    Connected
                  </p>
                  <p>
                    Account: <span className="font-semibold">{status.profile?.displayName}</span>
                  </p>
                  <p>Plan: {status.profile?.product ?? 'Unknown'}</p>
                </div>
              ) : (
                <p className="text-sm text-slate-300">
                  Not connected. Link Spotify to control playback during focus sessions.
                </p>
              )}

              <div className="flex items-center gap-2">
                <Button onClick={onConnect} className="bg-green-600 text-white hover:bg-green-500">
                  <Music2 className="h-4 w-4" />
                  Connect Spotify
                </Button>
                <Button
                  variant="outline"
                  onClick={onDisconnect}
                  className="border-white/15 bg-white/5 text-slate-200 hover:bg-white/10"
                >
                  <Unplug className="h-4 w-4" />
                  Disconnect
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/[0.05] py-0 backdrop-blur-xl">
            <CardContent className="space-y-4 px-4 py-5 sm:px-6">
              <h2 className="text-lg font-bold text-white">Next step hooks</h2>
              <div className="space-y-2 text-sm text-slate-300">
                <p className="inline-flex items-center gap-2">
                  <PlayCircle className="h-4 w-4 text-cyan-300" />
                  Auto-play “Focus Mix” when Pomodoro starts
                </p>
                <p className="inline-flex items-center gap-2">
                  <PauseCircle className="h-4 w-4 text-cyan-300" />
                  Auto-pause music when timer ends
                </p>
                <p className="text-slate-400">
                  Wire these to your timer start/finish actions using the access token from this POC.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  )
}
