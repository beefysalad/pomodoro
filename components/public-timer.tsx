'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { Pause, Play, RotateCcw, Zap, Timer, CheckCircle2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useClerk } from '@clerk/nextjs'

type Mode = 'blitz' | 'focus' | 'deep'

const MODE_CONFIG: Record<
  Mode,
  { label: string; color: string; seconds: number; xp: number; desc: string }
> = {
  blitz: {
    label: 'Blitz',
    color: '#f59e0b',
    seconds: 10 * 60,
    xp: 10,
    desc: '10 min sprint',
  },
  focus: {
    label: 'Focus',
    color: '#7c3aed',
    seconds: 25 * 60,
    xp: 25,
    desc: '25 min session',
  },
  deep: {
    label: 'Deep',
    color: '#06b6d4',
    seconds: 50 * 60,
    xp: 50,
    desc: '50 min block',
  },
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${pad(m)}:${pad(s)}`
}
const DEFAULT_TITLE = 'Tempo'

export function PublicTimer({
  onRunningChange,
  immersive = false,
}: {
  onRunningChange?: (running: boolean) => void
  immersive?: boolean
}) {
  const clerk = useClerk()
  const [mode, setMode] = useState<Mode>('focus')
  const [task, setTask] = useState('')
  const [remaining, setRemaining] = useState(MODE_CONFIG.focus.seconds)
  const [running, setRunning] = useState(false)
  const [finished, setFinished] = useState(false)
  const [completionMessage, setCompletionMessage] = useState('')
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const shouldNotifyCompletionRef = useRef(false)
  const deadlineRef = useRef<number | null>(null)
  const remainingRef = useRef(remaining)

  const config = MODE_CONFIG[mode]
  const total = config.seconds
  const progress = 1 - remaining / total
  const isImmersiveRunning = immersive && running
  const ringRadius = isImmersiveRunning ? 132 : 100
  const ringSize = isImmersiveRunning ? 332 : 260
  const ringCenter = ringSize / 2
  const ringStroke = isImmersiveRunning ? 8 : 6
  const circumference = 2 * Math.PI * ringRadius

  useEffect(() => {
    remainingRef.current = remaining
  }, [remaining])

  useEffect(() => {
    if (!running) return
    const startRemaining = remainingRef.current
    deadlineRef.current = Date.now() + startRemaining * 1000

    const syncRemaining = () => {
      if (!deadlineRef.current) return
      const nextRemaining = Math.max(
        0,
        Math.ceil((deadlineRef.current - Date.now()) / 1000)
      )

      setRemaining((prev) => (prev === nextRemaining ? prev : nextRemaining))

      if (nextRemaining === 0) {
        clearInterval(intervalRef.current!)
        deadlineRef.current = null
        setRunning(false)
        setFinished(true)
        shouldNotifyCompletionRef.current = true
        setCompletionMessage(
          task.trim()
            ? `"${task}" complete. Sign up to track your progress.`
            : 'Session complete. Sign up to track your progress.'
        )
      }
    }

    syncRemaining()
    intervalRef.current = setInterval(syncRemaining, 1000)

    const onFocus = () => syncRemaining()
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        syncRemaining()
      }
    }

    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      clearInterval(intervalRef.current!)
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      deadlineRef.current = null
    }
  }, [running, task])

  useEffect(() => {
    onRunningChange?.(running)
  }, [running, onRunningChange])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (running && 'Notification' in window && Notification.permission === 'default') {
      void Notification.requestPermission().catch(() => undefined)
    }
  }, [running])

  useEffect(() => {
    if (typeof document === 'undefined') return

    if (finished) {
      document.title = `✅ Demo session done · ${DEFAULT_TITLE}`
      return
    }

    if (running || remaining < total) {
      document.title = `⏱ ${formatTime(Math.max(0, remaining))} · ${config.label} · ${DEFAULT_TITLE}`
      return
    }

    document.title = DEFAULT_TITLE
  }, [running, finished, remaining, total, config.label])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!finished || !shouldNotifyCompletionRef.current) return
    shouldNotifyCompletionRef.current = false
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Pomodoro complete', {
        body: 'Demo session finished. Jump back in or sign up to track progress.',
      })
    }
  }, [finished])

  useEffect(() => {
    return () => {
      if (typeof document !== 'undefined') {
        document.title = DEFAULT_TITLE
      }
    }
  }, [])

  const handlePlayPause = () => {
    if (finished) return
    setRunning((r) => !r)
  }

  const handleReset = () => {
    clearInterval(intervalRef.current!)
    setRunning(false)
    setFinished(false)
    setCompletionMessage('')
    setRemaining(config.seconds)
  }

  return (
    <div className="flex flex-col items-center gap-10">
      <AnimatePresence>
        {!(immersive && running) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="flex gap-2 rounded-2xl border border-white/10 bg-white/5 p-1.5 backdrop-blur-sm"
          >
            {(Object.keys(MODE_CONFIG) as Mode[]).map((m) => {
              const cfg = MODE_CONFIG[m]
              const active = mode === m
              return (
                <motion.button
                  key={m}
                  onClick={() => {
                    if (!running) {
                      setMode(m)
                      setRemaining(cfg.seconds)
                      setFinished(false)
                    }
                  }}
                  disabled={running}
                  whileHover={{ scale: running ? 1 : 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  className="relative flex flex-col items-center gap-0.5 rounded-xl px-5 py-2.5 text-sm font-[700] transition-all disabled:cursor-not-allowed"
                  style={
                    active
                      ? {
                          backgroundColor: `${cfg.color}22`,
                          color: cfg.color,
                          boxShadow: `0 0 18px ${cfg.color}30`,
                        }
                      : { color: 'rgba(226,232,240,0.82)' }
                  }
                >
                  <span>{cfg.label}</span>
                  <span className="text-[10px] font-[500] opacity-80">
                    {cfg.desc}
                  </span>
                  {active && (
                    <motion.div
                      layoutId="mode-pill"
                      className="absolute inset-0 rounded-xl border"
                      style={{ borderColor: `${cfg.color}40` }}
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                </motion.button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Task input */}
      <AnimatePresence>
        {!(immersive && running) && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="w-full max-w-sm"
          >
            <div className="relative flex items-center">
              <Timer className="absolute left-4 h-4 w-4 text-slate-300/70" />
              <input
                type="text"
                placeholder="What are you working on?"
                value={task}
                onChange={(e) => setTask(e.target.value)}
                maxLength={60}
                className="w-full rounded-xl border border-white/15 bg-white/8 py-3 pr-4 pl-11 text-[14px] text-slate-100 placeholder:text-slate-400/85 backdrop-blur-sm transition-colors focus:border-white/30 focus:ring-0 focus:outline-none"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="relative flex items-center justify-center">
        {/* Ambient glow */}
        <motion.div
          className="absolute rounded-full blur-[80px]"
          style={{
            width: isImmersiveRunning ? 300 : 220,
            height: isImmersiveRunning ? 300 : 220,
            backgroundColor: `${config.color}20`,
          }}
          animate={
            running
              ? { scale: [1, 1.2, 1], opacity: [0.4, 0.7, 0.4] }
              : { scale: 1, opacity: 0.3 }
          }
          transition={{ duration: 3, repeat: Infinity }}
        />

        <svg width={ringSize} height={ringSize} className="-rotate-90">
          {/* Track */}
          <circle
            cx={ringCenter}
            cy={ringCenter}
            r={ringRadius}
            fill="none"
            stroke="currentColor"
            strokeWidth={ringStroke}
            className="text-white/5"
          />
          {/* Progress */}
          <motion.circle
            cx={ringCenter}
            cy={ringCenter}
            r={ringRadius}
            fill="none"
            stroke={config.color}
            strokeWidth={ringStroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - progress)}
            style={{ filter: `drop-shadow(0 0 12px ${config.color}80)` }}
            transition={{ duration: 0.8, ease: 'linear' }}
          />
        </svg>

        {/* Center content */}
        <div className="absolute flex flex-col items-center gap-1">
          <AnimatePresence mode="wait">
            {finished ? (
              <motion.div
                key="done"
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.7, opacity: 0 }}
                className="flex flex-col items-center gap-2"
              >
                <CheckCircle2 className="h-12 w-12 text-emerald-400" />
                <span className="text-[14px] font-[700] text-emerald-400">
                  Done!
                </span>
              </motion.div>
            ) : (
              <motion.div
                key="time"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-1"
              >
                <span
                  className={`font-mono leading-none font-[900] tracking-[-0.06em] ${isImmersiveRunning ? 'text-[72px]' : 'text-[52px]'}`}
                  style={{ color: 'var(--color-foreground)' }}
                >
                  {formatTime(remaining)}
                </span>
                <span className="text-[11px] font-[600] tracking-widest text-slate-300/75 uppercase">
                  remaining
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* XP badge */}
      <AnimatePresence>
        {!(immersive && running) && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-[13px] font-[800]"
            style={{ backgroundColor: `${config.color}12`, color: config.color }}
          >
            <Zap className="h-3.5 w-3.5" />+{config.xp} XP on completion ·{' '}
            <span className="font-[500] opacity-70">sign up to track</span>
          </motion.div>
        )}
      </AnimatePresence>

      {!!completionMessage && (
        <div className="max-w-sm rounded-xl border border-white/15 bg-white/8 px-4 py-3 text-center text-[13px] text-slate-200">
          <p>{completionMessage}</p>
          <button
            className="mt-2 font-semibold text-cyan-300 transition hover:text-cyan-200"
            onClick={() => clerk.openSignUp()}
          >
            Sign up free
          </button>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center gap-4">
        {/* Reset */}
        <AnimatePresence>
          {!(immersive && running) && (
            <motion.button
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              onClick={handleReset}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/15 bg-white/8 backdrop-blur-sm transition-colors hover:bg-white/12"
            >
              <RotateCcw className="h-5 w-5 text-slate-200" />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Play / Pause */}
        <motion.button
          onClick={handlePlayPause}
          disabled={finished}
          whileHover={{ scale: finished ? 1 : 1.06 }}
          whileTap={{ scale: 0.94 }}
          className="flex h-16 w-36 items-center justify-center gap-2.5 rounded-2xl text-[16px] font-[800] text-white shadow-lg transition-all disabled:cursor-not-allowed disabled:opacity-40"
          style={{
            backgroundColor: config.color,
            boxShadow: `0 0 30px ${config.color}50`,
          }}
        >
          {running ? (
            <>
              <Pause className="h-5 w-5 fill-white" />
              Pause
            </>
          ) : (
            <>
              <Play className="h-5 w-5 translate-x-[2px] fill-white" />
              {finished ? 'Done' : remaining === total ? 'Start' : 'Resume'}
            </>
          )}
        </motion.button>
      </div>
    </div>
  )
}
