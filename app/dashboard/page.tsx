'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  CheckCircle2,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  RotateCcw,
  Timer,
  Zap,
} from 'lucide-react'
import { AppHeader } from '@/components/app-header'
import { ConfirmActionDialog } from '@/components/confirm-action-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  useTimer,
  type BreakLength,
  type TimerMode as Mode,
} from '@/app/providers/timer-provider'
import { useCompleteSession } from '@/hooks/use-sessions'
import { useSubjects } from '@/hooks/use-subjects'
import { useSubjectTopics, useUpdateTopic } from '@/hooks/use-topics'
import { useUser } from '@/hooks/use-user'
import { TOPIC_STATUS_LABEL } from '@/lib/topic-status'

const MODE_META: Record<
  Mode,
  { label: string; xp: number; color: string; subtitle: (minutes: number) => string }
> = {
  blitz: {
    label: 'Blitz',
    xp: 10,
    color: '#f59e0b',
    subtitle: (minutes) => `${minutes} min sprint`,
  },
  focus: {
    label: 'Focus',
    xp: 25,
    color: '#7c3aed',
    subtitle: (minutes) => `${minutes} min session`,
  },
  deep: {
    label: 'Deep',
    xp: 50,
    color: '#06b6d4',
    subtitle: (minutes) => `${minutes} min block`,
  },
}

const DEFAULT_TIMER_MINUTES = {
  blitz: 10,
  focus: 25,
  deep: 50,
} as const

const BREAK_SECONDS: Record<BreakLength, Record<Mode, number>> = {
  short: {
    blitz: 2 * 60,
    focus: 5 * 60,
    deep: 10 * 60,
  },
  long: {
    blitz: 5 * 60,
    focus: 10 * 60,
    deep: 15 * 60,
  },
}

function pad(value: number) {
  return String(value).padStart(2, '0')
}

