'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQueries } from '@tanstack/react-query'
import { AnimatePresence, motion, Variants } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Flame,
  GalleryVerticalEnd,
  LayersIcon,
  Rocket,
  Timer,
  Trophy,
  Zap,
} from 'lucide-react'
import { toast } from 'sonner'
import { UserButton } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { useCreateSubject, useSubjects } from '@/hooks/use-subjects'
import { useCreateTopic } from '@/hooks/use-topics'
import { useUpdateUser, useUser } from '@/hooks/use-user'
import { getTopics } from '@/lib/api/topics'
import { getLevelFromXp } from '@/lib/progression'

const STEPS = [
  { id: 'welcome', label: 'Welcome' },
  { id: 'subject', label: 'Subject' },
  { id: 'topic', label: 'Topic' },
  { id: 'timer', label: 'Timer' },
  { id: 'features', label: 'Features' },
  { id: 'done', label: 'Done' },
] as const

const FEATURES = [
  {
    icon: Zap,
    title: 'XP + Levels',
    description: 'Finish sessions to earn XP and level up over time.',
    color: 'from-yellow-500/20 to-orange-500/10 border-yellow-500/30',
    iconColor: 'text-yellow-400',
  },
  {
    icon: Flame,
    title: 'Daily Streak',
    description: 'Study every day to build momentum you can feel.',
    color: 'from-orange-500/20 to-red-500/10 border-orange-500/30',
    iconColor: 'text-orange-400',
  },
  {
    icon: Trophy,
    title: 'Achievements',
    description: 'Unlock milestones for consistency and deep focus.',
    color: 'from-amber-500/20 to-yellow-500/10 border-amber-500/30',
    iconColor: 'text-amber-400',
  },
  {
    icon: LayersIcon,
    title: 'Flashcard Decks',
    description:
      "Create decks per subject and quiz yourself anytime. Set up whenever you're ready.",
    color: 'from-violet-500/20 to-purple-500/10 border-violet-500/30',
    iconColor: 'text-violet-400',
    badge: 'New',
  },
  {
    icon: Rocket,
    title: 'Quests',
    description: 'Daily quests guide your next move for fast progress.',
    color: 'from-cyan-500/20 to-blue-500/10 border-cyan-500/30',
    iconColor: 'text-cyan-400',
  },
  {
    icon: GalleryVerticalEnd,
    title: 'Leaderboard',
    description: 'See where you stack up against other learners weekly.',
    color: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/30',
    iconColor: 'text-emerald-400',
  },
]

const TIMER_MODES = [
  {
    key: 'blitz',
    label: 'Blitz',
    hint: '5–120 min',
    desc: 'Quick bursts',
    emoji: '⚡',
  },
  {
    key: 'focus',
    label: 'Focus',
    hint: '10–180 min',
    desc: 'Standard flow',
    emoji: '🎯',
  },
  {
    key: 'deep',
    label: 'Deep',
    hint: '15–240 min',
    desc: 'Deep work',
    emoji: '🧠',
  },
]

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.96 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { delay: i * 0.08, duration: 0.35, ease: 'easeOut' },
  }),
}

