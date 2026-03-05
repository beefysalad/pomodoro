'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  BookOpen,
  CheckCircle2,
  Flame,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Sparkles,
  Target,
  Timer,
  Trophy,
  Zap,
} from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { AppHeader } from '@/components/app-header'
import { useCompleteSession } from '@/hooks/use-sessions'
import { useCreateSubject, useSubjects } from '@/hooks/use-subjects'
import {
  useCreateTopic,
  useSubjectTopics,
  useUpdateTopic,
} from '@/hooks/use-topics'
import { useUser } from '@/hooks/use-user'
import { TOPIC_STATUS_LABEL } from '@/lib/topic-status'

type Mode = 'blitz' | 'focus' | 'deep'

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
    subtitle: (minutes) => `${minutes} min standard`,
  },
  deep: {
    label: 'Deep',
    xp: 50,
    color: '#06b6d4',
    subtitle: (minutes) => `${minutes} min deep work`,
  },
}

const DEFAULT_TIMER_MINUTES = {
  blitz: 10,
  focus: 25,
  deep: 50,
} as const

function pad(value: number) {
  return String(value).padStart(2, '0')
}

function formatClock(seconds: number) {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${pad(mins)}:${pad(secs)}`
}

function formatDuration(totalSeconds: number) {
  const totalMinutes = Math.floor(totalSeconds / 60)
  if (totalMinutes < 60) return `${totalMinutes}m`
  const hours = Math.floor(totalMinutes / 60)
  const mins = totalMinutes % 60
  return `${hours}h ${mins}m`
}

function getLevel(totalXP: number) {
  return Math.floor(Math.sqrt(totalXP / 100)) + 1
}

function getLevelProgress(totalXP: number) {
  const level = getLevel(totalXP)
  const currentLevelFloor = Math.pow(level - 1, 2) * 100
  const nextLevelFloor = Math.pow(level, 2) * 100
  const progress =
    ((totalXP - currentLevelFloor) / (nextLevelFloor - currentLevelFloor)) *
    100

  return {
    level,
    progress: Math.max(0, Math.min(100, progress)),
    xpToNext: Math.max(0, nextLevelFloor - totalXP),
  }
}

export default function DashboardPage() {
  const { data: user, isLoading: userLoading } = useUser()
  const { data: subjects = [], isLoading: subjectsLoading } = useSubjects()
  const createSubject = useCreateSubject()
  const createTopic = useCreateTopic()
  const updateTopic = useUpdateTopic()
  const completeSession = useCompleteSession()

  const [activeSubjectId, setActiveSubjectId] = useState('')
  const [selectedTopicId, setSelectedTopicId] = useState('')
  const [newSubjectName, setNewSubjectName] = useState('')
  const [newTopicName, setNewTopicName] = useState('')
  const [mode, setMode] = useState<Mode>('focus')
  const [rating, setRating] = useState(3)
  const [running, setRunning] = useState(false)
  const [finished, setFinished] = useState(false)
  const [isFocusMode, setIsFocusMode] = useState(false)
  const [remaining, setRemaining] = useState(DEFAULT_TIMER_MINUTES.focus * 60)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const completionKeyRef = useRef('')
  const [hasStarted, setHasStarted] = useState(false)

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
    if (!running) return

    timerRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current)
          setRunning(false)
          setFinished(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [running])

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

  useEffect(() => {
    if (!finished || !resolvedTopicId) return

    const completionKey = `${resolvedTopicId}:${mode}:${rating}:${activeMode.seconds}`
    if (completionKeyRef.current === completionKey) return
    completionKeyRef.current = completionKey

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
          toast.success(`Session completed: +${activeMode.xp} XP`)
          if (!resolvedSubjectId) return
          const moveDone = window.confirm(
            'Session complete. Move this topic to Done?'
          )
          if (moveDone) {
            updateTopic.mutate({
              subjectId: resolvedSubjectId,
              topicId: resolvedTopicId,
              payload: { status: 'DONE' },
            })
          }
        },
        onError: () => {
          toast.error('Unable to save your session. Try again.')
        },
      }
    )
  }, [
    finished,
    resolvedTopicId,
    completeSession,
    mode,
    activeMode.seconds,
    activeMode.xp,
    rating,
    resolvedSubjectId,
    updateTopic,
  ])

  const levelData = useMemo(
    () => getLevelProgress(user?.totalXP ?? 0),
    [user?.totalXP]
  )
  const totalTopicCount = topics.length
  const totalTopicSeconds = topics.reduce((sum, topic) => sum + topic.totalTime, 0)
  const topTopic = [...topics].sort((a, b) => b.totalTime - a.totalTime)[0]
  const timerRemaining =
    !hasStarted && !running && !finished ? activeMode.seconds : remaining
  const progress = 1 - timerRemaining / activeMode.seconds

  const onChangeMode = (nextMode: Mode) => {
    if (running) return
    completionKeyRef.current = ''
    setHasStarted(false)
    setMode(nextMode)
    setRemaining(modeConfig[nextMode].seconds)
    setFinished(false)
  }

  const onResetTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    completionKeyRef.current = ''
    setHasStarted(false)
    setRunning(false)
    setFinished(false)
    setRemaining(activeMode.seconds)
  }

  const onPlayPause = () => {
    if (!resolvedTopicId) {
      toast.error('Create a topic before starting a session.')
      return
    }

    if (finished) return
    if (!running && resolvedSubjectId) {
      updateTopic.mutate({
        subjectId: resolvedSubjectId,
        topicId: resolvedTopicId,
        payload: { status: 'IN_PROGRESS' },
      })
    }
    if (!running && !hasStarted) {
      setRemaining(activeMode.seconds)
      setHasStarted(true)
    }
    setRunning((prev) => !prev)
  }

  const onCreateSubject = async () => {
    const name = newSubjectName.trim()
    if (!name) return

    try {
      const subject = await createSubject.mutateAsync({ name })
      setNewSubjectName('')
      setActiveSubjectId(subject.id)
      toast.success(`Subject created: ${subject.name}`)
    } catch {
      toast.error('Could not create subject.')
    }
  }

  const onCreateTopic = async () => {
    const name = newTopicName.trim()
    if (!name || !resolvedSubjectId) return

    try {
      const topic = await createTopic.mutateAsync({
        subjectId: resolvedSubjectId,
        payload: { name },
      })
      setNewTopicName('')
      setSelectedTopicId(topic.id)
      toast.success(`Topic created: ${topic.name}`)
    } catch {
      toast.error('Could not create topic.')
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#070b16] text-slate-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 right-[-180px] h-[460px] w-[460px] rounded-full bg-cyan-500/12 blur-[140px]" />
        <div className="absolute bottom-[-120px] left-[-140px] h-[420px] w-[420px] rounded-full bg-violet-600/15 blur-[140px]" />
        <div className="absolute top-20 left-1/3 h-[220px] w-[220px] rounded-full bg-amber-500/8 blur-[80px]" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="w-full">
            <AppHeader />
          </div>
          <div>
            <h1 className="text-2xl leading-tight font-black tracking-tight text-white sm:text-4xl">
              Build streak. Earn XP. Keep momentum.
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              Level {levelData.level} · {user?.totalXP ?? 0} XP · {user?.streak ?? 0} day streak
            </p>
          </div>
        </header>

        <section className="grid grid-cols-2 gap-2.5 sm:gap-3 xl:grid-cols-4">
          <StatTile
            icon={Zap}
            label="Current XP"
            value={String(user?.totalXP ?? 0)}
            accent="from-violet-500/20 to-violet-500/5"
          />
          <StatTile
            icon={Flame}
            label="Streak"
            value={`${user?.streak ?? 0} days`}
            accent="from-orange-500/25 to-orange-500/5"
          />
          <StatTile
            icon={BookOpen}
            label="Subjects"
            value={String(subjects.length)}
            accent="from-cyan-500/25 to-cyan-500/5"
          />
          <StatTile
            icon={Target}
            label="Tracked Time"
            value={formatDuration(totalTopicSeconds)}
            accent="from-emerald-500/20 to-emerald-500/5"
          />
        </section>

        <section className="grid items-stretch gap-6 xl:grid-cols-[1.45fr_0.85fr]">
          <Card className="h-full w-full border-white/10 bg-gradient-to-b from-white/12 to-white/[0.03] py-0 backdrop-blur-xl">
            <CardContent className="px-4 py-6 sm:px-8 sm:py-8">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold tracking-[0.14em] text-slate-400 uppercase">
                    Focus Launcher
                  </p>
                  <h2 className="mt-1 text-2xl font-bold text-white">
                    Run your next session
                  </h2>
                </div>
                <Badge className="bg-violet-500/20 text-violet-200">
                  +{activeMode.xp} XP reward
                </Badge>
              </div>

              <div className="mb-6 grid gap-2 sm:grid-cols-3">
                {(Object.keys(modeConfig) as Mode[]).map((entryMode) => {
                  const option = modeConfig[entryMode]
                  const active = mode === entryMode

                  return (
                    <button
                      key={entryMode}
                      onClick={() => onChangeMode(entryMode)}
                      className="rounded-xl border px-3 py-2.5 text-left transition-all"
                      style={
                        active
                          ? {
                              borderColor: `${option.color}65`,
                              background: `${option.color}20`,
                              boxShadow: `0 0 20px ${option.color}30`,
                            }
                          : {
                              borderColor: 'rgba(255,255,255,0.12)',
                              background: 'rgba(255,255,255,0.03)',
                            }
                      }
                    >
                      <p className="text-sm font-semibold text-white">{option.label}</p>
                        <p className="text-xs text-slate-400">
                          {option.subtitle(option.minutes)}
                        </p>
                    </button>
                  )
                })}
              </div>

              <div className="mb-8 grid gap-3 md:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold tracking-wide text-slate-400 uppercase">
                    Subject
                  </label>
                  <select
                    value={resolvedSubjectId}
                    onChange={(event) => setActiveSubjectId(event.target.value)}
                    className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white outline-none transition focus:border-violet-400/50"
                    disabled={!subjects.length}
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
                    disabled={!topics.length}
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
                    Topic status
                  </label>
                  <div className="flex h-10 items-center rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-slate-200">
                    {currentTopic
                      ? TOPIC_STATUS_LABEL[currentTopic.status]
                      : 'No topic selected'}
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center gap-7">
                <div className="relative flex items-center justify-center">
                  <motion.div
                    className="absolute h-[250px] w-[250px] rounded-full blur-[80px]"
                    style={{ background: `${activeMode.color}26` }}
                    animate={
                      running
                        ? { scale: [1, 1.12, 1], opacity: [0.5, 0.9, 0.5] }
                        : { scale: 1, opacity: 0.5 }
                    }
                    transition={{ duration: 2.8, repeat: Infinity }}
                  />

                  <svg width="340" height="340" className="-rotate-90">
                    <circle
                      cx="170"
                      cy="170"
                      r="128"
                      fill="none"
                      stroke="rgba(255,255,255,0.08)"
                      strokeWidth="10"
                    />
                    <circle
                      cx="170"
                      cy="170"
                      r="128"
                      fill="none"
                      stroke={activeMode.color}
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeDasharray={2 * Math.PI * 128}
                      strokeDashoffset={(2 * Math.PI * 128) * (1 - progress)}
                      style={{ filter: `drop-shadow(0 0 16px ${activeMode.color}90)` }}
                    />
                  </svg>

                  <div className="absolute text-center">
                    {finished ? (
                      <div className="flex flex-col items-center gap-1.5">
                        <CheckCircle2 className="h-12 w-12 text-emerald-400" />
                        <p className="text-sm font-bold text-emerald-300">Session Done</p>
                      </div>
                    ) : (
                      <>
                        <p className="font-mono text-6xl font-black tracking-tight text-white sm:text-7xl">
                          {formatClock(timerRemaining)}
                        </p>
                        <p className="mt-1 text-xs tracking-[0.2em] text-slate-500 uppercase">
                          remaining
                        </p>
                      </>
                    )}
                  </div>
                </div>

                <div className="w-full max-w-xl space-y-3">
                  <div>
                    <p className="mb-1 text-center text-xs font-semibold tracking-wide text-slate-400 uppercase">
                      Session rating
                    </p>
                    <div className="grid grid-cols-3 gap-2">
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
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      className="h-12 flex-1 border-white/15 bg-white/5 text-slate-200 hover:bg-white/10"
                      onClick={onResetTimer}
                    >
                      <RotateCcw className="h-4 w-4" />
                      Reset
                    </Button>
                    <Button
                      variant="outline"
                      className="h-12 border-white/15 bg-white/5 text-slate-200 hover:bg-white/10"
                      onClick={() => setIsFocusMode(true)}
                    >
                      <Maximize2 className="h-4 w-4" />
                      Focus
                    </Button>
                    <Button
                      className="h-12 flex-[1.4] font-bold text-white"
                      onClick={onPlayPause}
                      disabled={!resolvedTopicId || completeSession.isPending}
                      style={{
                        backgroundColor: activeMode.color,
                        boxShadow: `0 0 28px ${activeMode.color}58`,
                      }}
                    >
                      {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      {running
                        ? 'Pause'
                        : finished
                          ? 'Done'
                          : timerRemaining === activeMode.seconds
                            ? 'Start'
                            : 'Resume'}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1 xl:grid-rows-3">
            <Card className="h-full border-white/10 bg-white/[0.05] py-0 backdrop-blur-xl">
              <CardContent className="px-4 py-5 sm:px-5">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-base font-bold text-white">Progress to next level</h3>
                  <Badge className="bg-cyan-500/20 text-cyan-200">
                    {levelData.xpToNext} XP left
                  </Badge>
                </div>
                <Progress value={levelData.progress} className="h-2.5 bg-white/10" />
                <p className="mt-2 text-xs text-slate-400">Level {levelData.level} in progress</p>
              </CardContent>
            </Card>

            <Card className="h-full border-white/10 bg-white/[0.05] py-0 backdrop-blur-xl">
              <CardContent className="space-y-4 px-4 py-5 sm:px-5">
                <div>
                  <h3 className="text-base font-bold text-white">Quick add</h3>
                  <p className="text-xs text-slate-400">Create subjects and topics in one place.</p>
                </div>

                <div className="space-y-2">
                  <Input
                    value={newSubjectName}
                    onChange={(event) => setNewSubjectName(event.target.value)}
                    placeholder="New subject"
                    className="border-white/15 bg-white/5 text-sm text-white placeholder:text-slate-500"
                  />
                  <Button
                    onClick={onCreateSubject}
                    disabled={!newSubjectName.trim() || createSubject.isPending}
                    className="w-full bg-violet-600 text-white hover:bg-violet-500"
                  >
                    <Plus className="h-4 w-4" />
                    Add subject
                  </Button>
                </div>

                <div className="space-y-2">
                  <Input
                    value={newTopicName}
                    onChange={(event) => setNewTopicName(event.target.value)}
                    placeholder="New topic"
                    className="border-white/15 bg-white/5 text-sm text-white placeholder:text-slate-500"
                  />
                  <Button
                    onClick={onCreateTopic}
                    disabled={
                      !resolvedSubjectId || !newTopicName.trim() || createTopic.isPending
                    }
                    className="w-full bg-cyan-600 text-white hover:bg-cyan-500"
                  >
                    <Sparkles className="h-4 w-4" />
                    Add topic
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="h-full border-white/10 bg-white/[0.05] py-0 backdrop-blur-xl sm:col-span-2 xl:col-span-1">
              <CardContent className="space-y-4 px-4 py-5 sm:px-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white">Topic performance</h3>
                  <Badge className="bg-emerald-500/20 text-emerald-200">
                    {totalTopicCount} topics
                  </Badge>
                </div>

                {!topics.length ? (
                  <p className="text-sm text-slate-400">
                    Create a topic to start tracking your sessions.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {topics.slice(0, 4).map((topic) => {
                      const relative = topTopic?.totalTime
                        ? Math.max(8, Math.round((topic.totalTime / topTopic.totalTime) * 100))
                        : 8

                      return (
                        <div key={topic.id}>
                          <div className="mb-1 flex items-center justify-between text-xs text-slate-300">
                            <span className="truncate pr-2">{topic.name}</span>
                            <span>
                              {formatDuration(topic.totalTime)} · {topic._count.sessions} sessions
                            </span>
                          </div>
                          <Progress value={relative} className="h-2 bg-white/10" />
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </section>

        <footer className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 backdrop-blur-xl sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
            <span className="inline-flex items-center gap-1.5">
              <Trophy className="h-3.5 w-3.5 text-amber-300" />
              {topTopic ? `Top topic: ${topTopic.name}` : 'No top topic yet'}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Timer className="h-3.5 w-3.5 text-cyan-300" />
              {subjectsLoading || userLoading
                ? 'Loading your stats...'
                : 'All stats update after each session'}
            </span>
          </div>
        </footer>
      </div>

      <AnimatePresence>
        {isFocusMode && (
          <motion.div
            className="fixed inset-0 z-50 grid place-items-center bg-[#070b16]/75 backdrop-blur-2xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-3xl px-4"
              initial={{ scale: 0.96, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.98, opacity: 0, y: 8 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
            >
              <div className="rounded-3xl border border-white/15 bg-[#0b1120]/90 p-6 shadow-[0_30px_100px_rgba(0,0,0,0.45)] sm:p-8">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold tracking-[0.2em] text-cyan-300 uppercase">
                      Focus Mode
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                      {running ? 'Locked in session' : 'Ready to begin'} · {activeMode.label}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    className="border-white/15 bg-white/5 text-slate-200 hover:bg-white/10"
                    onClick={() => setIsFocusMode(false)}
                  >
                    <Minimize2 className="h-4 w-4" />
                    Exit
                  </Button>
                </div>

                <div className="flex flex-col items-center gap-8">
                  <div className="relative flex items-center justify-center">
                    <motion.div
                      className="absolute h-[250px] w-[250px] rounded-full blur-[90px]"
                      style={{ background: `${activeMode.color}2b` }}
                      animate={
                        running
                          ? { scale: [1, 1.12, 1], opacity: [0.45, 0.9, 0.45] }
                          : { scale: 1, opacity: 0.5 }
                      }
                      transition={{ duration: 2.6, repeat: Infinity }}
                    />

                    <svg width="360" height="360" className="-rotate-90">
                      <circle
                        cx="180"
                        cy="180"
                        r="135"
                        fill="none"
                        stroke="rgba(255,255,255,0.1)"
                        strokeWidth="10"
                      />
                      <circle
                        cx="180"
                        cy="180"
                        r="135"
                        fill="none"
                        stroke={activeMode.color}
                        strokeWidth="10"
                        strokeLinecap="round"
                        strokeDasharray={2 * Math.PI * 135}
                        strokeDashoffset={(2 * Math.PI * 135) * (1 - progress)}
                        style={{ filter: `drop-shadow(0 0 18px ${activeMode.color}a6)` }}
                      />
                    </svg>

                    <div className="absolute text-center">
                      {finished ? (
                        <div className="flex flex-col items-center gap-2">
                          <CheckCircle2 className="h-12 w-12 text-emerald-400" />
                          <p className="text-sm font-bold text-emerald-300">Session Complete</p>
                        </div>
                      ) : (
                        <>
                          <p className="font-mono text-7xl font-black tracking-tight text-white">
                            {formatClock(timerRemaining)}
                          </p>
                          <p className="mt-1 text-xs tracking-[0.2em] text-slate-500 uppercase">
                            remaining
                          </p>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <Button
                      variant="outline"
                      className="h-11 border-white/15 bg-white/5 text-slate-200 hover:bg-white/10"
                      onClick={onResetTimer}
                    >
                      <RotateCcw className="h-4 w-4" />
                      Reset
                    </Button>
                    <Button
                      className="h-11 font-bold text-white"
                      onClick={onPlayPause}
                      disabled={!resolvedTopicId || completeSession.isPending}
                      style={{
                        backgroundColor: activeMode.color,
                        boxShadow: `0 0 30px ${activeMode.color}5f`,
                      }}
                    >
                      {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      {running
                        ? 'Pause'
                        : finished
                          ? 'Done'
                          : timerRemaining === activeMode.seconds
                            ? 'Start'
                            : 'Resume'}
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function StatTile({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  accent: string
}) {
  return (
    <Card className="border-white/10 bg-white/[0.05] py-0 backdrop-blur-xl">
      <CardContent className="relative overflow-hidden px-4 py-3.5 sm:px-5">
        <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${accent}`} />
        <div className="relative flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-medium text-slate-400">{label}</p>
            <p className="mt-0.5 text-[34px] leading-none font-extrabold tracking-tight text-white">
              {value}
            </p>
          </div>
          <div className="rounded-xl border border-white/15 bg-white/5 p-2">
            <Icon className="h-3.5 w-3.5 text-slate-200" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