function formatClock(seconds: number) {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${pad(mins)}:${pad(secs)}`
}

function getLevel(totalXP: number) {
  return Math.floor(Math.sqrt(totalXP / 100)) + 1
}

export default function DashboardPage() {
  const { data: user } = useUser()
  const { data: subjects = [] } = useSubjects()
  const completeSession = useCompleteSession()
  const updateTopic = useUpdateTopic()
  const timer = useTimer()

  const [isFocusMode, setIsFocusMode] = useState(false)
  const [pageMessage, setPageMessage] = useState('')

  const {
    activeSubjectId,
    selectedTopicId,
    mode,
    breakLength,
    phase,
    rating,
    running,
    finished,
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
    setMoveDonePromptOpen,
    setRemaining,
    setHasStarted,
  } = timer
  const pendingReview = phase === 'focus' && finished

  const modeConfig = useMemo(
    () => ({
      blitz: {
        ...MODE_META.blitz,
        minutes: user?.blitzMinutes ?? DEFAULT_TIMER_MINUTES.blitz,
        seconds: (user?.blitzMinutes ?? DEFAULT_TIMER_MINUTES.blitz) * 60,
      },
      focus: {
        ...MODE_META.focus,
        minutes: user?.focusMinutes ?? DEFAULT_TIMER_MINUTES.focus,
        seconds: (user?.focusMinutes ?? DEFAULT_TIMER_MINUTES.focus) * 60,
      },
      deep: {
        ...MODE_META.deep,
        minutes: user?.deepMinutes ?? DEFAULT_TIMER_MINUTES.deep,
        seconds: (user?.deepMinutes ?? DEFAULT_TIMER_MINUTES.deep) * 60,
      },
    }),
    [user?.blitzMinutes, user?.focusMinutes, user?.deepMinutes]
  )

  const activeMode = modeConfig[mode]
  const totalSeconds =
    phase === 'focus' ? activeMode.seconds : BREAK_SECONDS[breakLength][mode]

  const resolvedSubjectId = useMemo(() => {
    if (!subjects.length) return ''
    if (subjects.some((subject) => subject.id === activeSubjectId)) {
      return activeSubjectId
    }
    return subjects[0].id
  }, [subjects, activeSubjectId])

  const { data: activeSubject } = useSubjectTopics(resolvedSubjectId)
  const topics = useMemo(() => activeSubject?.topics ?? [], [activeSubject?.topics])

  const resolvedTopicId = useMemo(() => {
    if (!topics.length) return ''
    if (topics.some((topic) => topic.id === selectedTopicId)) {
      return selectedTopicId
    }
    return topics[0].id
  }, [topics, selectedTopicId])

  const currentTopic = topics.find((topic) => topic.id === resolvedTopicId)

  useEffect(() => {
    if (!isFocusMode) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsFocusMode(false)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      window.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [isFocusMode])

  const timerRemaining =
    !hasStarted && !running && !finished ? totalSeconds : Math.max(0, remaining)
  const progress = totalSeconds ? 1 - timerRemaining / totalSeconds : 0

  const onChangeMode = (nextMode: Mode) => {
    if (running || pendingReview) return

    const nextTotal =
      phase === 'focus'
        ? modeConfig[nextMode].seconds
        : BREAK_SECONDS[breakLength][nextMode]
    setMode(nextMode)
    setFinished(false)
    setHasStarted(false)
    setRemaining(nextTotal)
  }

  const onResetTimer = () => {
    setRunning(false)
    setFinished(false)
    setHasStarted(false)
    setPageMessage('')
    setRemaining(totalSeconds)
  }

  const onPlayPause = () => {
    if (pendingReview) return

    if (phase === 'focus' && !resolvedTopicId) {
      setPageMessage('Create a topic before starting a session.')
      return
    }

    if (finished && phase === 'break') {
      setPhase('focus')
      setFinished(false)
      setHasStarted(false)
      setRemaining(activeMode.seconds)
      setPageMessage('Break complete. You are ready for the next focus block.')
      return
    }

    if (finished) return

    if (!running && !hasStarted) {
      setRemaining(totalSeconds)
      setHasStarted(true)
    }

    if (phase === 'focus' && !running && resolvedSubjectId && resolvedTopicId) {
      updateTopic.mutate({
        subjectId: resolvedSubjectId,
        topicId: resolvedTopicId,
        payload: { status: 'IN_PROGRESS' },
      })
    }

    setRunning((prev) => !prev)
  }

  const onSaveSession = () => {
    if (!resolvedTopicId) {
      setPageMessage('No topic selected for this session.')
      return
    }

    completeSession.mutate(
      {
        topicId: resolvedTopicId,
        mode,
        duration: activeMode.seconds,
        xpEarned: activeMode.xp,
        rating,
      },
      {
        onSuccess: () => {
          setFinished(false)
          setPhase('break')
          setRemaining(BREAK_SECONDS[breakLength][mode])
          setHasStarted(false)
          setPageMessage(`Session saved: +${activeMode.xp} XP. Break is ready.`)

          if (resolvedSubjectId) setMoveDonePromptOpen(true)
        },
        onError: () => {
          setPageMessage('Unable to save your session. Try again.')
        },
      }
    )
  }

  const onSkipBreak = () => {
    if (running) return
    setPhase('focus')
    setFinished(false)
    setHasStarted(false)
    setPageMessage('')
    setRemaining(activeMode.seconds)
  }

  const onMoveTopicDone = () => {
    if (!resolvedSubjectId || !resolvedTopicId) return
    updateTopic.mutate(
      {
        subjectId: resolvedSubjectId,
        topicId: resolvedTopicId,
        payload: { status: 'DONE' },
      },
      {
        onSuccess: () => {
          setPageMessage('Topic moved to Done.')
          setMoveDonePromptOpen(false)
        },
        onError: () => {
          setPageMessage('Could not update topic status.')
          setMoveDonePromptOpen(false)
        },
      }
    )
  }

  return (
    <>
      <div className="relative min-h-screen overflow-hidden bg-[#070b16] text-slate-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-[-120px] right-[-120px] h-[380px] w-[380px] rounded-full bg-cyan-500/10 blur-[130px]" />
        <div className="absolute bottom-[-120px] left-[-120px] h-[360px] w-[360px] rounded-full bg-violet-600/14 blur-[130px]" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-10">
        <AppHeader />

        <section className="space-y-2">
          <p className="text-xs font-semibold tracking-[0.18em] text-cyan-300 uppercase">Focus first</p>
          <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
            {phase === 'focus' ? 'Run your Pomodoro' : 'Take a break'}
          </h1>
          <p className="text-sm text-slate-400">
            Level {getLevel(user?.totalXP ?? 0)} · {user?.totalXP ?? 0} XP · {user?.streak ?? 0} day streak
          </p>
        </section>

        {!!pageMessage && (
          <section className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-slate-300">
            {pageMessage}
          </section>
        )}

        <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              {(Object.keys(modeConfig) as Mode[]).map((entryMode) => {
                const option = modeConfig[entryMode]
                const active = mode === entryMode

                return (
                  <button
                    key={entryMode}
                    onClick={() => onChangeMode(entryMode)}
                    className="rounded-xl border px-3 py-2 text-left transition-all"
                    style={
                      active
                        ? {
                            borderColor: `${option.color}70`,
                            background: `${option.color}22`,
                            boxShadow: `0 0 20px ${option.color}30`,
                          }
                        : {
                            borderColor: 'rgba(255,255,255,0.14)',
                            background: 'rgba(255,255,255,0.03)',
                          }
                    }
                    disabled={running || pendingReview}
                  >
                    <p className="text-sm leading-tight font-semibold text-white">{option.label}</p>
                    <p className="text-[11px] text-slate-400">{option.subtitle(option.minutes)}</p>
                  </button>
                )
              })}
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden items-center gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-1 sm:flex">
                <button
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    breakLength === 'short'
                      ? 'bg-white/12 text-white'
                      : 'text-slate-300 hover:bg-white/8'
                  }`}
                  onClick={() => setBreakLength('short')}
                  disabled={running || pendingReview}
                >
                  Short breaks
                </button>
                <button
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    breakLength === 'long'
                      ? 'bg-white/12 text-white'
                      : 'text-slate-300 hover:bg-white/8'
                  }`}
                  onClick={() => setBreakLength('long')}
                  disabled={running || pendingReview}
                >
                  Long breaks
                </button>
              </div>
              <Button
                variant="outline"
                className="h-10 border-white/15 bg-white/5 text-slate-200 hover:bg-white/10"
                onClick={() => setIsFocusMode(true)}
              >
                <Maximize2 className="h-4 w-4" />
                Focus mode
              </Button>
              <Link href="/stats">
                <Button
                  variant="outline"
                  className="h-10 border-white/15 bg-white/5 text-slate-200 hover:bg-white/10"
                >
                  View stats
                </Button>
              </Link>
            </div>
          </div>

          <div className="mb-5 grid gap-3 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-semibold tracking-wide text-slate-400 uppercase">
                Subject
              </label>
              <select
                value={resolvedSubjectId}
                onChange={(event) => setActiveSubjectId(event.target.value)}
                className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white outline-none transition focus:border-violet-400/50"
                disabled={!subjects.length || phase === 'break'}
              >
                {!subjects.length ? (
                  <option value="">No subjects yet</option>
                ) : (
                  subjects.map((subject) => (
                    <option
                      key={subject.id}
                      value={subject.id}
                      className="bg-slate-900 text-white"
                    >
                      {subject.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold tracking-wide text-slate-400 uppercase">
                Topic
              </label>
              <select
                value={resolvedTopicId}
                onChange={(event) => setSelectedTopicId(event.target.value)}
                className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white outline-none transition focus:border-violet-400/50"
                disabled={!topics.length || phase === 'break'}
              >
                {!topics.length ? (
                  <option value="">No topics yet</option>
                ) : (
                  topics.map((topic) => (
                    <option
                      key={topic.id}
                      value={topic.id}
                      className="bg-slate-900 text-white"
                    >
                      {topic.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold tracking-wide text-slate-400 uppercase">
                Status
              </label>
              <div className="flex h-10 items-center rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-slate-200">
                {phase === 'break'
                  ? 'Break'
                  : currentTopic
                    ? TOPIC_STATUS_LABEL[currentTopic.status]
                    : 'No topic selected'}
              </div>
            </div>
          </div>

          <div className="mb-5 flex items-center gap-2 sm:hidden">
            <button
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                breakLength === 'short'
                  ? 'border-white/20 bg-white/12 text-white'
                  : 'border-white/10 bg-white/5 text-slate-300'
              }`}
              onClick={() => setBreakLength('short')}
              disabled={running || pendingReview}
            >
              Short breaks
            </button>
            <button
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                breakLength === 'long'
                  ? 'border-white/20 bg-white/12 text-white'
                  : 'border-white/10 bg-white/5 text-slate-300'
              }`}
              onClick={() => setBreakLength('long')}
              disabled={running || pendingReview}
            >
              Long breaks
            </button>
          </div>

          <div className="flex flex-col items-center gap-6 py-2 sm:py-4">
            <PomodoroRing
              color={phase === 'focus' ? activeMode.color : '#22c55e'}
              finished={finished}
              progress={progress}
              remaining={timerRemaining}
            />

            <div className="flex flex-wrap items-center justify-center gap-2">
              <Badge className="border border-white/10 bg-white/[0.04] text-slate-300">
                {phase === 'focus'
                  ? `${activeMode.label} session`
                  : `${Math.round(BREAK_SECONDS[breakLength][mode] / 60)} min ${breakLength} break`}
              </Badge>
              <Badge className="bg-violet-500/20 text-violet-200">+{activeMode.xp} XP focus reward</Badge>
            </div>

            {!pendingReview ? (
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Button
                  variant="outline"
                  className="h-11 border-white/15 bg-white/5 text-slate-200 hover:bg-white/10"
                  onClick={onResetTimer}
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset
                </Button>

                {phase === 'break' && (
                  <Button
                    variant="outline"
                    className="h-11 border-white/15 bg-white/5 text-slate-200 hover:bg-white/10"
                    onClick={onSkipBreak}
                  >
                    Skip break
                  </Button>
                )}

                <Button
                  className="h-11 font-bold text-white"
                  onClick={onPlayPause}
                  disabled={completeSession.isPending || (phase === 'focus' && !resolvedTopicId)}
                  style={{
                    backgroundColor: phase === 'focus' ? activeMode.color : '#22c55e',
                    boxShadow: `0 0 28px ${phase === 'focus' ? activeMode.color : '#22c55e'}58`,
                  }}
                >
                  {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  {running
                    ? 'Pause'
                    : finished
                      ? 'Done'
                      : timerRemaining === totalSeconds
                        ? phase === 'focus'
                          ? 'Start session'
                          : 'Start break'
                        : 'Resume'}
                </Button>
              </div>
            ) : (
              <div className="w-full max-w-xl rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-center text-sm font-semibold text-white">How was that session?</p>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {[1, 2, 3].map((score) => (
                    <button
                      key={score}
                      onClick={() => setRating(score)}
                      className={`rounded-lg border px-2 py-2 text-sm font-semibold transition ${
                        rating === score
                          ? 'border-violet-400/70 bg-violet-500/20 text-violet-100'
                          : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/20'
                      }`}
                    >
                      {score === 1 ? 'Hard' : score === 2 ? 'Okay' : 'Great'}
                    </button>
                  ))}
                </div>
                <div className="mt-3 flex flex-wrap justify-center gap-2">
                  <Button
                    onClick={onSaveSession}
                    disabled={completeSession.isPending}
                    className="bg-violet-600 text-white hover:bg-violet-500"
                  >
                    <Zap className="h-4 w-4" />
                    Save session
                  </Button>
                  <Button
                    variant="outline"
                    onClick={onResetTimer}
                    className="border-white/15 bg-white/5 text-slate-200 hover:bg-white/10"
                  >
                    Discard
                  </Button>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs text-slate-300">
          <span className="inline-flex items-center gap-1.5">
            <Timer className="h-3.5 w-3.5 text-cyan-300" />
            Dashboard is timer-first. Detailed cards are now in Stats.
          </span>
          <Link href="/subjects" className="text-cyan-300 transition hover:text-cyan-200">
            Manage subjects and topics
          </Link>
        </section>
      </div>

      <AnimatePresence>
        {isFocusMode && (
          <motion.div
            className="fixed inset-0 z-50 bg-[#040812]/86 backdrop-blur-2xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute inset-0 bg-[#030712]/55" />
              <div className="absolute top-[-140px] left-1/2 h-[440px] w-[440px] -translate-x-1/2 rounded-full bg-violet-600/16 blur-[130px]" />
              <div className="absolute bottom-[-160px] right-[-120px] h-[420px] w-[420px] rounded-full bg-cyan-500/12 blur-[130px]" />
            </div>

            <div className="relative z-10 flex h-full flex-col px-4 py-6 sm:px-6 lg:px-10">
              <div className="mb-8 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold tracking-[0.18em] text-cyan-300 uppercase">Focus mode</p>
                  <p className="mt-1 text-sm text-slate-300">
                    {phase === 'focus' ? activeMode.label : 'Break'} · {running ? 'In progress' : 'Ready'}
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="border-white/15 bg-white/5 text-slate-100 hover:bg-white/10"
                  onClick={() => setIsFocusMode(false)}
                >
                  <Minimize2 className="h-4 w-4" />
                  Exit
                </Button>
              </div>

              <div className="flex flex-1 flex-col items-center justify-center gap-8">
                <PomodoroRing
                  color={phase === 'focus' ? activeMode.color : '#22c55e'}
                  finished={finished}
                  progress={progress}
                  remaining={timerRemaining}
                  large
                />

                {!pendingReview ? (
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <Button
                      variant="outline"
                      className="h-11 border-white/15 bg-white/5 text-slate-200 hover:bg-white/10"
                      onClick={onResetTimer}
                    >
                      <RotateCcw className="h-4 w-4" />
                      Reset
                    </Button>
                    {phase === 'break' && (
                      <Button
                        variant="outline"
                        className="h-11 border-white/15 bg-white/5 text-slate-200 hover:bg-white/10"
                        onClick={onSkipBreak}
                      >
                        Skip break
                      </Button>
                    )}
                    <Button
                      className="h-11 font-bold text-white"
                      onClick={onPlayPause}
                      disabled={completeSession.isPending || (phase === 'focus' && !resolvedTopicId)}
                      style={{
                        backgroundColor: phase === 'focus' ? activeMode.color : '#22c55e',
                        boxShadow: `0 0 30px ${phase === 'focus' ? activeMode.color : '#22c55e'}5f`,
                      }}
                    >
                      {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      {running ? 'Pause' : timerRemaining === totalSeconds ? 'Start' : 'Resume'}
                    </Button>
                  </div>
                ) : (
                  <div className="w-full max-w-xl rounded-xl border border-white/10 bg-white/[0.04] p-4">
                    <p className="text-center text-sm font-semibold text-white">How was that session?</p>
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      {[1, 2, 3].map((score) => (
                        <button
                          key={score}
                          onClick={() => setRating(score)}
                          className={`rounded-lg border px-2 py-2 text-sm font-semibold transition ${
                            rating === score
                              ? 'border-violet-400/70 bg-violet-500/20 text-violet-100'
                              : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/20'
                          }`}
                        >
                          {score === 1 ? 'Hard' : score === 2 ? 'Okay' : 'Great'}
                        </button>
                      ))}
                    </div>
                    <div className="mt-3 flex justify-center gap-2">
                      <Button
                        onClick={onSaveSession}
                        disabled={completeSession.isPending}
                        className="bg-violet-600 text-white hover:bg-violet-500"
                      >
                        <Zap className="h-4 w-4" />
                        Save session
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>

      <ConfirmActionDialog
        open={moveDonePromptOpen}
        title="Move topic to Done?"
        description="Session is saved. Do you want to move this topic to Done now?"
        confirmLabel="Move to Done"
        confirmVariant="default"
        pending={updateTopic.isPending}
        onOpenChange={setMoveDonePromptOpen}
        onConfirm={onMoveTopicDone}
      />
    </>
  )
}

function PomodoroRing({
  color,
  finished,
  progress,
  remaining,
  large = false,
}: {
  color: string
  finished: boolean
  progress: number
  remaining: number
  large?: boolean
}) {
  const size = large ? 420 : 340
  const center = size / 2
  const radius = large ? 158 : 126
  const circumference = 2 * Math.PI * radius
  const strokeWidth = large ? 12 : 10

  return (
    <div className="relative flex items-center justify-center">
      <motion.div
        className={`absolute rounded-full ${large ? 'h-[320px] w-[320px] blur-[95px]' : 'h-[240px] w-[240px] blur-[78px]'}`}
        style={{ background: `${color}2a` }}
        animate={finished ? { opacity: 0.4, scale: 1 } : { opacity: [0.42, 0.8, 0.42], scale: [1, 1.09, 1] }}
        transition={{ duration: 2.8, repeat: Infinity }}
      />

      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - progress)}
          style={{ filter: `drop-shadow(0 0 18px ${color}a6)` }}
        />
      </svg>

      <div className="absolute text-center">
        {finished ? (
          <div className="flex flex-col items-center gap-2">
            <CheckCircle2 className="h-12 w-12 text-emerald-400" />
            <p className="text-sm font-bold text-emerald-300">Complete</p>
          </div>
        ) : (
          <>
            <p className={`font-mono font-black tracking-tight text-white ${large ? 'text-8xl' : 'text-6xl sm:text-7xl'}`}>
              {formatClock(remaining)}
            </p>
            <p className="mt-1 text-xs tracking-[0.2em] text-slate-500 uppercase">remaining</p>
          </>
        )}
      </div>
    </div>
  )
}
