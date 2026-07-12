'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { Pause, Play, RotateCcw, Zap, Timer } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useClerk } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PomodoroDial } from '@/components/timer/pomodoro-dial'
import {
  TIMER_MODES,
  TIMER_MODE_ORDER,
  getTimerModeSeconds,
  type TimerMode as Mode,
} from '@/lib/timer-modes'
import { formatClock } from '@/lib/format'

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
  const [remaining, setRemaining] = useState(getTimerModeSeconds('focus'))
  const [running, setRunning] = useState(false)
  const [finished, setFinished] = useState(false)
  const [completionMessage, setCompletionMessage] = useState('')
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const shouldNotifyCompletionRef = useRef(false)
  const deadlineRef = useRef<number | null>(null)
  const remainingRef = useRef(remaining)
  const completionAudioRef = useRef<HTMLAudioElement | null>(null)

  const config = TIMER_MODES[mode]
  const total = getTimerModeSeconds(mode)
  const progress = 1 - remaining / total
  const isImmersiveRunning = immersive && running

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
    if (
      running &&
      'Notification' in window &&
      Notification.permission === 'default'
    ) {
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
      document.title = `⏱ ${formatClock(Math.max(0, remaining))} · ${config.label} · ${DEFAULT_TITLE}`
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
    const audio = new Audio('/timer.wav')
    audio.loop = true
    completionAudioRef.current = audio
    void audio.play().catch(() => undefined)
  }, [finished])

  useEffect(() => {
    if (finished) return
    if (!completionAudioRef.current) return
    completionAudioRef.current.pause()
    completionAudioRef.current = null
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
    setRemaining(getTimerModeSeconds(mode))
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
            className="flex gap-1 rounded-full border border-white/10 bg-white/5 p-1.5 backdrop-blur-sm"
          >
            {TIMER_MODE_ORDER.map((m) => {
              const cfg = TIMER_MODES[m]
              const active = mode === m
              return (
                <motion.button
                  key={m}
                  onClick={() => {
                    if (!running) {
                      setMode(m)
                      setRemaining(getTimerModeSeconds(m))
                      setFinished(false)
                    }
                  }}
                  disabled={running}
                  whileHover={{ scale: running ? 1 : 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  className="relative flex flex-col items-center gap-0.5 rounded-full px-6 py-3 text-sm font-[700] transition-all disabled:cursor-not-allowed"
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
                    {cfg.describeDuration(cfg.defaultMinutes)}
                  </span>
                  {active && (
                    <motion.div
                      layoutId="mode-pill"
                      className="absolute inset-0 rounded-full border"
                      style={{ borderColor: `${cfg.color}40` }}
                      transition={{
                        type: 'spring',
                        stiffness: 400,
                        damping: 30,
                      }}
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
              <Input
                type="text"
                placeholder="What are you working on?"
                value={task}
                onChange={(e) => setTask(e.target.value)}
                maxLength={60}
                className="h-auto w-full rounded-xl border-white/15 bg-white/8 py-3 pr-4 pl-11 text-[14px] text-slate-100 backdrop-blur-sm placeholder:text-slate-400/85 focus-visible:border-white/30 focus-visible:ring-0"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <PomodoroDial
        color={config.color}
        progress={progress}
        remaining={remaining}
        finished={finished}
        running={running}
        size={isImmersiveRunning ? 'xl' : 'md'}
      />

      {/* XP badge */}
      <AnimatePresence>
        {!(immersive && running) && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-[13px] font-[800]"
            style={{
              backgroundColor: `${config.color}12`,
              color: config.color,
            }}
          >
            <Zap className="h-3.5 w-3.5" />+{config.xp} XP on completion ·{' '}
            <span className="font-[500] opacity-70">sign up to track</span>
          </motion.div>
        )}
      </AnimatePresence>

      {!!completionMessage && (
        <div className="max-w-sm rounded-xl border border-white/15 bg-white/8 px-4 py-3 text-center text-[13px] text-slate-200">
          <p>{completionMessage}</p>
          <Button
            variant="link"
            className="mt-2 h-auto p-0 font-semibold text-cyan-300 hover:text-cyan-200"
            onClick={() => clerk.openSignUp()}
          >
            Sign up free
          </Button>
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
              aria-label="Reset"
              className="flex h-14 w-14 items-center justify-center rounded-full border border-white/15 bg-white/8 backdrop-blur-sm transition-colors hover:bg-white/12"
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
          className="flex h-16 w-36 items-center justify-center gap-2.5 rounded-full text-[16px] font-[800] text-white shadow-lg transition-all disabled:cursor-not-allowed disabled:opacity-40"
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
