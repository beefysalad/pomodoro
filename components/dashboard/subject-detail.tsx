'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpen,
  Plus,
  Play,
  Clock,
  BarChart2,
  Zap,
  Sparkles,
  Target,
  Microscope,
  ArrowLeft,
  Check,
  Star,
  ChevronRight,
} from 'lucide-react'
import { useSubjectTopics } from '@/hooks/use-topics'
import { useCreateTopic } from '@/hooks/use-topics'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { Topic } from '@/app/generated/prisma/client'
import { useTimer, TimerMode } from '@/contexts/timer-context'

const QuickTopicSchema = z.object({ name: z.string().min(1) })
type QuickTopicForm = z.infer<typeof QuickTopicSchema>

const MODES: {
  id: TimerMode
  label: string
  Icon: React.ElementType
  duration: string
  xp: number
  color: string
}[] = [
  {
    id: 'blitz',
    label: 'Blitz',
    Icon: Zap,
    duration: '10m',
    xp: 10,
    color: '#f59e0b',
  },
  {
    id: 'focus',
    label: 'Focus',
    Icon: Target,
    duration: '25m',
    xp: 25,
    color: '#7c3aed',
  },
  {
    id: 'deep',
    label: 'Deep',
    Icon: Microscope,
    duration: '50m',
    xp: 50,
    color: '#06b6d4',
  },
]

// ── Topic row ─────────────────────────────────────────────────────────────────
function TopicRow({
  topic,
  color,
  mode,
  onStart,
  index,
}: {
  topic: Topic
  color: string
  mode: TimerMode
  onStart: (t: Topic) => void
  index: number
}) {
  const modeConfig = MODES.find((m) => m.id === mode)!
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ delay: index * 0.04 }}
      className="group hover:bg-surface-up flex items-center gap-4 px-5 py-4 transition-colors"
    >
      {/* Color stripe */}
      <div
        className="h-10 w-[3px] shrink-0 rounded-full"
        style={{ backgroundColor: color }}
      />

      {/* Icon */}
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
        style={{ backgroundColor: `${color}18` }}
      >
        <BookOpen className="h-4 w-4" style={{ color }} />
      </div>

      {/* Text */}
      <div className="min-w-0 flex-1">
        <p className="text-foreground truncate text-[14px] font-[700]">
          {topic.name}
        </p>
        <div className="text-muted-foreground/40 mt-0.5 flex items-center gap-2.5 text-[11px] font-[500]">
          <span className="flex items-center gap-1">
            <BarChart2 className="h-3 w-3" />
            {topic.sessionCount ?? 0} sessions
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {topic.totalTime ?? 0}m
          </span>
          {typeof topic.lastRating === 'number' && topic.lastRating > 0 && (
            <span className="flex items-center gap-1">
              <Star className="fill-amber text-amber h-3 w-3" />
              {topic.lastRating}/3
            </span>
          )}
        </div>
      </div>

      {/* Start */}
      <motion.button
        onClick={() => onStart(topic)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.93 }}
        className="flex h-9 shrink-0 items-center gap-2 rounded-xl px-4 text-[12px] font-[800] text-white shadow-md transition-all"
        style={{
          backgroundColor: modeConfig.color,
          boxShadow: `0 4px 16px ${modeConfig.color}40`,
        }}
      >
        <Play className="h-3.5 w-3.5 translate-x-[1px]" />
        <span className="hidden sm:inline">{modeConfig.label}</span>
      </motion.button>
    </motion.div>
  )
}