export default function OnboardingPage() {
  const router = useRouter()
  const { data: user, isLoading: userLoading } = useUser()
  const { data: subjects = [] } = useSubjects()
  const createSubject = useCreateSubject()
  const createTopic = useCreateTopic()
  const updateUser = useUpdateUser()

  const [step, setStep] = useState(0)
  const [newSubjectName, setNewSubjectName] = useState('')
  const [newTopicName, setNewTopicName] = useState('')
  const [selectedSubjectId, setSelectedSubjectId] = useState('')
  const [flowMessage, setFlowMessage] = useState('')

  const [blitzMinutes, setBlitzMinutes] = useState('')
  const [focusMinutes, setFocusMinutes] = useState('')
  const [deepMinutes, setDeepMinutes] = useState('')
  const [shortBreakMinutes, setShortBreakMinutes] = useState('')
  const [longBreakMinutes, setLongBreakMinutes] = useState('')

  useEffect(() => {
    if (!userLoading && user?.onboarded) {
      router.replace('/dashboard')
    }
  }, [userLoading, user?.onboarded, router])

  const resolvedSubjectId = useMemo(() => {
    if (!subjects.length) return ''
    if (subjects.some((subject) => subject.id === selectedSubjectId)) {
      return selectedSubjectId
    }
    return subjects[0].id
  }, [subjects, selectedSubjectId])

  const topicQueries = useQueries({
    queries: subjects.map((subject) => ({
      queryKey: ['subject', subject.id],
      queryFn: () => getTopics(subject.id),
      enabled: !!subject.id,
    })),
  })

  const setup = useMemo(() => {
    const hasSubject = subjects.length > 0
    const allTopics = topicQueries.flatMap((query) => query.data?.topics ?? [])
    const hasTopic = allTopics.length > 0
    return { hasSubject, hasTopic, topicCount: allTopics.length }
  }, [subjects.length, topicQueries])

  const effectiveBlitz = blitzMinutes || String(user?.blitzMinutes ?? 10)
  const effectiveFocus = focusMinutes || String(user?.focusMinutes ?? 25)
  const effectiveDeep = deepMinutes || String(user?.deepMinutes ?? 50)
  const effectiveShortBreak =
    shortBreakMinutes || String(user?.shortBreakMinutes ?? 5)
  const effectiveLongBreak =
    longBreakMinutes || String(user?.longBreakMinutes ?? 10)

  const onCreateSubject = async () => {
    const name = newSubjectName.trim()
    if (!name) return
    try {
      const subject = await createSubject.mutateAsync({ name })
      setNewSubjectName('')
      setSelectedSubjectId(subject.id)
      toast.success(`Subject created: ${subject.name}`)
      setStep(2)
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
      toast.success(`Topic created: ${topic.name}`)
      setStep(3)
    } catch {
      toast.error('Could not create topic.')
    }
  }

  const parseTimerPreferences = () => {
    const blitz = Number(effectiveBlitz)
    const focus = Number(effectiveFocus)
    const deep = Number(effectiveDeep)
    const shortBreak = Number(effectiveShortBreak)
    const longBreak = Number(effectiveLongBreak)

    if (!Number.isFinite(blitz) || blitz < 5 || blitz > 120) {
      setFlowMessage('Blitz must be between 5 and 120 minutes.')
      return null
    }
    if (!Number.isFinite(focus) || focus < 10 || focus > 180) {
      setFlowMessage('Focus must be between 10 and 180 minutes.')
      return null
    }
    if (!Number.isFinite(deep) || deep < 15 || deep > 240) {
      setFlowMessage('Deep must be between 15 and 240 minutes.')
      return null
    }
    if (!Number.isFinite(shortBreak) || shortBreak < 1 || shortBreak > 30) {
      setFlowMessage('Short break must be between 1 and 30 minutes.')
      return null
    }
    if (!Number.isFinite(longBreak) || longBreak < 5 || longBreak > 60) {
      setFlowMessage('Long break must be between 5 and 60 minutes.')
      return null
    }
    if (longBreak < shortBreak) {
      setFlowMessage('Long break should be ≥ short break.')
      return null
    }
    return { blitz, focus, deep, shortBreak, longBreak }
  }

  const onNext = async () => {
    if (step === 1 && !setup.hasSubject) {
      setFlowMessage('Create your first subject to continue.')
      return
    }
    if (step === 2 && !setup.hasTopic) {
      setFlowMessage('Add your first topic to continue.')
      return
    }
    if (step === 3) {
      const parsed = parseTimerPreferences()
      if (!parsed) return
      try {
        await updateUser.mutateAsync({
          blitzMinutes: parsed.blitz,
          focusMinutes: parsed.focus,
          deepMinutes: parsed.deep,
          shortBreakMinutes: parsed.shortBreak,
          longBreakMinutes: parsed.longBreak,
        })
      } catch {
        setFlowMessage('Could not save timer preferences right now.')
        return
      }
    }
    setFlowMessage('')
    setStep((prev) => Math.min(STEPS.length - 1, prev + 1))
  }

  const onBack = () => {
    setFlowMessage('')
    setStep((prev) => Math.max(0, prev - 1))
  }

  const onFinishOnboarding = async () => {
    if (!setup.hasSubject || !setup.hasTopic) {
      setFlowMessage('Complete setup first.')
      return
    }
    const parsed = parseTimerPreferences()
    if (!parsed) return
    try {
      await updateUser.mutateAsync({
        onboarded: true,
        blitzMinutes: parsed.blitz,
        focusMinutes: parsed.focus,
        deepMinutes: parsed.deep,
        shortBreakMinutes: parsed.shortBreak,
        longBreakMinutes: parsed.longBreak,
      })
      setFlowMessage('Setup complete. Redirecting to your dashboard...')
      router.push('/dashboard')
    } catch {
      setFlowMessage('Unable to complete onboarding right now.')
    }
  }

  if (userLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#070b16] text-slate-300">
        <motion.div
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-sm tracking-widest text-slate-500 uppercase"
        >
          Loading…
        </motion.div>
      </div>
    )
  }

  const firstName = user?.firstName ?? 'there'
  const progress = ((step + 1) / STEPS.length) * 100

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#070b16] text-slate-100">
      {/* Background decorations */}
      <div className="pointer-events-none absolute inset-0">
        <motion.div
          className="absolute top-[-140px] right-[-140px] h-[500px] w-[500px] rounded-full bg-violet-600/18 blur-[160px]"
          animate={{ scale: [1, 1.08, 1], opacity: [0.5, 0.75, 0.5] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-[-160px] left-[-140px] h-[480px] w-[480px] rounded-full bg-cyan-500/14 blur-[160px]"
          animate={{ scale: [1.05, 1, 1.05], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-900/10 blur-[200px]"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 6, repeat: Infinity }}
        />
        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-4xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}

        <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-start pt-12 sm:pt-20">
          <div className="w-full space-y-6">
            {/* Step pill strip */}
            <div className="flex items-center justify-between gap-1 rounded-2xl border border-white/[0.07] bg-white/[0.03] p-2">
              {STEPS.map((s, index) => {
                const active = index === step
                const done = index < step
                return (
                  <motion.div
                    key={s.id}
                    className={`relative flex flex-1 items-center justify-center rounded-xl py-1.5 text-xs font-semibold transition-colors ${
                      active
                        ? 'bg-violet-600/80 text-white shadow-[0_0_20px_rgba(124,58,237,0.5)]'
                        : done
                          ? 'bg-cyan-500/20 text-cyan-300'
                          : 'text-slate-600'
                    }`}
                    animate={active ? { scale: [0.97, 1] } : { scale: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    {done && (
                      <CheckCircle2 className="mr-1 h-3 w-3 text-cyan-400" />
                    )}
                    <span className="hidden sm:inline">{s.label}</span>
                    <span className="sm:hidden">{index + 1}</span>
                  </motion.div>
                )
              })}
            </div>

            {/* Progress bar */}
            <motion.div
              initial={false}
              animate={{ width: `${progress}%` }}
              transition={{ type: 'spring', stiffness: 120, damping: 20 }}
              className="h-0.5 rounded-full bg-gradient-to-r from-violet-500 to-cyan-400"
              style={{ width: `${progress}%` }}
            />

            {/* Error message */}
            <AnimatePresence>
              {!!flowMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -6, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -6, height: 0 }}
                  className="overflow-hidden rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-2.5 text-sm text-amber-200"
                >
                  {flowMessage}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Step content */}
            <AnimatePresence mode="wait">
              <motion.section
                key={`onboarding-step-${step}`}
                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -16, scale: 0.98 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="space-y-6"
              >
                {/* ── STEP 0: Welcome ── */}
                {step === 0 && (
                  <div className="space-y-6 text-center">
                    <div className="space-y-3">
                      <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{
                          type: 'spring',
                          stiffness: 200,
                          damping: 14,
                          delay: 0.1,
                        }}
                        className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl border border-violet-500/30 bg-gradient-to-br from-violet-600/40 to-purple-800/40 text-5xl shadow-[0_0_40px_rgba(124,58,237,0.25)]"
                      >
                        👋
                      </motion.div>
                      <div>
                        <motion.h2
                          className="text-4xl font-black tracking-tight text-white sm:text-5xl"
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                        >
                          Hey, {firstName}!
                        </motion.h2>
                        <motion.p
                          className="mt-2 text-sm text-slate-400 sm:text-base"
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 }}
                        >
                          Welcome to{' '}
                          <span className="font-semibold text-violet-300">
                            Tempo
                          </span>{' '}
                          — your focus companion. Quick setup, then you&apos;re
                          locked in. 🚀
                        </motion.p>
                      </div>
                    </div>

                    <motion.div
                      className="grid gap-3 sm:grid-cols-3"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      <QuickStat
                        label="Level"
                        value={`Lvl ${getLevelFromXp(user?.totalXP ?? 0)}`}
                        icon="⚡"
                        color="violet"
                      />
                      <QuickStat
                        label="Streak"
                        value={`${user?.streak ?? 0} days`}
                        icon="🔥"
                        color="orange"
                      />
                      <QuickStat
                        label="XP"
                        value={`${user?.totalXP ?? 0}`}
                        icon="✨"
                        color="cyan"
                      />
                    </motion.div>

                    <motion.div
                      className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-2 text-xs font-semibold text-violet-300"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                    >
                      +50 XP setup bonus waiting for you
                    </motion.div>
                  </div>
                )}

                {/* ── STEP 1: Create Subject ── */}
                {step === 1 && (
                  <div className="space-y-5">
                    <div className="space-y-2 text-center">
                      <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-violet-500/30 bg-violet-600/20 text-3xl">
                        📚
                      </div>
                      <h2 className="text-3xl font-black tracking-tight text-white">
                        Create your first subject
                      </h2>
                      <p className="text-sm text-slate-400">
                        Subjects are broad buckets — like{' '}
                        <span className="text-slate-300">Math</span>,{' '}
                        <span className="text-slate-300">Biology</span>, or{' '}
                        <span className="text-slate-300">System Design</span>.
                      </p>
                    </div>

                    <div className="mx-auto w-full max-w-md space-y-3">
                      <div className="flex items-center gap-2">
                        <Input
                          id="subject-name"
                          value={newSubjectName}
                          onChange={(e) => setNewSubjectName(e.target.value)}
                          onKeyDown={(e) =>
                            e.key === 'Enter' && void onCreateSubject()
                          }
                          placeholder="e.g. Mathematics"
                          className="h-12 border-white/15 bg-white/5 text-white placeholder:text-slate-600 focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20"
                        />
                        <motion.div whileTap={{ scale: 0.95 }}>
                          <Button
                            onClick={() => void onCreateSubject()}
                            disabled={
                              !newSubjectName.trim() || createSubject.isPending
                            }
                            className="h-12 bg-violet-600 px-5 font-semibold text-white hover:bg-violet-500"
                          >
                            Add
                          </Button>
                        </motion.div>
                      </div>

                      {setup.hasSubject && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="flex flex-wrap gap-2"
                        >
                          {subjects.map((s) => (
                            <span
                              key={s.id}
                              className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300"
                            >
                              <CheckCircle2 className="h-3 w-3" />
                              {s.name}
                            </span>
                          ))}
                        </motion.div>
                      )}
                    </div>
                  </div>
                )}

                {/* ── STEP 2: Add Topic ── */}
                {step === 2 && (
                  <div className="space-y-5">
                    <div className="space-y-2 text-center">
                      <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-500/30 bg-cyan-600/20 text-3xl">
                        🎯
                      </div>
                      <h2 className="text-3xl font-black tracking-tight text-white">
                        Add your first topic
                      </h2>
                      <p className="text-sm text-slate-400">
                        Keep topics small and concrete so every session feels
                        like a clear win.
                      </p>
                    </div>

                    <div className="mx-auto max-w-md space-y-3">
                      <div className="space-y-1.5">
                        <label className="block text-xs tracking-widest text-slate-500 uppercase">
                          Subject
                        </label>
                        <select
                          value={resolvedSubjectId}
                          onChange={(e) => setSelectedSubjectId(e.target.value)}
                          className="h-11 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white transition-all outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20"
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

                      <div className="flex items-center gap-2">
                        <Input
                          id="topic-name"
                          value={newTopicName}
                          onChange={(e) => setNewTopicName(e.target.value)}
                          onKeyDown={(e) =>
                            e.key === 'Enter' && void onCreateTopic()
                          }
                          placeholder="e.g. Derivatives basics"
                          className="h-12 border-white/15 bg-white/5 text-white placeholder:text-slate-600 focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/20"
                        />
                        <motion.div whileTap={{ scale: 0.95 }}>
                          <Button
                            onClick={() => void onCreateTopic()}
                            disabled={
                              !newTopicName.trim() ||
                              !resolvedSubjectId ||
                              createTopic.isPending
                            }
                            className="h-12 bg-cyan-600 px-5 font-semibold text-white hover:bg-cyan-500"
                          >
                            Add
                          </Button>
                        </motion.div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── STEP 3: Timer Setup ── */}
                {step === 3 && (
                  <div className="space-y-5">
                    <div className="space-y-2 text-center">
                      <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-600/20 text-3xl">
                        ⏱️
                      </div>
                      <h2 className="text-3xl font-black tracking-tight text-white">
                        Set your timer style
                      </h2>
                      <p className="text-sm text-slate-400">
                        Match your session lengths to how you actually work.
                        Tweakable anytime in Settings.
                      </p>
                    </div>

                    {/* Mode legend */}
                    <div className="grid grid-cols-3 gap-2">
                      {TIMER_MODES.map((mode) => (
                        <div
                          key={mode.key}
                          className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-2.5 text-center"
                        >
                          <div className="mb-0.5 text-xl">{mode.emoji}</div>
                          <div className="text-xs font-bold text-white">
                            {mode.label}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {mode.desc}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                      <TimerField
                        label="Blitz"
                        hint="5–120 min"
                        value={effectiveBlitz}
                        onChange={setBlitzMinutes}
                      />
                      <TimerField
                        label="Focus"
                        hint="10–180 min"
                        value={effectiveFocus}
                        onChange={setFocusMinutes}
                      />
                      <TimerField
                        label="Deep"
                        hint="15–240 min"
                        value={effectiveDeep}
                        onChange={setDeepMinutes}
                      />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <TimerField
                        label="Short break"
                        hint="1–30 min"
                        value={effectiveShortBreak}
                        onChange={setShortBreakMinutes}
                      />
                      <TimerField
                        label="Long break"
                        hint="5–60 min"
                        value={effectiveLongBreak}
                        onChange={setLongBreakMinutes}
                      />
                    </div>
                  </div>
                )}

                {/* ── STEP 4: Features Overview ── */}
                {step === 4 && (
                  <div className="space-y-5">
                    <div className="space-y-2 text-center">
                      <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-purple-500/30 bg-purple-600/20 text-3xl">
                        🌟
                      </div>
                      <h2 className="text-3xl font-black tracking-tight text-white">
                        Everything in Tempo
                      </h2>
                      <p className="text-sm text-slate-400">
                        Six features to help you study smarter, not just longer.
                      </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {FEATURES.map((feature, i) => (
                        <motion.div
                          key={feature.title}
                          custom={i}
                          variants={cardVariants}
                          initial="hidden"
                          animate="visible"
                          whileHover={{ scale: 1.02, y: -2 }}
                          className={`relative rounded-xl border bg-gradient-to-br p-4 ${feature.color} cursor-default transition-shadow hover:shadow-[0_0_24px_rgba(0,0,0,0.3)]`}
                        >
                          {feature.badge && (
                            <span className="absolute top-2.5 right-2.5 rounded-full border border-violet-400/40 bg-violet-500/30 px-2 py-0.5 text-[10px] font-bold text-violet-300">
                              {feature.badge}
                            </span>
                          )}
                          <feature.icon
                            className={`mb-2.5 h-5 w-5 ${feature.iconColor}`}
                          />
                          <p className="mb-1 text-sm font-bold text-white">
                            {feature.title}
                          </p>
                          <p className="text-xs leading-relaxed text-slate-400">
                            {feature.description}
                          </p>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── STEP 5: Done ── */}
                {step === 5 && (
                  <div className="space-y-5 text-center">
                    <motion.div
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{
                        type: 'spring',
                        stiffness: 200,
                        damping: 14,
                      }}
                      className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-600/40 to-teal-800/40 text-5xl shadow-[0_0_40px_rgba(16,185,129,0.2)]"
                    >
                      🎉
                    </motion.div>

                    <div className="space-y-2">
                      <h2 className="text-4xl font-black tracking-tight text-white">
                        You&apos;re all set
                      </h2>
                      <p className="text-sm text-slate-400">
                        Complete setup and dive into your dashboard. Your
                        Flashcard Decks will be waiting inside each subject
                        whenever you&apos;re ready.
                      </p>
                    </div>

                    <div className="grid gap-2.5 sm:grid-cols-3">
                      <QuickStat
                        label="Subjects"
                        value={String(subjects.length)}
                        icon="📚"
                        color="violet"
                      />
                      <QuickStat
                        label="Topics"
                        value={String(setup.topicCount)}
                        icon="🎯"
                        color="cyan"
                      />
                      <QuickStat
                        label="Status"
                        value={
                          setup.hasSubject && setup.hasTopic
                            ? 'Ready ✓'
                            : 'Incomplete'
                        }
                        icon={setup.hasSubject && setup.hasTopic ? '✅' : '⚠️'}
                        color="emerald"
                      />
                    </div>

                    {/* Flashcard teaser */}
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="flex items-center gap-3 rounded-xl border border-violet-500/20 bg-violet-500/[0.07] px-4 py-3 text-left"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-violet-500/30 bg-violet-600/20">
                        <BookOpen className="h-4 w-4 text-violet-400" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">
                          Flashcard Decks are ready
                        </p>
                        <p className="text-xs text-slate-500">
                          Head to any subject and create your first deck to
                          start reviewing.
                        </p>
                      </div>
                    </motion.div>

                    <motion.div whileTap={{ scale: 0.98 }}>
                      <Button
                        onClick={() => void onFinishOnboarding()}
                        disabled={
                          !setup.hasSubject ||
                          !setup.hasTopic ||
                          updateUser.isPending
                        }
                        className="h-13 w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-base font-bold text-white shadow-[0_0_30px_rgba(16,185,129,0.25)] transition-all hover:from-emerald-500 hover:to-teal-500"
                      >
                        <CheckCircle2 className="h-5 w-5" />
                        Enter dashboard
                        <ArrowRight className="h-5 w-5" />
                      </Button>
                    </motion.div>
                  </div>
                )}
              </motion.section>
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex items-center justify-between pt-2">
              <motion.div whileTap={{ scale: 0.95 }}>
                <Button
                  variant="outline"
                  className="border-white/12 bg-white/[0.04] text-slate-300 hover:bg-white/10 hover:text-white"
                  onClick={onBack}
                  disabled={step === 0}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
              </motion.div>

              {step < STEPS.length - 1 && (
                <motion.div whileTap={{ scale: 0.95 }}>
                  <Button
                    className="bg-violet-600 font-semibold text-white hover:bg-violet-500"
                    onClick={() => void onNext()}
                    disabled={updateUser.isPending && step === 3}
                  >
                    {step === 3 ? 'Save & continue' : 'Continue'}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </motion.div>
              )}
            </div>

            <p className="text-center text-xs text-slate-600">
              Timer and preferences can be changed anytime in Settings.
            </p>
          </div>
        </main>
      </div>
    </div>
  )
}

function QuickStat({
  label,
  value,
  icon,
  color,
}: {
  label: string
  value: string
  icon: string
  color: 'violet' | 'cyan' | 'orange' | 'emerald'
}) {
  const colorMap = {
    violet: 'from-violet-600/20 to-violet-900/10 border-violet-500/20',
    cyan: 'from-cyan-600/20 to-cyan-900/10 border-cyan-500/20',
    orange: 'from-orange-600/20 to-orange-900/10 border-orange-500/20',
    emerald: 'from-emerald-600/20 to-emerald-900/10 border-emerald-500/20',
  }
  return (
    <div
      className={`rounded-xl border bg-gradient-to-br px-3 py-3.5 ${colorMap[color]}`}
    >
      <div className="mb-1 text-lg">{icon}</div>
      <p className="text-[10px] tracking-widest text-slate-500 uppercase">
        {label}
      </p>
      <p className="mt-0.5 text-lg font-black text-white">{value}</p>
    </div>
  )
}

function TimerField({
  label,
  hint,
  value,
  onChange,
}: {
  label: string
  hint: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="space-y-1.5 rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 py-3">
      <label className="text-xs tracking-widest text-slate-500 uppercase">
        {label}
      </label>
      <Input
        type="number"
        min={1}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 border-white/15 bg-white/5 text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/15"
      />
      <p className="text-[11px] text-slate-600">{hint}</p>
    </div>
  )
}
