'use client'

import { useState } from 'react'
import { Zap, Target, Microscope } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import XpBar from '../landing/xp-bar'

interface TimerMode {
  id: string
  label: string
  icon: React.ReactNode
  duration: string
  xp: number
  description: string
}

const TIMER_MODES: TimerMode[] = [
  {
    id: 'blitz',
    label: 'Blitz',
    icon: <Zap className="h-4 w-4" />,
    duration: '10:00',
    xp: 10,
    description: 'Quick burst',
  },
  {
    id: 'focus',
    label: 'Focus',
    icon: <Target className="h-4 w-4" />,
    duration: '25:00',
    xp: 25,
    description: 'Standard session',
  },
  {
    id: 'deep',
    label: 'Deep',
    icon: <Microscope className="h-4 w-4" />,
    duration: '50:00',
    xp: 50,
    description: 'Long dive',
  },
]

export function TimerSection() {
  const [activeMode, setActiveMode] = useState('focus')
  const currentMode = TIMER_MODES.find((m) => m.id === activeMode)!

  return (
    <motion.div
      className="border-violet/20 from-violet/[0.08] relative flex flex-col items-center gap-6 overflow-hidden rounded-2xl border bg-gradient-to-br to-indigo-500/[0.04] p-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, type: 'spring', stiffness: 300, damping: 30 }}
    >
      {/* Animated background accent */}
      <motion.div
        className="bg-violet/10 absolute -top-20 -right-20 h-40 w-40 rounded-full blur-3xl"
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 4, repeat: Infinity }}
      />

      {/* Mode Selector */}
      <div className="relative z-10 flex gap-2">
        {TIMER_MODES.map((mode) => (
          <motion.button
            key={mode.id}
            onClick={() => setActiveMode(mode.id)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-[11px] font-[700] tracking-[0.04em] transition-all ${
              activeMode === mode.id
                ? 'border-violet-mid/40 bg-violet/20 text-violet-mid border shadow-[0_0_12px_var(--color-violet-glow)]'
                : 'border-border text-muted-foreground hover:border-violet/40 hover:text-foreground border'
            }`}
          >
            {mode.icon}
            {mode.label}
          </motion.button>
        ))}
      </div>

      {/* Mode Description */}
      <motion.p
        key={`desc-${activeMode}`}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="text-muted-foreground/60 relative z-10 text-[10px] font-[500] tracking-[0.05em] uppercase"
      >
        {currentMode.description}
      </motion.p>

      {/* Timer Display */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeMode}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="text-foreground relative z-10 font-mono text-[64px] leading-none font-[900] tracking-[-0.06em] md:text-[72px]"
        >
          {currentMode.duration}
        </motion.div>
      </AnimatePresence>

      {/* XP Progress */}
      <motion.div
        className="relative z-10 w-full max-w-[240px]"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <XpBar value={0} />
      </motion.div>

      {/* Start Button with XP Info */}
      <motion.div
        className="relative z-10 flex w-full flex-col items-center gap-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <motion.button
          className="border-violet bg-violet cursor-pointer rounded-xl border px-8 py-3 text-[12px] font-[700] text-white shadow-[0_0_20px_var(--color-violet-glow)] transition-all"
          whileHover={{
            boxShadow: '0px 0px 30px var(--color-violet-glow)',
            y: -2,
          }}
          whileTap={{ scale: 0.98 }}
        >
          Start Session →
        </motion.button>
        <motion.p
          className="text-muted-foreground/60 text-[10px] font-[600]"
          key={`xp-${activeMode}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          Earn <span className="text-amber font-[700]">{currentMode.xp}</span>{' '}
          XP
        </motion.p>
      </motion.div>
    </motion.div>
  )
}
