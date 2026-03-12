'use client'

import { useEffect, useMemo, useState } from 'react'
import { useForm, type UseFormRegisterReturn } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2, Link2, Loader2, Save, Timer, Unplug } from 'lucide-react'
import { AppHeader } from '@/components/app-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useUpdateUser, useUser } from '@/hooks/use-user'

const timerSchema = z
  .object({
    blitzMinutes: z.preprocess(
      (val) => (val === '' ? undefined : Number(val)),
      z.number().int().min(5).max(120)
    ),
    focusMinutes: z.preprocess(
      (val) => (val === '' ? undefined : Number(val)),
      z.number().int().min(10).max(180)
    ),
    deepMinutes: z.preprocess(
      (val) => (val === '' ? undefined : Number(val)),
      z.number().int().min(15).max(240)
    ),
    shortBreakMinutes: z.preprocess(
      (val) => (val === '' ? undefined : Number(val)),
      z.number().int().min(1).max(30)
    ),
    longBreakMinutes: z.preprocess(
      (val) => (val === '' ? undefined : Number(val)),
      z.number().int().min(5).max(60)
    ),
  })
  .superRefine((data, ctx) => {
    if (data.longBreakMinutes < data.shortBreakMinutes) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Long break should be greater than or equal to short break.',
        path: ['longBreakMinutes'],
      })
    }
  })

type TimerFormInput = z.input<typeof timerSchema>
type TimerFormValues = z.output<typeof timerSchema>

