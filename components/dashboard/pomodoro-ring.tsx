import { motion } from 'framer-motion'
import { CheckCircle2 } from 'lucide-react'
import { formatClock } from '@/lib/format'

interface PomodoroRingProps {
  color: string
  finished: boolean
  progress: number
  remaining: number
  large?: boolean
}

export function PomodoroRing({
  color,
  finished,
  progress,
  remaining,
  large = false,
}: PomodoroRingProps) {
  const size = large ? 420 : 340
  const center = size / 2
  const radius = large ? 158 : 126
  const circumference = 2 * Math.PI * radius
  const strokeWidth = large ? 12 : 10

  return (
    <div className="relative flex items-center justify-center">
      <motion.div
        className={`absolute rounded-full ${large ? 'h-[320px] w-[320px] blur-[95px]' : 'h-[240px] w-[240px] blur-[78px]'}`}
        style={{ background: `${color}2a` }}
        animate={
          finished
            ? { opacity: 0.4, scale: 1 }
            : { opacity: [0.42, 0.8, 0.42], scale: [1, 1.09, 1] }
        }
        transition={{ duration: 2.8, repeat: Infinity }}
      />

      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={strokeWidth}
        />
        <circle
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
        />
      </svg>

      <div className="absolute text-center">
        {finished ? (
          <motion.div
            className="relative flex flex-col items-center gap-2"
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
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
          <>
            <p
              className={`font-mono font-black tracking-tight text-white ${large ? 'text-8xl' : 'text-6xl sm:text-7xl'}`}
            >
              {formatClock(remaining)}
            </p>
            <p className="mt-1 text-xs tracking-[0.2em] text-slate-500 uppercase">
              remaining
            </p>
          </>
        )}
      </div>
    </div>
  )
}
