'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { Pause, Play, Square, Star, Zap, CheckCircle2 } from 'lucide-react'
import { useState } from 'react'
import {
  useTimer,
  MODE_XP,
  MODE_SECONDS,
  TimerMode,
} from '@/contexts/timer-context'
import { useCompleteSession } from '@/hooks/use-sessions'

const MODE_CONFIG: Record<TimerMode, { label: string; color: string }> = {
  blitz: { label: 'Blitz', color: '#f59e0b' },
  focus: { label: 'Focus', color: '#7c3aed' },
  deep: { label: 'Deep', color: '#06b6d4' },
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${pad(m)}:${pad(s)}`
}

// ── Floating mini-timer pill (shown while navigating away) ───────────────────
function MiniTimer() {
  const { remaining, mode, running, topic, phase } = useTimer()
  if (phase !== 'timer' || !topic) return null

  const color = MODE_CONFIG[mode].color
  const total = MODE_SECONDS[mode]
  const progress = 1 - remaining / total

  return (
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 80, opacity: 0 }}
      className="fixed bottom-6 left-1/2 z-[150] -translate-x-1/2"
    >
      <div
        className="flex items-center gap-4 rounded-2xl border px-5 py-3 shadow-2xl backdrop-blur-xl"
        style={{
          borderColor: `${color}40`,
          backgroundColor: `color-mix(in srgb, var(--color-background) 80%, ${color} 20%)`,
        }}
      >
        {/* Mini arc */}
        <svg width="32" height="32" className="-rotate-90">
          <circle
            cx="16"
            cy="16"
            r="12"
            fill="none"
            stroke={`${color}30`}
            strokeWidth="3"
          />
          <circle
            cx="16"
            cy="16"
            r="12"
            fill="none"
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 12}
            strokeDashoffset={2 * Math.PI * 12 * (1 - progress)}
            style={{ filter: `drop-shadow(0 0 4px ${color})` }}
          />
        </svg>

        <div>
          <p className="text-foreground font-mono text-[18px] leading-none font-[900] tracking-[-0.04em]">
            {formatTime(remaining)}
          </p>
          <p className="text-muted-foreground/60 text-[11px] font-[600]">
            {topic.name} · {MODE_CONFIG[mode].label}
          </p>
        </div>

        <div className="h-6 w-px" style={{ backgroundColor: `${color}30` }} />

        {/* Pulse dot */}
        {running && (
          <motion.div
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: color }}
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.4, repeat: Infinity }}
          />
        )}
      </div>
    </motion.div>
  )
}

// ── Rating step ──────────────────────────────────────────────────────────────
function RatingStep() {
  const { topic, mode, elapsed, dismiss } = useTimer()
  const { mutateAsync: completeSession } = useCompleteSession()
  const [selected, setSelected] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  if (!topic) return null

  const config = MODE_CONFIG[mode]
  const xp = MODE_XP[mode]

  const handleSubmit = async () => {
    if (!selected) return
    setSubmitting(true)
    await completeSession({
      topicId: topic.id,
      mode,
      duration: Math.max(1, elapsed),
      xpEarned: xp,
      rating: selected,
    })
    dismiss()
  }

  return (
    <motion.div
      className="flex flex-col items-center gap-8 text-center"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 26 }}
    >
      <div className="relative">
        <motion.div
          className="absolute inset-0 rounded-full bg-emerald-500/25 blur-2xl"
          animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.85, 0.5] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
        <div className="relative flex h-24 w-24 items-center justify-center rounded-full border border-emerald-500/30 bg-gradient-to-br from-emerald-500/20 to-transparent">
          <CheckCircle2 className="h-12 w-12 text-emerald-400" />
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-foreground text-[32px] font-[900] tracking-[-0.04em]">
          Session complete!
        </h2>
        <p className="text-muted-foreground text-[15px]">
          {topic.name} · {config.label}
        </p>
        <div className="text-amber inline-flex items-center gap-1.5 rounded-xl bg-amber-500/10 px-4 py-2 text-[15px] font-[800]">
          <Zap className="h-4 w-4" />+{xp} XP earned
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-muted-foreground/70 text-[13px] font-[600] tracking-widest uppercase">
          How did it go?
        </p>
        <div className="flex gap-3">
          {[1, 2, 3].map((star) => (
            <motion.button
              key={star}
              onClick={() => setSelected(star)}
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
            >
              <Star
                className={`h-10 w-10 transition-all ${star <= selected ? 'fill-amber text-amber' : 'text-muted-foreground/30'}`}
              />
            </motion.button>
          ))}
        </div>
        <p className="text-muted-foreground/50 text-[12px]">
          {selected === 1
            ? 'Rough session'
            : selected === 2
              ? 'Pretty good'
              : selected === 3
                ? 'Nailed it!'
                : ''}
        </p>
      </div>

      <motion.button
        onClick={handleSubmit}
        disabled={!selected || submitting}
        whileHover={selected ? { scale: 1.04 } : undefined}
        whileTap={{ scale: 0.97 }}
        className="bg-violet inline-flex items-center gap-2 rounded-2xl px-10 py-4 text-[16px] font-[700] text-white shadow-[0_0_30px_var(--color-violet-glow)] disabled:cursor-not-allowed disabled:opacity-40"
      >
        {submitting ? 'Saving...' : 'Save & Continue'}
      </motion.button>
    </motion.div>
  )
}

// ── Full-screen timer ─────────────────────────────────────────────────────────
function FullTimer() {
  const { topic, mode, remaining, running, totalSeconds, pause, resume, stop } =
    useTimer()
  if (!topic) return null

  const config = MODE_CONFIG[mode]
  const progress = 1 - remaining / totalSeconds
  const circumference = 2 * Math.PI * 100

  return (
    <motion.div
      key="timer"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="relative z-10 flex flex-col items-center gap-8"
    >
      <div className="flex flex-col items-center gap-2">
        <div
          className="rounded-xl px-4 py-2 text-[13px] font-[800] tracking-widest uppercase"
          style={{ backgroundColor: `${config.color}20`, color: config.color }}
        >
          {config.label} Mode
        </div>
        <p className="text-muted-foreground text-[14px]">{topic.name}</p>
      </div>

      {/* Circular ring */}
      <div className="relative flex items-center justify-center">
        <svg width="260" height="260" className="-rotate-90">
          <circle
            cx="130"
            cy="130"
            r="100"
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            className="text-surface-up"
          />
          <motion.circle
            cx="130"
            cy="130"
            r="100"
            fill="none"
            stroke={config.color}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - progress)}
            style={{ filter: `drop-shadow(0 0 12px ${config.color}80)` }}
            transition={{ duration: 0.8, ease: 'linear' }}
          />
        </svg>
        <div className="absolute flex flex-col items-center gap-1">
          <span className="text-foreground font-mono text-[52px] leading-none font-[900] tracking-[-0.06em]">
            {formatTime(remaining)}
          </span>
          <span className="text-muted-foreground/50 text-[12px] font-[600] tracking-widest uppercase">
            remaining
          </span>
        </div>
      </div>

      <div
        className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-[14px] font-[800]"
        style={{ backgroundColor: `${config.color}10`, color: config.color }}
      >
        <Zap className="h-4 w-4" />+{MODE_XP[mode]} XP on completion
      </div>

      <div className="flex items-center gap-4">
        <motion.button
          onClick={running ? pause : resume}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="bg-surface border-border hover:border-border-up flex h-14 w-14 items-center justify-center rounded-2xl border transition-all"
        >
          {running ? (
            <Pause className="text-foreground h-6 w-6" />
          ) : (
            <Play className="text-foreground h-6 w-6 translate-x-[2px]" />
          )}
        </motion.button>

        <motion.button
          onClick={stop}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          className="flex h-14 items-center gap-2 rounded-2xl px-6 font-[700] text-white"
          style={{
            backgroundColor: config.color,
            boxShadow: `0 0 25px ${config.color}60`,
          }}
        >
          <Square className="h-4 w-4 fill-white" />
          End Session
        </motion.button>
      </div>
    </motion.div>
  )
}

// ── Global overlay — rendered in layout.tsx ───────────────────────────────────
export function GlobalTimerOverlay() {
  const { phase } = useTimer()

  // Full overlay during active session or rating
  const showFull = phase === 'timer' || phase === 'rating'

  return (
    <>
      {/* Full screen overlay */}
      <AnimatePresence>
        {showFull && (
          <motion.div
            className="bg-background/95 fixed inset-0 z-[200] flex flex-col items-center justify-center backdrop-blur-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Ambient glow */}
            <AmbientGlow />

            <AnimatePresence mode="wait">
              {phase === 'timer' && <FullTimer key="timer" />}
              {phase === 'rating' && (
                <motion.div
                  key="rating"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <RatingStep />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

function AmbientGlow() {
  const { mode } = useTimer()
  const color = MODE_CONFIG[mode].color
  return (
    <motion.div
      className="pointer-events-none absolute top-0 left-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[120px]"
      style={{ backgroundColor: `${color}30` }}
      animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }}
      transition={{ duration: 6, repeat: Infinity }}
    />
  )
}
