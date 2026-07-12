'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2 } from 'lucide-react'
import { formatClock } from '@/lib/format'
import { cn } from '@/lib/utils'

export type PomodoroDialSize = 'md' | 'lg' | 'xl'

const DIAL_METRICS: Record<
  PomodoroDialSize,
  {
    ringSize: number
    radius: number
    strokeWidth: number
    glowSize: number
    glowBlur: number
    digitClassName: string
  }
> = {
  md: {
    ringSize: 300,
    radius: 112,
    strokeWidth: 8,
    glowSize: 220,
    glowBlur: 65,
    digitClassName: 'text-[64px]',
  },
  lg: {
    ringSize: 400,
    radius: 148,
    strokeWidth: 11,
    glowSize: 300,
    glowBlur: 85,
    digitClassName: 'text-[88px]',
  },
  xl: {
    ringSize: 480,
    radius: 180,
    strokeWidth: 13,
    glowSize: 380,
    glowBlur: 100,
    digitClassName: 'text-[116px]',
  },
}

interface PomodoroDialProps {
  color: string
  progress: number
  remaining: number
  finished: boolean
  running?: boolean
  size?: PomodoroDialSize
  className?: string
}

export function PomodoroDial({
  color,
  progress,
  remaining,
  finished,
  running = false,
  size = 'md',
  className,
}: PomodoroDialProps) {
  const { ringSize, radius, strokeWidth, glowSize, glowBlur, digitClassName } =
    DIAL_METRICS[size]
  const center = ringSize / 2
  const circumference = 2 * Math.PI * radius

  return (
    <div className={cn('relative flex items-center justify-center', className)}>
      <motion.div
        className="absolute rounded-full"
        style={{
          width: glowSize,
          height: glowSize,
          filter: `blur(${glowBlur}px)`,
          backgroundColor: `${color}2a`,
        }}
        animate={
          finished
            ? { opacity: 0.4, scale: 1 }
            : running
              ? { opacity: [0.42, 0.8, 0.42], scale: [1, 1.09, 1] }
              : { opacity: 0.3, scale: 1 }
        }
        transition={{ duration: 2.8, repeat: Infinity }}
      />

      <svg width={ringSize} height={ringSize} className="-rotate-90">
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - progress)}
          style={{ filter: `drop-shadow(0 0 18px ${color}a6)` }}
          transition={{ duration: 0.8, ease: 'linear' }}
        />
      </svg>

      <div className="absolute text-center">
        <AnimatePresence mode="wait">
          {finished ? (
            <motion.div
              key="done"
              className="relative flex flex-col items-center gap-2"
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.7, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              <motion.div
                className="absolute -inset-10 rounded-full bg-emerald-400/20 blur-2xl"
                animate={{ scale: [1, 1.25, 1], opacity: [0.25, 0.55, 0.25] }}
                transition={{ duration: 1.6, repeat: Infinity }}
              />

              {Array.from({ length: 10 }).map((_, index) => {
                const angle = (index / 10) * Math.PI * 2
                const x = Math.cos(angle) * 46
                const y = Math.sin(angle) * 46
                return (
                  <motion.span
                    key={`done-particle-${index}`}
                    className="absolute h-1.5 w-1.5 rounded-full bg-emerald-300"
                    initial={{ x: 0, y: 0, opacity: 0.9, scale: 1 }}
                    animate={{ x, y, opacity: 0, scale: 0.7 }}
                    transition={{
                      duration: 0.9,
                      repeat: Infinity,
                      delay: index * 0.05,
                      ease: 'easeOut',
                    }}
                  />
                )
              })}

              <motion.div
                animate={{ scale: [1, 1.12, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <CheckCircle2 className="h-12 w-12 text-emerald-300" />
              </motion.div>
              <p className="text-sm font-bold text-emerald-200">
                Session Complete
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="time"
              className="flex flex-col items-center gap-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <p
                className={cn(
                  'font-mono leading-none font-black tracking-tight text-white',
                  digitClassName
                )}
              >
                {formatClock(remaining)}
              </p>
              <p className="mt-1 text-xs tracking-[0.2em] text-slate-500 uppercase">
                remaining
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
