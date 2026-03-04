'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft, Sparkles, FolderPlus } from 'lucide-react'
import { motion } from 'framer-motion'
import { useCreateSubject } from '@/hooks/use-subjects'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  CreateSubjectSchemaApi,
  TCreateSubjectSchemaApi,
} from '@/lib/schemas/subject'

const QUICK_FILLS = [
  'Computer Science',
  'Mathematics',
  'Physics',
  'French',
  'Marketing',
  'Design',
  'History',
  'Biology',
  'Chemistry',
  'Economics',
]

export function NewSubjectForm() {
  const router = useRouter()
  const { mutateAsync: createSubject } = useCreateSubject()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<TCreateSubjectSchemaApi>({
    resolver: zodResolver(CreateSubjectSchemaApi),
    defaultValues: { name: '' },
  })

  const nameValue = watch('name') ?? ''

  const onSubmit = async (data: TCreateSubjectSchemaApi) => {
    try {
      await createSubject(data)
      router.push('/dashboard')
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="relative flex min-h-full w-full items-center justify-center overflow-hidden px-4 py-16">
      {/* Ambient background glows */}
      <div className="pointer-events-none absolute inset-0">
        <motion.div
          className="bg-violet/15 absolute -top-32 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full blur-[120px]"
          animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="bg-violet/10 absolute right-20 bottom-0 h-72 w-72 rounded-full blur-[80px]"
          animate={{ scale: [1.1, 1, 1.1], opacity: [0.3, 0.6, 0.3] }}
          transition={{
            duration: 9,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 2,
          }}
        />
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(var(--color-border) 1px, transparent 1px), linear-gradient(90deg, var(--color-border) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
      </div>

      {/* Back button */}
      <motion.button
        onClick={() => router.back()}
        whileHover={{ x: -4 }}
        whileTap={{ scale: 0.95 }}
        className="text-muted-foreground hover:text-foreground absolute top-8 left-8 flex items-center gap-2 text-[14px] font-[600] transition-colors"
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </motion.button>

      {/* Card */}
      <motion.div
        className="relative z-10 w-full max-w-[520px]"
        initial={{ opacity: 0, y: 32, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{
          type: 'spring',
          stiffness: 280,
          damping: 26,
          delay: 0.05,
        }}
      >
        {/* Icon + heading */}
        <div className="mb-10 text-center">
          <div className="mb-6 flex justify-center">
            <div className="relative">
              <motion.div
                className="bg-violet/35 absolute inset-0 rounded-[22px] blur-xl"
                animate={{ scale: [1, 1.25, 1], opacity: [0.5, 0.85, 0.5] }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
              <div className="border-violet/30 from-violet/25 via-violet/10 relative flex h-20 w-20 items-center justify-center rounded-[22px] border bg-gradient-to-br to-transparent">
                <FolderPlus className="text-violet h-9 w-9" />
              </div>
            </div>
          </div>

          <h1 className="text-foreground mb-3 text-[40px] leading-[1.05] font-[900] tracking-[-0.04em]">
            New Subject
          </h1>
          <p className="text-muted-foreground mx-auto max-w-xs text-[15px] leading-relaxed font-[450]">
            Name the area you want to study. You&apos;ll add topics and kick off
            Pomodoro sessions right after.
          </p>
        </div>

        {/* Form card */}
        <div className="bg-surface/60 border-border/60 space-y-6 rounded-3xl border p-8 backdrop-blur-sm">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Input */}
            <div className="space-y-2">
              <label className="text-foreground block text-[11px] font-[800] tracking-[0.1em] uppercase">
                Subject name
              </label>
              <div className="relative">
                <input
                  {...register('name')}
                  autoFocus
                  placeholder="e.g., Advanced Calculus"
                  className="bg-background/80 border-border text-foreground placeholder:text-muted-foreground/30 focus:border-violet focus:ring-violet/20 w-full rounded-2xl border px-5 py-4 text-[17px] font-[500] transition-all focus:ring-2 focus:outline-none"
                />
                {/* Character count */}
                {nameValue.length > 0 && (
                  <span className="text-muted-foreground/40 absolute top-1/2 right-4 -translate-y-1/2 text-[12px] font-[600] tabular-nums">
                    {nameValue.length}
                  </span>
                )}
              </div>
              {errors.name && (
                <motion.p
                  className="text-[13px] font-[600] text-red-400"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {errors.name.message}
                </motion.p>
              )}
            </div>

            {/* Quick fills */}
            <div className="space-y-2.5">
              <p className="text-muted-foreground/45 text-[11px] font-[700] tracking-[0.1em] uppercase">
                Quick select
              </p>
              <div className="flex flex-wrap gap-2">
                {QUICK_FILLS.map((s) => (
                  <motion.button
                    key={s}
                    type="button"
                    onClick={() => setValue('name', nameValue === s ? '' : s)}
                    whileHover={{ scale: 1.06 }}
                    whileTap={{ scale: 0.94 }}
                    className={`rounded-xl border px-3.5 py-1.5 text-[13px] font-[600] transition-all ${
                      nameValue === s
                        ? 'border-violet bg-violet/15 text-violet shadow-[0_0_12px_var(--color-violet-glow)]'
                        : 'border-border bg-background/50 text-muted-foreground/60 hover:border-violet/40 hover:text-muted-foreground'
                    }`}
                  >
                    {s}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <motion.button
                type="button"
                onClick={() => router.back()}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="border-border/80 text-muted-foreground/70 hover:text-foreground hover:border-border rounded-2xl border px-6 py-4 text-[14px] font-[700] transition-all"
              >
                Cancel
              </motion.button>
              <motion.button
                type="submit"
                disabled={isSubmitting || !nameValue.trim()}
                whileHover={
                  !isSubmitting && nameValue.trim()
                    ? {
                        scale: 1.02,
                        boxShadow: '0 0 40px var(--color-violet-glow)',
                      }
                    : undefined
                }
                whileTap={{ scale: 0.98 }}
                className="bg-violet flex flex-1 items-center justify-center gap-2.5 rounded-2xl py-4 text-[15px] font-[700] text-white shadow-[0_0_25px_var(--color-violet-glow)] transition-all disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isSubmitting ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                  >
                    <Sparkles className="h-5 w-5" />
                  </motion.div>
                ) : (
                  <>
                    <FolderPlus className="h-5 w-5" />
                    Create Subject
                  </>
                )}
              </motion.button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  )
}
