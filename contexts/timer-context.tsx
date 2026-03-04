'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import type { Topic } from '@/app/generated/prisma/client'

export type TimerMode = 'blitz' | 'focus' | 'deep'

export const MODE_SECONDS: Record<TimerMode, number> = {
  blitz: 10 * 60,
  focus: 25 * 60,
  deep: 50 * 60,
}

export const MODE_XP: Record<TimerMode, number> = {
  blitz: 10,
  focus: 25,
  deep: 50,
}

interface TimerState {
  topic: Topic | null
  mode: TimerMode
  totalSeconds: number
  remaining: number
  running: boolean
  phase: 'idle' | 'timer' | 'rating'
  elapsed: number
}

interface TimerContextValue extends TimerState {
  start: (topic: Topic, mode: TimerMode) => void
  pause: () => void
  resume: () => void
  stop: () => void // end early → go to rating if elapsed > 0
  dismiss: () => void // close after rating saved
}

const TimerContext = createContext<TimerContextValue | null>(null)

export function TimerProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<TimerState>({
    topic: null,
    mode: 'focus',
    totalSeconds: MODE_SECONDS.focus,
    remaining: MODE_SECONDS.focus,
    running: false,
    phase: 'idle',
    elapsed: 0,
  })

  // Keep a stable ref for the elapsed counter so the interval doesn't stale-close
  const elapsedRef = useRef(0)

  // ── Tick ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!state.running || state.phase !== 'timer') return

    const id = setInterval(() => {
      elapsedRef.current += 1
      setState((prev) => {
        if (prev.remaining <= 1) {
          clearInterval(id)
          return {
            ...prev,
            remaining: 0,
            running: false,
            phase: 'rating',
            elapsed: elapsedRef.current,
          }
        }
        return {
          ...prev,
          remaining: prev.remaining - 1,
          elapsed: elapsedRef.current,
        }
      })
    }, 1000)

    return () => clearInterval(id)
  }, [state.running, state.phase])

  // ── Actions ────────────────────────────────────────────────────────────────
  const start = useCallback((topic: Topic, mode: TimerMode) => {
    elapsedRef.current = 0
    setState({
      topic,
      mode,
      totalSeconds: MODE_SECONDS[mode],
      remaining: MODE_SECONDS[mode],
      running: true,
      phase: 'timer',
      elapsed: 0,
    })
  }, [])

  const pause = useCallback(
    () => setState((s) => ({ ...s, running: false })),
    []
  )

  const resume = useCallback(
    () => setState((s) => (s.phase === 'timer' ? { ...s, running: true } : s)),
    []
  )

  const stop = useCallback(() => {
    setState((s) => ({
      ...s,
      running: false,
      phase: elapsedRef.current > 0 ? 'rating' : 'idle',
      elapsed: elapsedRef.current,
    }))
  }, [])

  const dismiss = useCallback(() => {
    elapsedRef.current = 0
    setState({
      topic: null,
      mode: 'focus',
      totalSeconds: MODE_SECONDS.focus,
      remaining: MODE_SECONDS.focus,
      running: false,
      phase: 'idle',
      elapsed: 0,
    })
  }, [])

  return (
    <TimerContext.Provider
      value={{ ...state, start, pause, resume, stop, dismiss }}
    >
      {children}
    </TimerContext.Provider>
  )
}

export function useTimer(): TimerContextValue {
  const ctx = useContext(TimerContext)
  if (!ctx) throw new Error('useTimer must be used inside <TimerProvider>')
  return ctx
}
