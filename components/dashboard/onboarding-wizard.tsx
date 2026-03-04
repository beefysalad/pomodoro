'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles,
  ArrowRight,
  FolderPlus,
  CheckCircle2,
  ChevronRight,
  BookOpen,
  Plus,
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useUpdateUser } from '@/hooks/use-user'
import { useCreateSubject } from '@/hooks/use-subjects'
import { useCreateTopic } from '@/hooks/use-topics'
import {
  CreateSubjectSchemaApi,
  TCreateSubjectSchemaApi,
} from '@/lib/schemas/subject'
import {
  CreateTopicSchemaApi,
  TCreateTopicSchemaApi,
} from '@/lib/schemas/topic'

const STEP_COUNT = 4

const pageVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? '100%' : '-100%',
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? '100%' : '-100%',
    opacity: 0,
  }),
}

const pageTransition = {
  type: 'spring' as const,
  stiffness: 280,
  damping: 30,
}

// ── Decorative blobs ──────────────────────────────────────────────────────────
function BgDecor() {
  return (
    <>
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <motion.div
          className="bg-violet/10 absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full blur-[120px]"
          animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="bg-violet/8 absolute -right-40 bottom-0 h-[400px] w-[400px] rounded-full blur-[100px]"
          animate={{ scale: [1.1, 1, 1.1], opacity: [0.3, 0.5, 0.3] }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 2,
          }}
        />
      </div>
    </>
  )
}

