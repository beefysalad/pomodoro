'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Flame, Maximize2 } from 'lucide-react'
import { AppHeader } from '@/components/app-header'
import { ConfirmActionDialog } from '@/components/confirm-action-dialog'
import { FocusModeOverlay } from '@/components/dashboard/focus-mode-overlay'
import { ModeSelector } from '@/components/dashboard/mode-selector'
import { SessionRatingPanel } from '@/components/dashboard/session-rating-panel'
import { TimerControls } from '@/components/dashboard/timer-controls'
import { PomodoroDial } from '@/components/timer/pomodoro-dial'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  useTimer,
  type TimerMode as Mode,
} from '@/app/providers/timer-provider'
import { getLevelFromXp } from '@/lib/progression'
import { BREAK_MODE_COLOR, TIMER_MODES } from '@/lib/timer-modes'
import { useCompleteSession } from '@/hooks/use-sessions'
import { useSubjects } from '@/hooks/use-subjects'
import { useSubjectTopics, useUpdateTopic } from '@/hooks/use-topics'
import { useUser } from '@/hooks/use-user'
import { useQuote } from '@/hooks/use-quote'
import { TOPIC_STATUS_LABEL } from '@/lib/topic-status'

const DEFAULT_BREAK_MINUTES = {
  shortBreak: 5,
  longBreak: 10,
} as const

const BREAK_SECONDS = (
  shortBreakMinutes: number,
  longBreakMinutes: number
) => ({
  short: shortBreakMinutes * 60,
  long: longBreakMinutes * 60,
})

const DEV_TIMER_MINUTES = {
  blitz: 0.25,
  focus: 0.5,
  deep: 1,
  shortBreak: 0.1,
  longBreak: 0.2,
} as const

