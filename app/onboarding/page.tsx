'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useCreateSubject, useSubjects } from '@/hooks/use-subjects'
import { useCreateTopic } from '@/hooks/use-topics'
import { useUpdateUser, useUser } from '@/hooks/use-user'
import { getTopics } from '@/lib/api/topics'
import { getLevelFromXp } from '@/lib/progression'
import { UserButton } from '@clerk/nextjs'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueries } from '@tanstack/react-query'
import { AnimatePresence, motion, Variants } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Flame,
  GalleryVerticalEnd,
  LayersIcon,
  Rocket,
  Trophy,
  Zap,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { useForm, useWatch, type UseFormRegisterReturn } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

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
  const [completionDestination, setCompletionDestination] = useState<
    '/dashboard' | '/subjects' | null
  >(null)
  const {
    register,
    reset,
    getValues,
    control,
    formState: { errors },
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

  useEffect(() => {
    if (!userLoading && user?.onboarded) {
      router.replace(completionDestination ?? '/dashboard')
    }
  }, [completionDestination, userLoading, user?.onboarded, router])

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

  const watchedBlitz = useWatch({ control, name: 'blitzMinutes' })
  const watchedFocus = useWatch({ control, name: 'focusMinutes' })
  const watchedDeep = useWatch({ control, name: 'deepMinutes' })

  const parseTimerPreferences = () => {
    const values = getValues()
    const parse = timerSchema.safeParse({
      blitzMinutes: values.blitzMinutes,
      focusMinutes: values.focusMinutes,
      deepMinutes: values.deepMinutes,
      shortBreakMinutes: user?.shortBreakMinutes ?? 5,
      longBreakMinutes: user?.longBreakMinutes ?? 10,
    })
    if (!parse.success) {
      setFlowMessage('Fix the highlighted timer fields to continue.')
      return null
    }
    return parse.data
  }

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
          blitzMinutes: parsed.blitzMinutes,
          focusMinutes: parsed.focusMinutes,
          deepMinutes: parsed.deepMinutes,
          shortBreakMinutes: user?.shortBreakMinutes ?? 5,
          longBreakMinutes: user?.longBreakMinutes ?? 10,
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

  const completeOnboarding = async (
    destination: '/dashboard' | '/subjects' = '/dashboard'
  ) => {
    setCompletionDestination(destination)
    if (!setup.hasSubject || !setup.hasTopic) {
      setFlowMessage('Complete setup first.')
      return
    }
    const parsed = parseTimerPreferences()
    if (!parsed) return
    try {
      await updateUser.mutateAsync({
        onboarded: true,
        blitzMinutes: parsed.blitzMinutes,
        focusMinutes: parsed.focusMinutes,
        deepMinutes: parsed.deepMinutes,
        shortBreakMinutes: user?.shortBreakMinutes ?? 5,
        longBreakMinutes: user?.longBreakMinutes ?? 10,
      })
      setFlowMessage('Setup complete. Redirecting to your dashboard...')
      router.push(destination)
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

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#070b16] text-slate-100">
      {/* Background decorations */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.05),transparent_55%)]" />
        <div className="absolute -top-32 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-violet-600/16 blur-[160px]" />
        <div className="absolute right-[-120px] -bottom-32 h-[440px] w-[440px] rounded-full bg-cyan-500/12 blur-[160px]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-6 sm:px-6 lg:px-10">
        <header className="flex items-center justify-between">
          <div className="leading-none text-white">
            <span className="block text-lg font-black tracking-tight sm:text-xl">
              Tempo
            </span>
            <span className="mt-0.5 block text-[10px] font-semibold tracking-[0.14em] text-slate-400 uppercase">
              onboarding
            </span>
          </div>
          <UserButton
            appearance={{
              elements: {
                avatarBox: 'w-9 h-9 border border-violet-400/40',
              },
            }}
          />
        </header>

        <main className="flex flex-1 flex-col items-center justify-center py-10 sm:py-12">
          <div className="w-full max-w-4xl space-y-8 text-center">
            <AnimatePresence>
              {!!flowMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="mx-auto max-w-2xl rounded-full border border-amber-500/25 bg-amber-500/10 px-5 py-2 text-sm text-amber-200"
                >
                  {flowMessage}
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
              <motion.section
                key={`onboarding-step-${step}`}
                initial={{ opacity: 0, y: 18, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -16, scale: 0.98 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="space-y-8"
              >
                {/* ── STEP 0: Welcome ── */}
                {step === 0 && (
                  <div className="space-y-6">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-violet-500/30 bg-violet-600/20 text-3xl">
                      🚀
                    </div>
                    <div className="space-y-3">
                      <h2 className="text-4xl font-black tracking-tight text-white sm:text-5xl">
                        Welcome to Tempo
                      </h2>
                      <p className="mx-auto max-w-2xl text-sm text-slate-400 sm:text-base">
                        Let&apos;s personalize your focus flow. We will set up
                        subjects, topics, and your timer style in a minute.
                      </p>
                    </div>
                    <div className="mx-auto grid max-w-3xl gap-3 sm:grid-cols-3">
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
                    </div>
                  </div>
                )}

                {/* ── STEP 1: Create Subject ── */}
                {step === 1 && (
                  <div className="space-y-6">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-violet-500/30 bg-violet-600/20 text-2xl">
                      📚
                    </div>
                    <div className="space-y-2">
                      <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
                        Create your first subject
                      </h2>
                      <p className="mx-auto max-w-2xl text-sm text-slate-400">
                        Subjects are your big buckets. Think Math, Biology, or
                        System Design.
                      </p>
                    </div>
                    <div className="mx-auto w-full max-w-xl space-y-3">
                      <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-2.5">
                        <Input
                          id="subject-name"
                          value={newSubjectName}
                          onChange={(e) => setNewSubjectName(e.target.value)}
                          onKeyDown={(e) =>
                            e.key === 'Enter' && void onCreateSubject()
                          }
                          placeholder="e.g. Mathematics"
                          className="h-12 border-white/10 bg-white/5 text-white placeholder:text-slate-600 focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20"
                        />
                        <motion.div whileTap={{ scale: 0.96 }}>
                          <Button
                            onClick={() => void onCreateSubject()}
                            disabled={
                              !newSubjectName.trim() || createSubject.isPending
                            }
                            className="h-12 rounded-xl bg-violet-600 px-5 font-semibold text-white hover:bg-violet-500"
                          >
                            Add subject
                          </Button>
                        </motion.div>
                      </div>

                      {setup.hasSubject && (
                        <div className="flex flex-wrap justify-center gap-2">
                          {subjects.map((s) => (
                            <span
                              key={s.id}
                              className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300"
                            >
                              <CheckCircle2 className="h-3 w-3" />
                              {s.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ── STEP 2: Add Topic ── */}
                {step === 2 && (
                  <div className="space-y-6">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-500/30 bg-cyan-600/20 text-2xl">
                      🎯
                    </div>
                    <div className="space-y-2">
                      <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
                        Add your first topic
                      </h2>
                      <p className="mx-auto max-w-2xl text-sm text-slate-400">
                        Keep topics small and concrete so each session feels
                        like a win.
                      </p>
                    </div>

                    <div className="mx-auto w-full max-w-xl space-y-3">
                      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                        <label className="block text-xs tracking-widest text-slate-500 uppercase">
                          Subject
                        </label>
                        <select
                          value={resolvedSubjectId}
                          onChange={(e) => setSelectedSubjectId(e.target.value)}
                          className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white transition-all outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20"
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

                      <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-2.5">
                        <Input
                          id="topic-name"
                          value={newTopicName}
                          onChange={(e) => setNewTopicName(e.target.value)}
                          onKeyDown={(e) =>
                            e.key === 'Enter' && void onCreateTopic()
                          }
                          placeholder="e.g. Derivatives basics"
                          className="h-12 border-white/10 bg-white/5 text-white placeholder:text-slate-600 focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/20"
                        />
                        <motion.div whileTap={{ scale: 0.96 }}>
                          <Button
                            onClick={() => void onCreateTopic()}
                            disabled={
                              !newTopicName.trim() ||
                              !resolvedSubjectId ||
                              createTopic.isPending
                            }
                            className="h-12 rounded-xl bg-cyan-600 px-5 font-semibold text-white hover:bg-cyan-500"
                          >
                            Add topic
                          </Button>
                        </motion.div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── STEP 3: Timer Setup ── */}
                {step === 3 && (
                  <div className="space-y-6">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-600/20 text-2xl">
                      ⏱️
                    </div>
                    <div className="space-y-2">
                      <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
                        Set your timer style
                      </h2>
                      <p className="mx-auto max-w-2xl text-sm text-slate-400">
                        Match your session lengths to how you actually work. You
                        can tweak these later in Settings.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-2">
                      {TIMER_MODES.map((mode) => (
                        <span
                          key={mode.key}
                          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-slate-200"
                        >
                          <span className="text-base">{mode.emoji}</span>
                          {mode.label} · {mode.desc}
                        </span>
                      ))}
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                      <TimerField
                        label="Blitz"
                        hint="5–120 min"
                        registration={register('blitzMinutes')}
                        error={errors.blitzMinutes?.message}
                      />
                      <TimerField
                        label="Focus"
                        hint="10–180 min"
                        registration={register('focusMinutes')}
                        error={errors.focusMinutes?.message}
                      />
                      <TimerField
                        label="Deep"
                        hint="15–240 min"
                        registration={register('deepMinutes')}
                        error={errors.deepMinutes?.message}
                      />
                    </div>
                    <p className="text-center text-[11px] text-slate-500">
                      Preview: Blitz {String(watchedBlitz || '-')}m · Focus{' '}
                      {String(watchedFocus || '-')}m · Deep{' '}
                      {String(watchedDeep || '-')}m
                    </p>
                  </div>
                )}

                {/* ── STEP 4: Features Overview ── */}
                {step === 4 && (
                  <div className="space-y-6">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-purple-500/30 bg-purple-600/20 text-2xl">
                      🌟
                    </div>
                    <div className="space-y-2">
                      <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
                        Here is what you can do
                      </h2>
                      <p className="mx-auto max-w-2xl text-sm text-slate-400">
                        Tools that keep you consistent and make study feel
                        lighter.
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
                          className={`relative rounded-2xl border bg-gradient-to-br p-4 ${feature.color} cursor-default transition-shadow hover:shadow-[0_0_24px_rgba(0,0,0,0.3)]`}
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
                  <div className="space-y-6">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-violet-500/30 bg-violet-600/20 text-3xl">
                      ✅
                    </div>
                    <div className="space-y-2">
                      <h2 className="text-4xl font-black tracking-tight text-white">
                        You are ready
                      </h2>
                      <p className="mx-auto max-w-2xl text-sm text-slate-400">
                        Pick how you want to start. You can always switch later.
                      </p>
                    </div>
                    <div className="mx-auto grid w-full max-w-4xl gap-4 md:grid-cols-2">
                      <div className="rounded-2xl border border-violet-500/25 bg-violet-500/10 p-6 text-left">
                        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl border border-violet-500/30 bg-violet-600/20 text-xl">
                          ⏱️
                        </div>
                        <h3 className="text-lg font-bold text-white">
                          Run a Pomodoro
                        </h3>
                        <p className="mt-1 text-sm text-slate-400">
                          Jump into the dashboard and start a focused session.
                        </p>
                        <Button
                          onClick={() => void completeOnboarding('/dashboard')}
                          disabled={
                            !setup.hasSubject ||
                            !setup.hasTopic ||
                            updateUser.isPending
                          }
                          className="mt-4 w-full rounded-full bg-violet-600 text-white hover:bg-violet-500"
                        >
                          Start a session
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-6 text-left">
                        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-500/30 bg-cyan-600/20 text-xl">
                          🧠
                        </div>
                        <h3 className="text-lg font-bold text-white">
                          Study or Quiz
                        </h3>
                        <p className="mt-1 text-sm text-slate-400">
                          Open a subject to review flashcards or take a quick
                          quiz.
                        </p>
                        <Button
                          onClick={() => void completeOnboarding('/subjects')}
                          disabled={
                            !setup.hasSubject ||
                            !setup.hasTopic ||
                            updateUser.isPending
                          }
                          className="mt-4 w-full rounded-full border border-violet-400/40 bg-violet-500/15 text-violet-100 hover:bg-violet-500/25"
                        >
                          Open flashcards
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </motion.section>
            </AnimatePresence>

            <div className="flex items-center justify-center gap-3">
              <Button
                variant="outline"
                className="h-11 rounded-full border-white/15 bg-white/[0.04] px-6 text-slate-300 hover:bg-white/10 hover:text-white"
                onClick={onBack}
                disabled={step === 0}
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>

              {step < STEPS.length - 1 && (
                <Button
                  className="h-11 rounded-full bg-violet-600 px-8 text-sm font-semibold text-white shadow-[0_0_20px_rgba(124,58,237,0.35)] hover:bg-violet-500"
                  onClick={() => void onNext()}
                  disabled={updateUser.isPending && step === 3}
                >
                  {step === 0
                    ? 'Begin setup'
                    : step === 3
                      ? 'Save & continue'
                      : step === 4
                        ? 'I am ready'
                        : 'Continue'}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>

            <p className="text-center text-xs text-slate-600">
              Timer and preferences can be changed anytime in Settings.
            </p>
          </div>
        </main>

        <div className="pb-6">
          <div className="mx-auto flex items-center justify-center gap-2">
            {STEPS.map((_, index) => (
              <div
                key={`step-dot-${index}`}
                className={`h-1.5 rounded-full transition-all ${
                  index === step
                    ? 'w-8 bg-violet-400'
                    : index < step
                      ? 'w-3 bg-violet-400/60'
                      : 'w-3 bg-white/10'
                }`}
              />
            ))}
          </div>
        </div>
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
  registration,
  error,
}: {
  label: string
  hint: string
  registration: UseFormRegisterReturn
  error?: string
}) {
  return (
    <div className="space-y-1.5 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
      <label className="text-[10px] font-semibold tracking-[0.2em] text-slate-500 uppercase">
        {label}
      </label>
      <Input
        type="number"
        inputMode="numeric"
        placeholder={hint}
        {...registration}
        className="h-9 border-white/15 bg-white/5 text-white placeholder:text-slate-500 focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/15"
      />
      <p
        className={
          error ? 'text-[11px] text-rose-300' : 'text-[11px] text-slate-600'
        }
      >
        {error ?? hint}
      </p>
    </div>
  )
}