// ── Quick add ─────────────────────────────────────────────────────────────────
function QuickAddTopic({ subjectId }: { subjectId: string }) {
  const [open, setOpen] = useState(false)
  const { mutateAsync: createTopic } = useCreateTopic()
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<QuickTopicForm>({ resolver: zodResolver(QuickTopicSchema) })

  const onSubmit = async (data: QuickTopicForm) => {
    await createTopic({ subjectId, payload: data })
    reset()
    setOpen(false)
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="border-border/40 text-muted-foreground/40 hover:text-muted-foreground hover:bg-surface-up flex w-full items-center justify-center gap-2 rounded-b-2xl py-3.5 text-[13px] font-[600] transition-colors"
      >
        <Plus className="h-4 w-4" /> Add topic
      </button>
    )
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit(onSubmit)}
      className="border-border/40 flex gap-2 border-t p-4"
    >
      <input
        {...register('name')}
        autoFocus
        placeholder="Topic name…"
        className="bg-background border-border text-foreground placeholder:text-muted-foreground/30 focus:border-violet flex-1 rounded-xl border px-4 py-2.5 text-[14px] focus:outline-none"
      />
      <button
        type="submit"
        disabled={isSubmitting}
        className="bg-violet flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl text-white disabled:opacity-50"
      >
        {isSubmitting ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            <Sparkles className="h-4 w-4" />
          </motion.div>
        ) : (
          <Check className="h-4 w-4" />
        )}
      </button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="text-muted-foreground/40 hover:text-foreground px-2 text-[12px] transition-colors"
      >
        Cancel
      </button>
    </motion.form>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export function SubjectDetail() {
  const params = useParams()
  const router = useRouter()
  const subjectId = params.id as string
  const [activeMode, setActiveMode] = useState<TimerMode>('focus')
  const { start: startTimer } = useTimer()
  const { data: subject, isLoading } = useSubjectTopics(subjectId)

  if (isLoading)
    return (
      <div className="text-muted-foreground flex h-full items-center justify-center text-sm">
        Loading…
      </div>
    )
  if (!subject)
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3">
        <p className="text-muted-foreground text-sm">Subject not found.</p>
        <button
          onClick={() => router.push('/dashboard')}
          className="text-violet text-sm font-[700] hover:underline"
        >
          ← Dashboard
        </button>
      </div>
    )

  const topics = subject.topics ?? []
  const totalSessions = topics.reduce((a, t) => a + (t.sessionCount ?? 0), 0)
  const totalTime = topics.reduce((a, t) => a + (t.totalTime ?? 0), 0)
  const activeModeConfig = MODES.find((m) => m.id === activeMode)!

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8 pb-20">
      {/* Back — mobile only */}
      <div className="pt-1 md:hidden">
        <button
          onClick={() => router.push('/dashboard')}
          className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-[13px] font-[600] transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Dashboard
        </button>
      </div>

      {/* ── Hero ───────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-4">
          <div
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl shadow-xl"
            style={{
              background: `linear-gradient(135deg, ${subject.color}25, ${subject.color}08)`,
              border: `2px solid ${subject.color}30`,
              boxShadow: `0 8px 28px ${subject.color}20`,
            }}
          >
            <BookOpen className="h-8 w-8" style={{ color: subject.color }} />
          </div>
          <div>
            <h1 className="text-foreground text-[28px] leading-tight font-[900] tracking-[-0.035em]">
              {subject.name}
            </h1>
            <div className="text-muted-foreground/50 mt-1.5 flex flex-wrap gap-3 text-[12px] font-[600]">
              <span className="flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5" />
                {topics.length} topics
              </span>
              <span className="flex items-center gap-1.5">
                <BarChart2 className="h-3.5 w-3.5" />
                {totalSessions} sessions
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {totalTime}m total
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Mode selector ───────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.06 }}
        className="flex flex-col gap-2"
      >
        <p className="text-muted-foreground/50 text-[11px] font-[800] tracking-widest uppercase">
          Session mode
        </p>
        <div className="grid grid-cols-3 gap-2">
          {MODES.map(({ id, label, Icon, duration, xp, color }) => {
            const active = activeMode === id
            return (
              <motion.button
                key={id}
                onClick={() => setActiveMode(id)}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.96 }}
                className={`flex flex-col items-center gap-2 rounded-2xl border py-4 transition-all ${
                  active
                    ? 'border-transparent text-white shadow-lg'
                    : 'border-border bg-surface text-muted-foreground hover:text-foreground'
                }`}
                style={
                  active
                    ? {
                        backgroundColor: color,
                        boxShadow: `0 6px 24px ${color}50`,
                      }
                    : {}
                }
              >
                <Icon className="h-5 w-5" />
                <div className="text-center">
                  <p className="text-[13px] font-[800]">{label}</p>
                  <p
                    className={`text-[10px] font-[600] ${active ? 'opacity-65' : 'text-muted-foreground/40'}`}
                  >
                    {duration} · +{xp} XP
                  </p>
                </div>
              </motion.button>
            )
          })}
        </div>
        <p className="text-muted-foreground/30 text-center text-[11px]">
          Select a mode, then tap ▶ next to any topic
        </p>
      </motion.div>

      {/* ── Topics ─────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col gap-2"
      >
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground/50 text-[11px] font-[800] tracking-widest uppercase">
            Topics ({topics.length})
          </p>
          <button
            onClick={() =>
              router.push(`/dashboard/subjects/${subjectId}/topics/new`)
            }
            className="text-violet flex items-center gap-1 text-[12px] font-[700] transition-opacity hover:opacity-80"
          >
            <Plus className="h-3.5 w-3.5" />
            New
          </button>
        </div>

        <div className="bg-surface border-border overflow-hidden rounded-2xl border">
          <AnimatePresence>
            {topics.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center gap-3 py-14 text-center"
              >
                <div
                  className="flex h-14 w-14 items-center justify-center rounded-2xl"
                  style={{ backgroundColor: `${subject.color}15` }}
                >
                  <BookOpen
                    className="h-6 w-6"
                    style={{ color: subject.color }}
                  />
                </div>
                <div>
                  <p className="text-foreground text-[14px] font-[700]">
                    No topics yet
                  </p>
                  <p className="text-muted-foreground/50 mt-1 text-[13px]">
                    Add your first topic below
                  </p>
                </div>
              </motion.div>
            ) : (
              <div className="divide-border divide-y">
                {topics.map((topic, i) => (
                  <TopicRow
                    key={topic.id}
                    topic={topic}
                    color={subject.color}
                    mode={activeMode}
                    onStart={(t) => startTimer(t, activeMode)}
                    index={i}
                  />
                ))}
              </div>
            )}
          </AnimatePresence>

          {/* Quick add at bottom */}
          <div className={topics.length > 0 ? 'border-border border-t' : ''}>
            <QuickAddTopic subjectId={subjectId} />
          </div>
        </div>
      </motion.div>
    </div>
  )
}
