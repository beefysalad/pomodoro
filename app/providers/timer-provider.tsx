'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@clerk/nextjs'

export type TimerMode = 'blitz' | 'focus' | 'deep'
export type TimerPhase = 'focus' | 'break'
export type BreakLength = 'short' | 'long'

type TimerContextValue = {
  activeSubjectId: string
  selectedTopicId: string
  mode: TimerMode
  breakLength: BreakLength
  phase: TimerPhase
  rating: number
  running: boolean
  finished: boolean
  pendingReview: boolean
  moveDonePromptOpen: boolean
  remaining: number
  hasStarted: boolean
  setActiveSubjectId: (value: string) => void
  setSelectedTopicId: (value: string) => void
  setMode: (value: TimerMode) => void
  setBreakLength: (value: BreakLength) => void
  setPhase: (value: TimerPhase) => void
  setRating: (value: number) => void
  setRunning: (value: boolean | ((prev: boolean) => boolean)) => void
  setFinished: (value: boolean) => void
  setPendingReview: (value: boolean) => void
  setMoveDonePromptOpen: (value: boolean) => void
  setRemaining: (value: number | ((prev: number) => number)) => void
  setHasStarted: (value: boolean) => void
}

type StoredTimerState = Pick<
  TimerContextValue,
  | 'activeSubjectId'
  | 'selectedTopicId'
  | 'mode'
  | 'breakLength'
  | 'phase'
  | 'rating'
  | 'running'
  | 'finished'
  | 'pendingReview'
  | 'moveDonePromptOpen'
  | 'remaining'
  | 'hasStarted'
>

const STORAGE_KEY_PREFIX = 'tempo.timer.state.v1'
const DEFAULT_FOCUS_SECONDS = 25 * 60

const TimerContext = createContext<TimerContextValue | null>(null)

function getDefaultState(): StoredTimerState {
  return {
    activeSubjectId: '',
    selectedTopicId: '',
    mode: 'focus',
    breakLength: 'short',
    phase: 'focus',
    rating: 2,
    running: false,
    finished: false,
    pendingReview: false,
    moveDonePromptOpen: false,
    remaining: DEFAULT_FOCUS_SECONDS,
    hasStarted: false,
  }
}

export function TimerProvider({ children }: { children: React.ReactNode }) {
  const { userId, isLoaded } = useAuth()
  const [activeSubjectId, setActiveSubjectId] = useState('')
  const [selectedTopicId, setSelectedTopicId] = useState('')
  const [mode, setMode] = useState<TimerMode>('focus')
  const [breakLength, setBreakLength] = useState<BreakLength>('short')
  const [phase, setPhase] = useState<TimerPhase>('focus')
  const [rating, setRating] = useState(2)
  const [running, setRunning] = useState(false)
  const [finished, setFinished] = useState(false)
  const [pendingReview, setPendingReview] = useState(false)
  const [moveDonePromptOpen, setMoveDonePromptOpen] = useState(false)
  const [remaining, setRemaining] = useState(DEFAULT_FOCUS_SECONDS)
  const [hasStarted, setHasStarted] = useState(false)
  const [hydrated, setHydrated] = useState(false)
  const storageKey = userId ? `${STORAGE_KEY_PREFIX}:${userId}` : null

  useEffect(() => {
    if (!isLoaded) return
    if (typeof window === 'undefined') return

    const resetToDefaults = () => {
      const fallback = getDefaultState()
      setActiveSubjectId(fallback.activeSubjectId)
      setSelectedTopicId(fallback.selectedTopicId)
      setMode(fallback.mode)
      setBreakLength(fallback.breakLength)
      setPhase(fallback.phase)
      setRating(fallback.rating)
      setRunning(fallback.running)
      setFinished(fallback.finished)
      setPendingReview(fallback.pendingReview)
      setMoveDonePromptOpen(fallback.moveDonePromptOpen)
      setRemaining(fallback.remaining)
      setHasStarted(fallback.hasStarted)
    }

    if (!storageKey) {
      resetToDefaults()
      setHydrated(true)
      return
    }

    try {
      const raw = window.localStorage.getItem(storageKey)
      if (!raw) {
        resetToDefaults()
        setHydrated(true)
        return
      }

      const parsed = JSON.parse(raw) as {
        state: StoredTimerState
        savedAt: number
      }

      const base = getDefaultState()
      const restored = { ...base, ...parsed.state }
      if (restored.running) {
        const elapsed = Math.max(0, Math.floor((Date.now() - parsed.savedAt) / 1000))
        restored.remaining = Math.max(0, restored.remaining - elapsed)
        if (restored.remaining === 0) {
          restored.running = false
          restored.finished = true
          restored.hasStarted = false
        }
      }

      setActiveSubjectId(restored.activeSubjectId)
      setSelectedTopicId(restored.selectedTopicId)
      setMode(restored.mode)
      setBreakLength(restored.breakLength)
      setPhase(restored.phase)
      setRating(restored.rating)
      setRunning(restored.running)
      setFinished(restored.finished)
      setPendingReview(restored.pendingReview)
      setMoveDonePromptOpen(restored.moveDonePromptOpen)
      setRemaining(restored.remaining)
      setHasStarted(restored.hasStarted)
    } catch {
      resetToDefaults()
    } finally {
      setHydrated(true)
    }
  }, [isLoaded, storageKey])

  useEffect(() => {
    if (!hydrated) return
    if (!isLoaded) return
    if (typeof window === 'undefined') return
    if (!storageKey) return

    const state: StoredTimerState = {
      activeSubjectId,
      selectedTopicId,
      mode,
      breakLength,
      phase,
      rating,
      running,
      finished,
      pendingReview,
      moveDonePromptOpen,
      remaining,
      hasStarted,
    }

    window.localStorage.setItem(storageKey, JSON.stringify({ state, savedAt: Date.now() }))
  }, [
    hydrated,
    isLoaded,
    storageKey,
    activeSubjectId,
    selectedTopicId,
    mode,
    breakLength,
    phase,
    rating,
    running,
    finished,
    pendingReview,
    moveDonePromptOpen,
    remaining,
    hasStarted,
  ])

  useEffect(() => {
    if (!running) return
    const interval = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          setRunning(false)
          setFinished(true)
          setHasStarted(false)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [running])

  const value = useMemo<TimerContextValue>(
    () => ({
      activeSubjectId,
      selectedTopicId,
      mode,
      breakLength,
      phase,
      rating,
      running,
      finished,
      pendingReview,
      moveDonePromptOpen,
      remaining,
      hasStarted,
      setActiveSubjectId,
      setSelectedTopicId,
      setMode,
      setBreakLength,
      setPhase,
      setRating,
      setRunning,
      setFinished,
      setPendingReview,
      setMoveDonePromptOpen,
      setRemaining,
      setHasStarted,
    }),
    [
      activeSubjectId,
      selectedTopicId,
      mode,
      breakLength,
      phase,
      rating,
      running,
      finished,
      pendingReview,
      moveDonePromptOpen,
      remaining,
      hasStarted,
    ]
  )

  return <TimerContext.Provider value={value}>{children}</TimerContext.Provider>
}

export function useTimer() {
  const context = useContext(TimerContext)
  if (!context) {
    throw new Error('useTimer must be used inside <TimerProvider>.')
  }
  return context
}
