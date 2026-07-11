'use client'

import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AppHeader } from '@/components/app-header'
import { TimerSettingsForm } from '@/components/settings/timer-settings-form'
import {
  SpotifyConnectionCard,
  type SpotifyStatus,
  type SpotifyStatusResponse,
} from '@/components/settings/spotify-connection-card'
import { useUpdateUser, useUser } from '@/hooks/use-user'
import {
  TimerSettingsFormSchema,
  type TimerSettingsFormInput,
  type TimerSettingsFormValues,
} from '@/lib/schemas/user'

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
  } = useForm<TimerSettingsFormInput, unknown, TimerSettingsFormValues>({
    resolver: zodResolver(TimerSettingsFormSchema),
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

        <TimerSettingsForm
          register={register}
          errors={errors}
          watch={watch}
          isBusy={isBusy}
          onSave={onSave}
        />

        <SpotifyConnectionCard
          spotifyState={spotifyState}
          onConnect={onSpotifyConnect}
          onDisconnect={onSpotifyDisconnect}
        />
      </div>
    </div>
  )
}
