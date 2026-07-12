import { CheckCircle2, Link2, Loader2, Unplug } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export type SpotifyStatusResponse = {
  connected: boolean
  profile?: {
    id: string
    displayName: string
    email?: string
    product?: string
  }
}

export type SpotifyStatus = {
  connected: boolean
  isLoading: boolean
  isDisconnecting?: boolean
  profile?: SpotifyStatusResponse['profile']
}

export function SpotifyConnectionCard({
  spotifyState,
  onConnect,
  onDisconnect,
}: {
  spotifyState: SpotifyStatus
  onConnect: () => void
  onDisconnect: () => void
}) {
  return (
    <Card className="py-0 backdrop-blur-xl">
      <CardContent className="space-y-4 px-4 py-5 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold tracking-[0.18em] text-cyan-300 uppercase">
              Integrations
            </p>
            <h2 className="mt-1 text-xl font-black text-white">
              Spotify (FUTURE FEATURE)
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Connect flow for future focus playlists and session audio
              controls.
            </p>
          </div>
          {spotifyState.connected ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-semibold text-emerald-200">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Connected
            </span>
          ) : (
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-slate-300">
              Not connected
            </span>
          )}
        </div>

        <div className="bg-glass-subtle rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-300">
          {spotifyState.isLoading ? (
            <span className="inline-flex items-center gap-2 text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              Checking Spotify status...
            </span>
          ) : spotifyState.connected ? (
            <p>
              Connected as{' '}
              <span className="font-semibold text-white">
                {spotifyState.profile?.displayName || 'Spotify user'}
              </span>
              {spotifyState.profile?.product
                ? ` · ${spotifyState.profile.product} plan`
                : ''}
            </p>
          ) : (
            <p>
              Connect Spotify to prepare for music controls during Pomodoro
              sessions.
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            disabled={true}
            type="button"
            onClick={onConnect}
            // disabled={
            //   spotifyState.isLoading || spotifyState.isDisconnecting
            // }
            className="bg-emerald-600 text-white hover:bg-emerald-500"
          >
            <Link2 className="h-4 w-4" />
            Connect Spotify
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onDisconnect}
            disabled={
              spotifyState.isLoading ||
              spotifyState.isDisconnecting ||
              !spotifyState.connected
            }
            className="bg-glass-empty border-white/20 text-slate-200 hover:bg-white/[0.06]"
          >
            {spotifyState.isDisconnecting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Unplug className="h-4 w-4" />
            )}
            Disconnect
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
