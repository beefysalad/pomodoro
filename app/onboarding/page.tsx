'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQueries } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Flame,
  Rocket,
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

const STEP_TITLES = [
  'Welcome',
  'Create Subject',
  'Add Topic',
  'Timer Setup',
  'How Tempo Works',
  'Finish Setup',
] as const

function getLevel(totalXP: number) {
  return Math.floor(Math.sqrt(totalXP / 100)) + 1
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

    return {
      hasSubject,
      hasTopic,
      topicCount: allTopics.length,
    }
  }, [subjects.length, topicQueries])

  const progress = ((step + 1) / STEP_TITLES.length) * 100
  const effectiveBlitz = blitzMinutes || String(user?.blitzMinutes ?? 10)
  const effectiveFocus = focusMinutes || String(user?.focusMinutes ?? 25)
  const effectiveDeep = deepMinutes || String(user?.deepMinutes ?? 50)
  const effectiveShortBreak = shortBreakMinutes || String(user?.shortBreakMinutes ?? 5)
  const effectiveLongBreak = longBreakMinutes || String(user?.longBreakMinutes ?? 10)

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
      setFlowMessage('Long break should be greater than or equal to short break.')
      return null
    }

    return {
      blitz,
      focus,
      deep,
      shortBreak,
      longBreak,
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
    setStep((prev) => Math.min(STEP_TITLES.length - 1, prev + 1))
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
        Loading onboarding...
      </div>
    )
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#070b16] text-slate-100">
      <div className="pointer-events-none absolute inset-0">
        <motion.div
          className="absolute top-[-120px] right-[-120px] h-[420px] w-[420px] rounded-full bg-violet-600/22 blur-[140px]"
          animate={{ scale: [1, 1.06, 1], opacity: [0.55, 0.8, 0.55] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-[-140px] left-[-120px] h-[420px] w-[420px] rounded-full bg-cyan-500/16 blur-[140px]"
          animate={{ scale: [1.04, 1, 1.04], opacity: [0.35, 0.55, 0.35] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(124,58,237,0.08),transparent_45%)]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-4xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-4 flex items-center justify-between sm:mb-8">
          <div className="leading-none text-white">
            <span className="block text-2xl font-black tracking-tight">Tempo</span>
            <span className="mt-1 block text-[11px] font-semibold tracking-[0.2em] text-slate-400 uppercase">
              by Patrick
            </span>
          </div>
          <UserButton
            appearance={{
              elements: {
                avatarBox: 'w-9 h-9 border-2 border-violet-400/50',
              },
            }}
          />
        </header>

        <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center">
          <div className="w-full space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm text-slate-300">
                Step {step + 1} of {STEP_TITLES.length}
                <span className="ml-2 text-slate-500">•</span>
                <span className="ml-2 text-cyan-200">{STEP_TITLES[step]}</span>
              </div>
              <div className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-violet-200">
                +50 XP setup bonus
              </div>
            </div>

            <div className="space-y-3">
              <Progress value={progress} className="h-2.5 bg-white/10" />
              <div className="flex items-center justify-between">
                {STEP_TITLES.map((title, index) => {
                  const active = index === step
                  const done = index < step
                  return (
                    <motion.div
                      key={title}
                      className={`h-2.5 w-2.5 rounded-full ${
                        active
                          ? 'bg-violet-300 shadow-[0_0_16px_rgba(167,139,250,0.95)]'
                          : done
                            ? 'bg-cyan-300/90'
                            : 'bg-white/20'
                      }`}
                      animate={active ? { scale: [1, 1.25, 1] } : { scale: 1 }}
                      transition={{ duration: 1.1, repeat: active ? Infinity : 0 }}
                    />
                  )
                })}
              </div>
            </div>

            {!!flowMessage && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-sm text-slate-300"
              >
                {flowMessage}
              </motion.div>
            )}

            <AnimatePresence mode="wait">
              <motion.section
                key={`onboarding-step-${step}`}
                initial={{ opacity: 0, y: 18, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -12, scale: 0.98 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
                className="space-y-5"
              >
                {step === 0 && (
                  <>
                    <h2 className="text-center text-4xl font-black tracking-tight text-white sm:text-5xl">
                      Welcome to Tempo
                    </h2>
                    <p className="mx-auto max-w-lg text-center text-sm text-slate-300 sm:text-base">
                      Quick setup, then you are locked in. Create your first subject and topic to
                      unlock full tracking.
                    </p>
                    <div className="grid gap-2.5 sm:grid-cols-3">
                      <QuickStat label="Level" value={`Lvl ${getLevel(user?.totalXP ?? 0)}`} />
                      <QuickStat label="Streak" value={`${user?.streak ?? 0} days`} />
                      <QuickStat label="XP" value={`${user?.totalXP ?? 0}`} />
                    </div>
                  </>
                )}

                {step === 1 && (
                  <>
                    <h2 className="text-center text-3xl font-black tracking-tight text-white">
                      Create your first subject
                    </h2>
                    <p className="text-center text-sm text-slate-300">
                      Subjects are broad buckets like Math, Biology, or Frontend.
                    </p>
                    <div className="mx-auto flex w-full max-w-lg items-center gap-2">
                      <Input
                        value={newSubjectName}
                        onChange={(event) => setNewSubjectName(event.target.value)}
                        placeholder="e.g. Mathematics"
                        className="h-11 border-white/15 bg-white/5 text-white placeholder:text-slate-500"
                      />
                      <Button
                        onClick={onCreateSubject}
                        disabled={!newSubjectName.trim() || createSubject.isPending}
                        className="h-11 bg-violet-600 text-white hover:bg-violet-500"
                      >
                        Add
                      </Button>
                    </div>
                  </>
                )}

                {step === 2 && (
                  <>
                    <h2 className="text-center text-3xl font-black tracking-tight text-white">
                      Add your first topic
                    </h2>
                    <p className="text-center text-sm text-slate-300">
                      Keep topics small and concrete so each session has clear wins.
                    </p>
                    <div className="mx-auto max-w-lg space-y-3">
                      <div className="space-y-1.5">
                        <label className="block text-xs tracking-wide text-slate-400 uppercase">Subject</label>
                        <select
                          value={resolvedSubjectId}
                          onChange={(event) => setSelectedSubjectId(event.target.value)}
                          className="h-11 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white outline-none"
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
                          value={newTopicName}
                          onChange={(event) => setNewTopicName(event.target.value)}
                          placeholder="e.g. Derivatives basics"
                          className="h-11 border-white/15 bg-white/5 text-white placeholder:text-slate-500"
                        />
                        <Button
                          onClick={onCreateTopic}
                          disabled={
                            !newTopicName.trim() || !resolvedSubjectId || createTopic.isPending
                          }
                          className="h-11 bg-cyan-600 text-white hover:bg-cyan-500"
                        >
                          Add
                        </Button>
                      </div>
                    </div>
                  </>
                )}

                {step === 3 && (
                  <>
                    <h2 className="text-center text-3xl font-black tracking-tight text-white">
                      Set your timer style
                    </h2>
                    <p className="text-center text-sm text-slate-300">
                      Pick your focus and break durations now. You can change these later in Settings.
                    </p>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <TimerField
                        label="Blitz"
                        hint="5-120 min"
                        value={effectiveBlitz}
                        onChange={setBlitzMinutes}
                      />
                      <TimerField
                        label="Focus"
                        hint="10-180 min"
                        value={effectiveFocus}
                        onChange={setFocusMinutes}
                      />
                      <TimerField
                        label="Deep"
                        hint="15-240 min"
                        value={effectiveDeep}
                        onChange={setDeepMinutes}
                      />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <TimerField
                        label="Short break"
                        hint="1-30 min"
                        value={effectiveShortBreak}
                        onChange={setShortBreakMinutes}
                      />
                      <TimerField
                        label="Long break"
                        hint="5-60 min"
                        value={effectiveLongBreak}
                        onChange={setLongBreakMinutes}
                      />
                    </div>
                  </>
                )}

                {step === 4 && (
                  <>
                    <h2 className="text-center text-3xl font-black tracking-tight text-white">
                      How Tempo works
                    </h2>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <InfoRow icon={Zap} title="XP + Levels">
                        Finish sessions to earn XP and level up over time.
                      </InfoRow>
                      <InfoRow icon={Flame} title="Streak">
                        Study daily to build a streak and protect momentum.
                      </InfoRow>
                      <InfoRow icon={Trophy} title="Achievements">
                        Unlock milestones for consistency and focused time.
                      </InfoRow>
                      <InfoRow icon={Rocket} title="Quests">
                        Daily quests suggest what to do next for quick progress.
                      </InfoRow>
                    </div>
                  </>
                )}

                {step === 5 && (
                  <>
                    <h2 className="text-center text-3xl font-black tracking-tight text-white">
                      You&apos;re ready
                    </h2>
                    <p className="text-center text-sm text-slate-300">
                      Complete setup and jump into your dashboard.
                    </p>
                    <div className="grid gap-2.5 sm:grid-cols-3">
                      <QuickStat label="Subjects" value={String(subjects.length)} />
                      <QuickStat label="Topics" value={String(setup.topicCount)} />
                      <QuickStat
                        label="Status"
                        value={setup.hasSubject && setup.hasTopic ? 'Ready' : 'Incomplete'}
                      />
                    </div>
                    <Button
                      onClick={onFinishOnboarding}
                      disabled={!setup.hasSubject || !setup.hasTopic || updateUser.isPending}
                      className="h-12 w-full bg-emerald-600 font-bold text-white hover:bg-emerald-500"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Complete setup and enter dashboard
                    </Button>
                  </>
                )}
              </motion.section>
            </AnimatePresence>

            <div className="flex items-center justify-between pt-3">
              <Button
                variant="outline"
                className="border-white/15 bg-white/5 text-slate-200 hover:bg-white/10"
                onClick={onBack}
                disabled={step === 0}
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>

              {step < STEP_TITLES.length - 1 && (
                <Button
                  className="bg-violet-600 text-white hover:bg-violet-500"
                  onClick={() => void onNext()}
                  disabled={updateUser.isPending && step === 3}
                >
                  {step === 3 ? 'Save timer prefs' : 'Next'}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>

            <p className="text-center text-xs text-slate-500">
              You can revisit timer and break durations anytime in Settings.
            </p>
          </div>
        </main>
      </div>
    </div>
  )
}

function InfoRow({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3 text-sm text-slate-300">
      <p className="mb-1 inline-flex items-center gap-2 font-semibold text-white">
        <Icon className="h-3.5 w-3.5" />
        {title}
      </p>
      <p>{children}</p>
    </div>
  )
}

function QuickStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-gradient-to-br from-white/[0.1] to-white/[0.03] px-3 py-3">
      <p className="text-xs tracking-wide text-slate-400 uppercase">{label}</p>
      <p className="mt-1 text-xl font-black text-white">{value}</p>
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
    <div className="space-y-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3">
      <label className="text-xs tracking-wide text-slate-400 uppercase">{label}</label>
      <Input
        type="number"
        min={1}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 border-white/15 bg-white/5 text-white placeholder:text-slate-500"
      />
      <p className="text-xs text-slate-500">{hint}</p>
    </div>
  )
}