// ── Progress bar ──────────────────────────────────────────────────────────────
function ProgressBar({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-3">
      {Array.from({ length: STEP_COUNT }).map((_, i) => (
        <div
          key={i}
          className="relative h-1 flex-1 overflow-hidden rounded-full bg-white/10"
        >
          <motion.div
            className="bg-violet absolute inset-y-0 left-0 rounded-full"
            initial={false}
            animate={{ width: i < step ? '100%' : '0%' }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
          />
        </div>
      ))}
    </div>
  )
}

// ── Main Wizard Component ─────────────────────────────────────────────────────
export function OnboardingWizard() {
  const [step, setStep] = useState(1)
  const [direction, setDirection] = useState(1)
  const [createdSubjectId, setCreatedSubjectId] = useState<string | null>(null)

  const { mutateAsync: updateUser } = useUpdateUser()
  const { mutateAsync: createSubject } = useCreateSubject()
  const { mutateAsync: createTopic } = useCreateTopic()

  const goNext = () => {
    setDirection(1)
    setStep((s) => s + 1)
  }

  const completeOnboarding = async () => {
    try {
      await updateUser({ onboarded: true })
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="bg-background fixed inset-0 z-[100] flex flex-col">
      <BgDecor />

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-8 py-6">
        <span className="text-foreground text-[20px] font-[800] tracking-[-0.04em]">
          tempo
        </span>
        <div className="w-64">
          <ProgressBar step={step} />
        </div>
        <span className="text-muted-foreground/60 text-[13px] font-[600] tabular-nums">
          {step} / {STEP_COUNT}
        </span>
      </div>

      {/* Step content */}
      <div className="relative flex flex-1 items-center justify-center overflow-hidden px-4">
        <AnimatePresence custom={direction} mode="wait">
          {step === 1 && (
            <StepOneWelcome key="s1" direction={direction} onNext={goNext} />
          )}
          {step === 2 && (
            <StepTwoSubject
              key="s2"
              direction={direction}
              createSubject={createSubject}
              onNext={(id) => {
                setCreatedSubjectId(id)
                goNext()
              }}
            />
          )}
          {step === 3 && createdSubjectId && (
            <StepThreeTopics
              key="s3"
              direction={direction}
              subjectId={createdSubjectId}
              createTopic={createTopic}
              onNext={goNext}
            />
          )}
          {step === 4 && (
            <StepFourComplete
              key="s4"
              direction={direction}
              onFinish={completeOnboarding}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// ── Shared step wrapper ───────────────────────────────────────────────────────
function StepShell({
  direction,
  children,
}: {
  direction: number
  children: React.ReactNode
}) {
  return (
    <motion.div
      custom={direction}
      variants={pageVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={pageTransition}
      className="relative w-full max-w-lg"
    >
      {children}
    </motion.div>
  )
}

// ── Step 1: Welcome ───────────────────────────────────────────────────────────
function StepOneWelcome({
  direction,
  onNext,
}: {
  direction: number
  onNext: () => void
}) {
  return (
    <StepShell direction={direction}>
      <div className="space-y-10 text-center">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="relative">
            <motion.div
              className="bg-violet/30 absolute inset-0 rounded-[28px] blur-2xl"
              animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.9, 0.5] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            />
            <div className="border-violet/30 from-violet/25 relative flex h-24 w-24 items-center justify-center rounded-[28px] border bg-gradient-to-br to-transparent">
              <Sparkles className="text-violet h-10 w-10" />
            </div>
          </div>
        </div>

        {/* Text */}
        <div className="space-y-4">
          <h1 className="text-foreground text-[42px] leading-[1.05] font-[900] tracking-[-0.04em]">
            Welcome to Tempo
          </h1>
          <p className="text-muted-foreground mx-auto max-w-sm text-[17px] leading-[1.65] font-[450]">
            Your personal study OS. Track deep work, earn XP, and build
            unbreakable study habits — one session at a time.
          </p>
        </div>

        {/* CTA */}
        <motion.button
          onClick={onNext}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          className="bg-violet inline-flex items-center gap-3 rounded-2xl px-10 py-4 text-[16px] font-[700] text-white shadow-[0_0_40px_var(--color-violet-glow)] transition-shadow hover:shadow-[0_0_60px_var(--color-violet-glow)]"
        >
          Get Started
          <ArrowRight className="h-5 w-5" />
        </motion.button>

        <p className="text-muted-foreground/40 text-[13px] font-[500]">
          Setup takes less than 60 seconds
        </p>
      </div>
    </StepShell>
  )
}

// ── Step 2: Create Subject ────────────────────────────────────────────────────
function StepTwoSubject({
  direction,
  onNext,
  createSubject,
}: {
  direction: number
  onNext: (id: string) => void
  createSubject: (data: TCreateSubjectSchemaApi) => Promise<{ id: string }>
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TCreateSubjectSchemaApi>({
    resolver: zodResolver(CreateSubjectSchemaApi),
    defaultValues: { name: '' },
  })

  const onSubmit = async (data: TCreateSubjectSchemaApi) => {
    try {
      const res = await createSubject(data)
      onNext(res.id)
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <StepShell direction={direction}>
      <div className="space-y-8">
        {/* Header */}
        <div className="space-y-3">
          <div className="bg-violet/10 border-violet/20 inline-flex items-center gap-2 rounded-xl border px-4 py-2">
            <FolderPlus className="text-violet h-4 w-4" />
            <span className="text-violet text-[13px] font-[700] tracking-wide uppercase">
              Step 1
            </span>
          </div>
          <h2 className="text-foreground text-[36px] leading-[1.1] font-[900] tracking-[-0.04em]">
            What are you
            <br />
            studying?
          </h2>
          <p className="text-muted-foreground text-[16px] leading-[1.6] font-[450]">
            Create your first Subject — a top-level container for everything you
            want to learn.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <input
              {...register('name')}
              autoFocus
              placeholder="e.g., Computer Science, Marketing, French..."
              className="bg-surface/80 border-border text-foreground placeholder:text-muted-foreground/35 focus:border-violet focus:ring-violet/20 w-full rounded-2xl border px-6 py-5 text-[17px] font-[500] transition-all focus:ring-2 focus:outline-none"
            />
            {errors.name && (
              <p className="text-[13px] font-[600] text-red-400">
                {errors.name.message}
              </p>
            )}
          </div>

          <motion.button
            type="submit"
            disabled={isSubmitting}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-violet flex w-full items-center justify-center gap-3 rounded-2xl py-5 text-[16px] font-[700] text-white shadow-[0_0_30px_var(--color-violet-glow)] transition-all hover:shadow-[0_0_50px_var(--color-violet-glow)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <Sparkles className="h-5 w-5" />
              </motion.div>
            ) : (
              <>
                Continue
                <ArrowRight className="h-5 w-5" />
              </>
            )}
          </motion.button>
        </form>

        {/* Examples */}
        <div className="space-y-2">
          <p className="text-muted-foreground/50 text-[12px] font-[700] tracking-wider uppercase">
            Popular subjects
          </p>
          <div className="flex flex-wrap gap-2">
            {['Mathematics', 'Physics', 'History', 'Design', 'Coding'].map(
              (s) => (
                <span
                  key={s}
                  className="bg-surface border-border text-muted-foreground/60 rounded-xl border px-3 py-1.5 text-[13px] font-[600]"
                >
                  {s}
                </span>
              )
            )}
          </div>
        </div>
      </div>
    </StepShell>
  )
}

// ── Step 3: Add Topics ────────────────────────────────────────────────────────
function StepThreeTopics({
  direction,
  subjectId,
  onNext,
  createTopic,
}: {
  direction: number
  subjectId: string
  onNext: () => void
  createTopic: (data: {
    subjectId: string
    payload: TCreateTopicSchemaApi
  }) => Promise<{ id: string; name: string }>
}) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<TCreateTopicSchemaApi>({
    resolver: zodResolver(CreateTopicSchemaApi),
    defaultValues: { name: '' },
  })

  const [createdTopics, setCreatedTopics] = useState<string[]>([])

  const onSubmit = async (data: TCreateTopicSchemaApi) => {
    try {
      const res = await createTopic({ subjectId, payload: data })
      setCreatedTopics((prev) => [...prev, res.name])
      reset()
    } catch (err) {
      console.error(err)
    }
  }

  const nameValue = watch('name') ?? ''

  return (
    <StepShell direction={direction}>
      <div className="space-y-8">
        {/* Header */}
        <div className="space-y-3">
          <div className="bg-violet/10 border-violet/20 inline-flex items-center gap-2 rounded-xl border px-4 py-2">
            <BookOpen className="text-violet h-4 w-4" />
            <span className="text-violet text-[13px] font-[700] tracking-wide uppercase">
              Step 2
            </span>
          </div>
          <h2 className="text-foreground text-[36px] leading-[1.1] font-[900] tracking-[-0.04em]">
            Break it down
            <br />
            into topics
          </h2>
          <p className="text-muted-foreground text-[16px] leading-[1.6] font-[450]">
            Topics are specific areas inside your subject — like chapters,
            concepts, or skill sets.
          </p>
        </div>

        {/* Topics created */}
        <AnimatePresence>
          {createdTopics.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="flex flex-wrap gap-2"
            >
              {createdTopics.map((t, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-violet/10 border-violet/25 text-violet flex items-center gap-2 rounded-xl border px-4 py-2 text-[14px] font-[600]"
                >
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{t}</span>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div className="flex gap-3">
            <div className="flex-1 space-y-2">
              <input
                {...register('name')}
                placeholder="e.g., Chapter 1, Calculus, React Hooks..."
                className="bg-surface/80 border-border text-foreground placeholder:text-muted-foreground/35 focus:border-violet focus:ring-violet/20 w-full rounded-2xl border px-5 py-4 text-[16px] font-[500] transition-all focus:ring-2 focus:outline-none"
              />
              {errors.name && (
                <p className="text-[13px] font-[600] text-red-400">
                  {errors.name.message}
                </p>
              )}
            </div>
            <motion.button
              type="submit"
              disabled={!nameValue.trim() || isSubmitting}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-violet/10 border-violet/30 text-violet hover:bg-violet flex h-[58px] w-[58px] shrink-0 items-center justify-center rounded-2xl border transition-all hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isSubmitting ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <Sparkles className="h-5 w-5" />
                </motion.div>
              ) : (
                <Plus className="h-5 w-5" />
              )}
            </motion.button>
          </div>
        </form>

        {/* Continue */}
        <motion.button
          onClick={onNext}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`flex w-full items-center justify-center gap-3 rounded-2xl py-5 text-[16px] font-[700] transition-all ${
            createdTopics.length > 0
              ? 'bg-violet text-white shadow-[0_0_30px_var(--color-violet-glow)] hover:shadow-[0_0_50px_var(--color-violet-glow)]'
              : 'bg-surface border-border text-muted-foreground hover:text-foreground border'
          }`}
        >
          {createdTopics.length > 0 ? (
            <>
              Done adding topics
              <ChevronRight className="h-5 w-5" />
            </>
          ) : (
            'Skip for now →'
          )}
        </motion.button>
      </div>
    </StepShell>
  )
}

// ── Step 4: All set! ──────────────────────────────────────────────────────────
function StepFourComplete({
  direction,
  onFinish,
}: {
  direction: number
  onFinish: () => void
}) {
  return (
    <StepShell direction={direction}>
      <div className="space-y-10 text-center">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="relative">
            <motion.div
              className="absolute inset-0 rounded-[28px] bg-emerald-500/25 blur-2xl"
              animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="relative flex h-24 w-24 items-center justify-center rounded-[28px] border border-emerald-500/30 bg-gradient-to-br from-emerald-500/20 to-transparent"
              initial={{ scale: 0, rotate: -15 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <CheckCircle2 className="h-10 w-10 text-emerald-400" />
            </motion.div>
          </div>
        </div>

        {/* Text */}
        <div className="space-y-4">
          <motion.h2
            className="text-foreground text-[42px] leading-[1.05] font-[900] tracking-[-0.04em]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            You&apos;re all set!
          </motion.h2>
          <motion.p
            className="text-muted-foreground mx-auto max-w-sm text-[17px] leading-[1.65] font-[450]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            Your Tempo workspace is ready. Start your first Pomodoro session to
            earn XP and kick off your streak.
          </motion.p>
        </div>

        {/* CTA */}
        <motion.button
          onClick={onFinish}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          className="inline-flex items-center gap-3 rounded-2xl bg-emerald-500 px-10 py-4 text-[16px] font-[700] text-white shadow-[0_0_40px_rgba(16,185,129,0.4)] transition-shadow hover:shadow-[0_0_60px_rgba(16,185,129,0.5)]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          Go to Dashboard
          <ArrowRight className="h-5 w-5" />
        </motion.button>
      </div>
    </StepShell>
  )
}
