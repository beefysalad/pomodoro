'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQueries } from '@tanstack/react-query'
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

  const onNext = () => {
    if (step === 1 && !setup.hasSubject) {
      setFlowMessage('Create your first subject to continue.')
      return
    }

    if (step === 2 && !setup.hasTopic) {
      setFlowMessage('Add your first topic to continue.')
      return
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

    try {
      await updateUser.mutateAsync({ onboarded: true })
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
        <div className="absolute top-[-120px] right-[-120px] h-[380px] w-[380px] rounded-full bg-violet-600/15 blur-[130px]" />
        <div className="absolute bottom-[-120px] left-[-120px] h-[380px] w-[380px] rounded-full bg-cyan-500/10 blur-[130px]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 py-6 sm:px-6">
        <header className="mb-6 flex items-center justify-between">
          <div className="leading-none text-white">
            <span className="block text-xl font-black tracking-tight">Tempo</span>
            <span className="mt-0.5 block text-[10px] font-semibold tracking-[0.14em] text-slate-400 uppercase">
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

        <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center">
          <div className="space-y-5 p-2 sm:p-4">
            {!!flowMessage && (
              <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-slate-300">
                {flowMessage}
              </div>
            )}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-300">
                  Step {step + 1} of {STEP_TITLES.length}
                </span>
                <span className="text-slate-400">{STEP_TITLES[step]}</span>
              </div>
              <Progress value={progress} className="h-2.5 bg-white/10" />
            </div>

            {step === 0 && (
              <section className="space-y-4">
                <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
                  Welcome to Tempo
                </h2>
                <p className="text-sm text-slate-300 sm:text-base">
                  Quick setup: create one subject, add one topic, and you are in.
                </p>
                <div className="grid gap-3 sm:grid-cols-3">
                  <QuickStat label="Level" value={`Lvl ${getLevel(user?.totalXP ?? 0)}`} />
                  <QuickStat label="Streak" value={`${user?.streak ?? 0} days`} />
                  <QuickStat label="XP" value={`${user?.totalXP ?? 0}`} />
                </div>
              </section>
            )}

            {step === 1 && (
              <section className="space-y-4">
                <h2 className="text-2xl font-bold text-white">Create your first subject</h2>
                <p className="text-sm text-slate-300">
                  Subjects are broad buckets like Math, Biology, or Frontend.
                </p>
                <div className="flex items-center gap-2">
                  <Input
                    value={newSubjectName}
                    onChange={(event) => setNewSubjectName(event.target.value)}
                    placeholder="e.g. Mathematics"
                    className="border-white/15 bg-white/5 text-white placeholder:text-slate-500"
                  />
                  <Button
                    onClick={onCreateSubject}
                    disabled={!newSubjectName.trim() || createSubject.isPending}
                    className="bg-violet-600 text-white hover:bg-violet-500"
                  >
                    Add
                  </Button>
                </div>
              </section>
            )}

            {step === 2 && (
              <section className="space-y-4">
                <h2 className="text-2xl font-bold text-white">Add your first topic</h2>
                <p className="text-sm text-slate-300">
                  Keep topics small and concrete so each session has clear wins.
                </p>
                <div className="space-y-2">
                  <label className="block text-xs text-slate-400">Subject</label>
                  <select
                    value={resolvedSubjectId}
                    onChange={(event) => setSelectedSubjectId(event.target.value)}
                    className="h-9 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white outline-none"
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
                    className="border-white/15 bg-white/5 text-white placeholder:text-slate-500"
                  />
                  <Button
                    onClick={onCreateTopic}
                    disabled={!newTopicName.trim() || !resolvedSubjectId || createTopic.isPending}
                    className="bg-cyan-600 text-white hover:bg-cyan-500"
                  >
                    Add
                  </Button>
                </div>
              </section>
            )}

            {step === 3 && (
              <section className="space-y-3">
                <h2 className="text-2xl font-bold text-white">How Tempo works</h2>
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
              </section>
            )}

            {step === 4 && (
              <section className="space-y-4">
                <h2 className="text-2xl font-bold text-white">You&apos;re ready</h2>
                <p className="text-sm text-slate-300">
                  We&apos;ll mark your account as ready and open your dashboard.
                </p>
                <div className="grid gap-3 sm:grid-cols-3">
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
                  className="h-11 w-full bg-emerald-600 font-bold text-white hover:bg-emerald-500"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Complete setup and enter dashboard
                </Button>
              </section>
            )}

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
                <Button className="bg-violet-600 text-white hover:bg-violet-500" onClick={onNext}>
                  Next
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>
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
    <div className="px-1 py-1 text-sm text-slate-300">
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
    <div className="px-1 py-1.5">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-1 text-lg font-bold text-white">{value}</p>
    </div>
  )
}
