'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueries } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'

import { useCreateSubject, useSubjects } from '@/hooks/use-subjects'
import { useCreateTopic } from '@/hooks/use-topics'
import { useUpdateUser, useUser } from '@/hooks/use-user'
import { getTopics } from '@/lib/api/topics'

import { WizardShell } from '@/components/onboarding/wizard-shell'
import { WelcomeStep } from '@/components/onboarding/steps/welcome-step'
import { SubjectStep } from '@/components/onboarding/steps/subject-step'
import { TopicStep } from '@/components/onboarding/steps/topic-step'
import {
  TimerStep,
  timerSchema,
  type TimerFormInput,
  type TimerFormValues,
} from '@/components/onboarding/steps/timer-step'
import { FeaturesStep } from '@/components/onboarding/steps/features-step'
import { DoneStep } from '@/components/onboarding/steps/done-step'

const TOTAL_STEPS = 6
const FEEDBACK_DELAY_MS = 450

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
  const [subjectFeedback, setSubjectFeedback] = useState(false)
  const [topicFeedback, setTopicFeedback] = useState(false)
  const [completionDestination, setCompletionDestination] = useState<
    '/dashboard' | '/subjects' | null
  >(null)

  const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    return () => {
      if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current)
    }
  }, [])

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

  const watchedBlitz = useWatch({ control, name: 'blitzMinutes' }) as
    | number
    | string
    | undefined
  const watchedFocus = useWatch({ control, name: 'focusMinutes' }) as
    | number
    | string
    | undefined
  const watchedDeep = useWatch({ control, name: 'deepMinutes' }) as
    | number
    | string
    | undefined

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
      setFlowMessage('')
      setSubjectFeedback(true)
      feedbackTimeoutRef.current = setTimeout(() => {
        setSubjectFeedback(false)
        setStep(2)
      }, FEEDBACK_DELAY_MS)
    } catch {
      setFlowMessage('Could not create subject. Try again.')
    }
  }

  const onCreateTopic = async () => {
    const name = newTopicName.trim()
    if (!name || !resolvedSubjectId) return
    try {
      await createTopic.mutateAsync({
        subjectId: resolvedSubjectId,
        payload: { name },
      })
      setNewTopicName('')
      setFlowMessage('')
      setTopicFeedback(true)
      feedbackTimeoutRef.current = setTimeout(() => {
        setTopicFeedback(false)
        setStep(3)
      }, FEEDBACK_DELAY_MS)
    } catch {
      setFlowMessage('Could not create topic. Try again.')
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
    setStep((prev) => Math.min(TOTAL_STEPS - 1, prev + 1))
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

  const nextLabel =
    step === 0
      ? 'Begin setup'
      : step === 3
        ? 'Save & continue'
        : step === 4
          ? 'I am ready'
          : 'Continue'

  return (
    <WizardShell
      step={step}
      totalSteps={TOTAL_STEPS}
      flowMessage={flowMessage}
      onBack={onBack}
      backDisabled={step === 0}
      showNext={step < TOTAL_STEPS - 1}
      nextLabel={nextLabel}
      nextDisabled={updateUser.isPending && step === 3}
      onNext={() => void onNext()}
    >
      <AnimatePresence mode="wait">
        <motion.section
          key={`onboarding-step-${step}`}
          initial={{ opacity: 0, y: 18, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -16, scale: 0.98 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          {step === 0 && (
            <WelcomeStep
              totalXP={user?.totalXP ?? 0}
              streak={user?.streak ?? 0}
            />
          )}
          {step === 1 && (
            <SubjectStep
              subjects={subjects}
              hasSubject={setup.hasSubject}
              newSubjectName={newSubjectName}
              onChangeName={setNewSubjectName}
              onSubmit={() => void onCreateSubject()}
              isPending={createSubject.isPending}
              showFeedback={subjectFeedback}
            />
          )}
          {step === 2 && (
            <TopicStep
              subjects={subjects}
              resolvedSubjectId={resolvedSubjectId}
              onChangeSubject={setSelectedSubjectId}
              newTopicName={newTopicName}
              onChangeName={setNewTopicName}
              onSubmit={() => void onCreateTopic()}
              isPending={createTopic.isPending}
              showFeedback={topicFeedback}
            />
          )}
          {step === 3 && (
            <TimerStep
              register={register}
              errors={errors}
              watchedBlitz={watchedBlitz}
              watchedFocus={watchedFocus}
              watchedDeep={watchedDeep}
            />
          )}
          {step === 4 && <FeaturesStep />}
          {step === 5 && (
            <DoneStep
              canComplete={setup.hasSubject && setup.hasTopic}
              isPending={updateUser.isPending}
              onStartSession={() => void completeOnboarding('/dashboard')}
              onOpenFlashcards={() => void completeOnboarding('/subjects')}
            />
          )}
        </motion.section>
      </AnimatePresence>
    </WizardShell>
  )
}