export default function SettingsPage() {
  const { data: user, isLoading } = useUser()
  const updateUser = useUpdateUser()
  const [spotifyState, setSpotifyState] = useState<SpotifyStatus>({
    connected: false,
    isLoading: true,
  })
  const [settingsMessage, setSettingsMessage] = useState('')

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<TimerFormInput, unknown, TimerFormValues>({
    resolver: zodResolver(timerSchema),
    defaultValues: {
      blitzMinutes: user?.blitzMinutes ?? 10,
      focusMinutes: user?.focusMinutes ?? 25,
      deepMinutes: user?.deepMinutes ?? 50,
      shortBreakMinutes: user?.shortBreakMinutes ?? 5,
      longBreakMinutes: user?.longBreakMinutes ?? 10,
    },
  })
  const isBusy = useMemo(
    () =>
      isLoading ||
      isSubmitting ||
      updateUser.isPending ||
      spotifyState.isDisconnecting,
    [isLoading, isSubmitting, updateUser.isPending, spotifyState.isDisconnecting]
  )

  useEffect(() => {
    const loadSpotifyStatus = async () => {
      try {
        const response = await fetch('/api/integrations/spotify/status', {
          cache: 'no-store',
        })
        if (!response.ok) {
          throw new Error('Could not load Spotify status')
        }
        const data = (await response.json()) as SpotifyStatusResponse
        setSpotifyState({
          connected: data.connected,
          profile: data.profile,
          isLoading: false,
        })
      } catch {
        setSpotifyState({
          connected: false,
          isLoading: false,
        })
      }
    }

    void loadSpotifyStatus()
  }, [])

  useEffect(() => {
    if (!user) return
    reset({
      blitzMinutes: user.blitzMinutes ?? 10,
      focusMinutes: user.focusMinutes ?? 25,
      deepMinutes: user.deepMinutes ?? 50,
      shortBreakMinutes: user.shortBreakMinutes ?? 5,
      longBreakMinutes: user.longBreakMinutes ?? 10,
    })
  }, [reset, user])

  const onSave = handleSubmit(
    async (values) => {
      try {
        await updateUser.mutateAsync({
          blitzMinutes: values.blitzMinutes,
          focusMinutes: values.focusMinutes,
          deepMinutes: values.deepMinutes,
          shortBreakMinutes: values.shortBreakMinutes,
          longBreakMinutes: values.longBreakMinutes,
        })
        setSettingsMessage('Timer settings saved.')
      } catch {
        setSettingsMessage('Could not save settings.')
      }
    },
    () => {
      setSettingsMessage('Fix the highlighted fields and try again.')
    }
  )

  const onSpotifyConnect = () => {
    window.location.href = '/api/integrations/spotify/start'
  }

  const onSpotifyDisconnect = async () => {
    try {
      setSpotifyState((prev) => ({ ...prev, isDisconnecting: true }))
      const response = await fetch('/api/integrations/spotify/disconnect', {
        method: 'POST',
      })
      if (!response.ok) {
        throw new Error('Could not disconnect Spotify')
      }
      setSpotifyState({
        connected: false,
        isLoading: false,
      })
      setSettingsMessage('Spotify disconnected.')
    } catch {
      setSettingsMessage('Could not disconnect Spotify.')
    } finally {
      setSpotifyState((prev) => ({ ...prev, isDisconnecting: false }))
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#070b16] text-slate-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-[-120px] right-[-120px] h-[360px] w-[360px] rounded-full bg-violet-600/12 blur-[130px]" />
        <div className="absolute bottom-[-120px] left-[-120px] h-[360px] w-[360px] rounded-full bg-cyan-500/10 blur-[130px]" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-10">
        <AppHeader />

        <section>
          <p className="text-xs font-semibold tracking-[0.18em] text-cyan-300 uppercase">
            Settings
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">
            Timer preferences
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Customize Blitz, Focus, Deep, and break durations. Dashboard timers
            will use these values.
          </p>
        </section>

        {!!settingsMessage && (
          <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-slate-300">
            {settingsMessage}
          </div>
        )}

        <Card className="border-white/10 bg-white/[0.05] py-0 backdrop-blur-xl">
          <CardContent className="space-y-5 px-4 py-5 sm:px-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <SettingField
                label="Blitz"
                hint="5 to 120 min"
                registration={register('blitzMinutes')}
                error={errors.blitzMinutes?.message}
                disabled={isBusy}
              />
              <SettingField
                label="Focus"
                hint="10 to 180 min"
                registration={register('focusMinutes')}
                error={errors.focusMinutes?.message}
                disabled={isBusy}
              />
              <SettingField
                label="Deep"
                hint="15 to 240 min"
                registration={register('deepMinutes')}
                error={errors.deepMinutes?.message}
                disabled={isBusy}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <SettingField
                label="Short break"
                hint="1 to 30 min"
                registration={register('shortBreakMinutes')}
                error={errors.shortBreakMinutes?.message}
                disabled={isBusy}
              />
              <SettingField
                label="Long break"
                hint="5 to 60 min"
                registration={register('longBreakMinutes')}
                error={errors.longBreakMinutes?.message}
                disabled={isBusy}
              />
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-slate-300">
              <span className="inline-flex items-center gap-1.5 font-semibold text-cyan-200">
                <Timer className="h-3.5 w-3.5" />
                Current preview
              </span>
              <p className="mt-1">
                Blitz {String(watch('blitzMinutes') || '-')}m · Focus{' '}
                {String(watch('focusMinutes') || '-')}m · Deep{' '}
                {String(watch('deepMinutes') || '-')}m · Short break{' '}
                {String(watch('shortBreakMinutes') || '-')}m · Long break{' '}
                {String(watch('longBreakMinutes') || '-')}m
              </p>
            </div>

            <Button
              onClick={onSave}
              disabled={isBusy}
              className="bg-violet-600 text-white hover:bg-violet-500"
            >
              <Save className="h-4 w-4" />
              Save settings
            </Button>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/[0.05] py-0 backdrop-blur-xl">
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

            <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-300">
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
                onClick={onSpotifyConnect}
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
                onClick={onSpotifyDisconnect}
                disabled={
                  spotifyState.isLoading ||
                  spotifyState.isDisconnecting ||
                  !spotifyState.connected
                }
                className="border-white/20 bg-white/[0.02] text-slate-200 hover:bg-white/[0.06]"
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
      </div>
    </div>
  )
}

type SpotifyStatusResponse = {
  connected: boolean
  profile?: {
    id: string
    displayName: string
    email?: string
    product?: string
  }
}

type SpotifyStatus = {
  connected: boolean
  isLoading: boolean
  isDisconnecting?: boolean
  profile?: SpotifyStatusResponse['profile']
}

function SettingField({
  label,
  hint,
  registration,
  error,
  disabled,
}: {
  label: string
  hint: string
  registration: UseFormRegisterReturn
  error?: string
  disabled?: boolean
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-semibold text-white">
        {label} minutes
      </label>
      <Input
        type="number"
        inputMode="numeric"
        placeholder={hint}
        {...registration}
        disabled={disabled}
        className="border-white/15 bg-white/5 text-white placeholder:text-slate-500"
      />
      <p className={error ? 'text-xs text-rose-300' : 'text-xs text-slate-400'}>
        {error ?? hint}
      </p>
    </div>
  )
}