export default function DashboardPage() {
  const [devTimerFlag] = useState(() =>
    typeof window !== 'undefined' ? window.location.search : ''
  )
  const { data: user } = useUser()
  const { data: subjects = [] } = useSubjects()
  const { data: quote } = useQuote()
  const completeSession = useCompleteSession()
  const updateTopic = useUpdateTopic()
  const timer = useTimer()

  const [isFocusMode, setIsFocusMode] = useState(false)
  const [pageMessage, setPageMessage] = useState('')

  const isDevTimer = devTimerFlag.includes('devTimer=1')

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
  const forceCompletionFocus = finished

  const modeConfig = useMemo(() => {
    const buildEntry = (m: Mode, minutes: number) => ({
      label: TIMER_MODES[m].label,
      xp: TIMER_MODES[m].xp,
      color: TIMER_MODES[m].color,
      subtitle: TIMER_MODES[m].describeDuration,
      minutes,
      seconds: Math.round(minutes * 60),
    })

    if (isDevTimer) {
      return {
        blitz: buildEntry('blitz', DEV_TIMER_MINUTES.blitz),
        focus: buildEntry('focus', DEV_TIMER_MINUTES.focus),
        deep: buildEntry('deep', DEV_TIMER_MINUTES.deep),
      }
    }

    return {
      blitz: buildEntry(
        'blitz',
        user?.blitzMinutes ?? TIMER_MODES.blitz.defaultMinutes
      ),
      focus: buildEntry(
        'focus',
        user?.focusMinutes ?? TIMER_MODES.focus.defaultMinutes
      ),
      deep: buildEntry(
        'deep',
        user?.deepMinutes ?? TIMER_MODES.deep.defaultMinutes
      ),
    }
  }, [isDevTimer, user?.blitzMinutes, user?.focusMinutes, user?.deepMinutes])

  const activeMode = modeConfig[mode]
  const breakSeconds = isDevTimer
    ? BREAK_SECONDS(DEV_TIMER_MINUTES.shortBreak, DEV_TIMER_MINUTES.longBreak)
    : BREAK_SECONDS(
        user?.shortBreakMinutes ?? DEFAULT_BREAK_MINUTES.shortBreak,
        user?.longBreakMinutes ?? DEFAULT_BREAK_MINUTES.longBreak
      )
  const totalSeconds =
    phase === 'focus' ? activeMode.seconds : breakSeconds[breakLength]

  const resolvedSubjectId = useMemo(() => {
    if (!subjects.length) return ''
    if (subjects.some((subject) => subject.id === activeSubjectId)) {
      return activeSubjectId
    }
    return subjects[0].id
  }, [subjects, activeSubjectId])

  const { data: activeSubject } = useSubjectTopics(resolvedSubjectId)
  const topics = useMemo(
    () => activeSubject?.topics ?? [],
    [activeSubject?.topics]
  )

  const resolvedTopicId = useMemo(() => {
    if (!topics.length) return ''
    if (topics.some((topic) => topic.id === selectedTopicId)) {
      return selectedTopicId
    }
    return topics[0].id
  }, [topics, selectedTopicId])

  const currentTopic = topics.find((topic) => topic.id === resolvedTopicId)
  const streak = user?.streak ?? 0

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
        : breakSeconds[breakLength]
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
        rating,
      },
      {
        onSuccess: (data) => {
          setFinished(false)
          setPhase('break')
          setRemaining(breakSeconds[breakLength])
          setHasStarted(false)
          const levelNote = data.progression.leveledUp
            ? ` Level up: ${data.progression.previousLevel} -> ${data.progression.newLevel}.`
            : ''
          setPageMessage(
            `Session saved: +${data.progression.xpAwarded} XP. Streak: ${data.progression.streak} day(s).${levelNote} Break is ready.`
          )

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
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-semibold tracking-[0.18em] text-cyan-300 uppercase">
                Focus first
              </p>
              <Badge className="border border-orange-300/40 bg-orange-500/20 text-orange-100">
                <Flame className="mr-1 h-3.5 w-3.5" />
                {streak} day{streak === 1 ? '' : 's'} streak
              </Badge>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
              {phase === 'focus' ? 'Run your Pomodoro' : 'Take a break'}
            </h1>
            <p className="text-sm text-slate-400">
              Level {getLevelFromXp(user?.totalXP ?? 0)} · {user?.totalXP ?? 0}{' '}
              XP
            </p>
          </section>

          {!!pageMessage && (
            <section className="bg-glass-soft rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-300">
              {pageMessage}
            </section>
          )}

          <AnimatePresence>
            {!running && (
              <motion.section
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="bg-glass-soft rounded-2xl border border-white/10 p-4 backdrop-blur-xl sm:p-6"
              >
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <ModeSelector
                    modeConfig={modeConfig}
                    mode={mode}
                    disabled={running || pendingReview}
                    onChangeMode={onChangeMode}
                  />

                  <div className="flex items-center gap-2">
                    <div className="bg-glass-subtle hidden items-center gap-1 rounded-xl border border-white/10 p-1 sm:flex">
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`h-auto rounded-lg px-3 py-1.5 text-xs font-semibold hover:text-inherit ${
                          breakLength === 'short'
                            ? 'bg-white/12 text-white hover:bg-white/12 dark:hover:bg-white/12'
                            : 'text-slate-300 hover:bg-white/8 dark:hover:bg-white/8'
                        }`}
                        onClick={() => setBreakLength('short')}
                        disabled={running || pendingReview}
                      >
                        Short breaks
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`h-auto rounded-lg px-3 py-1.5 text-xs font-semibold hover:text-inherit ${
                          breakLength === 'long'
                            ? 'bg-white/12 text-white hover:bg-white/12 dark:hover:bg-white/12'
                            : 'text-slate-300 hover:bg-white/8 dark:hover:bg-white/8'
                        }`}
                        onClick={() => setBreakLength('long')}
                        disabled={running || pendingReview}
                      >
                        Long breaks
                      </Button>
                    </div>
                    <Button
                      variant="outline"
                      className="h-10 border-white/15 bg-white/5 text-slate-200 hover:bg-white/10"
                      onClick={() => setIsFocusMode(true)}
                      id="tutorial-focus-button"
                    >
                      <Maximize2 className="h-4 w-4" />
                      Focus mode
                    </Button>
                    <Link href="/stats" id="tutorial-stats">
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
                    <Label className="mb-1 block text-xs font-semibold tracking-wide text-slate-400 uppercase">
                      Subject
                    </Label>
                    <select
                      value={resolvedSubjectId}
                      onChange={(event) =>
                        setActiveSubjectId(event.target.value)
                      }
                      className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white transition outline-none focus:border-violet-400/50"
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
                    <Label className="mb-1 block text-xs font-semibold tracking-wide text-slate-400 uppercase">
                      Topic
                    </Label>
                    <select
                      value={resolvedTopicId}
                      onChange={(event) =>
                        setSelectedTopicId(event.target.value)
                      }
                      className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white transition outline-none focus:border-violet-400/50"
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
                    <Label className="mb-1 block text-xs font-semibold tracking-wide text-slate-400 uppercase">
                      Status
                    </Label>
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
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`h-auto rounded-lg border px-3 py-1.5 text-xs font-semibold shadow-none hover:text-inherit ${
                      breakLength === 'short'
                        ? 'border-white/20 bg-white/12 text-white hover:bg-white/12 dark:border-white/20 dark:bg-white/12 dark:hover:bg-white/12'
                        : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/5 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/5'
                    }`}
                    onClick={() => setBreakLength('short')}
                    disabled={running || pendingReview}
                  >
                    Short breaks
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`h-auto rounded-lg border px-3 py-1.5 text-xs font-semibold shadow-none hover:text-inherit ${
                      breakLength === 'long'
                        ? 'border-white/20 bg-white/12 text-white hover:bg-white/12 dark:border-white/20 dark:bg-white/12 dark:hover:bg-white/12'
                        : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/5 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/5'
                    }`}
                    onClick={() => setBreakLength('long')}
                    disabled={running || pendingReview}
                  >
                    Long breaks
                  </Button>
                </div>
              </motion.section>
            )}
          </AnimatePresence>

          <div className="flex flex-col items-center gap-8 py-6 sm:py-10">
            <div
              id="tutorial-timer"
              className="flex flex-col items-center gap-4"
            >
              <PomodoroDial
                color={phase === 'focus' ? activeMode.color : BREAK_MODE_COLOR}
                progress={progress}
                remaining={timerRemaining}
                finished={finished}
                running={running}
                size="lg"
              />
              {running && phase === 'focus' && currentTopic && (
                <p className="text-xs text-slate-400">
                  Focusing on:{' '}
                  <span className="font-semibold text-white">
                    {currentTopic.name}
                  </span>
                </p>
              )}
            </div>

            <AnimatePresence>
              {!running && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className="flex flex-wrap items-center justify-center gap-2"
                >
                  <Badge className="bg-glass-soft border border-white/10 text-slate-300">
                    {phase === 'focus'
                      ? `${activeMode.label} session`
                      : `${Math.round(breakSeconds[breakLength] / 60)} min ${breakLength} break`}
                  </Badge>
                  <Badge className="bg-violet-500/20 text-violet-200">
                    +{activeMode.xp} XP focus reward
                  </Badge>
                </motion.div>
              )}
            </AnimatePresence>

            {!pendingReview ? (
              <TimerControls
                variant="inline"
                phase={phase}
                running={running}
                finished={finished}
                timerRemaining={timerRemaining}
                totalSeconds={totalSeconds}
                activeColor={activeMode.color}
                isSessionPending={completeSession.isPending}
                hasResolvedTopic={!!resolvedTopicId}
                onResetTimer={onResetTimer}
                onSkipBreak={onSkipBreak}
                onPlayPause={onPlayPause}
              />
            ) : (
              <SessionRatingPanel
                variant="inline"
                rating={rating}
                onRatingChange={setRating}
                onSaveSession={onSaveSession}
                onDiscard={onResetTimer}
                isSaving={completeSession.isPending}
              />
            )}
          </div>
        </div>

        <FocusModeOverlay
          isOpen={isFocusMode || forceCompletionFocus}
          forceCompletionFocus={forceCompletionFocus}
          onClose={() => setIsFocusMode(false)}
          phase={phase}
          activeModeLabel={activeMode.label}
          activeModeColor={activeMode.color}
          running={running}
          quote={quote}
          finished={finished}
          progress={progress}
          timerRemaining={timerRemaining}
          totalSeconds={totalSeconds}
          pendingReview={pendingReview}
          rating={rating}
          onRatingChange={setRating}
          isSessionPending={completeSession.isPending}
          hasResolvedTopic={!!resolvedTopicId}
          onResetTimer={onResetTimer}
          onSkipBreak={onSkipBreak}
          onPlayPause={onPlayPause}
          onSaveSession={onSaveSession}
        />
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
