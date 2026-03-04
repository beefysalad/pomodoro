'use client'

import { Zap, Award, Target, Flame } from 'lucide-react'
import { motion, Variants } from 'framer-motion'

interface StatCard {
  label: string
  value: string
  icon: React.ReactNode
  color: string
  accentColor: string
}

const STATS: StatCard[] = [
  {
    label: 'Total XP',
    value: '2,840',
    icon: <Zap className="h-5 w-5" />,
    color: 'text-violet-mid',
    accentColor: 'from-violet/20 to-violet/5',
  },
  {
    label: 'Level',
    value: '12',
    icon: <Award className="h-5 w-5" />,
    color: 'text-amber',
    accentColor: 'from-amber/20 to-amber/5',
  },
  {
    label: 'Sessions',
    value: '84',
    icon: <Target className="h-5 w-5" />,
    color: 'text-success',
    accentColor: 'from-success/20 to-success/5',
  },
]

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 30 },
  },
}

export function StatsGrid() {
  return (
    <div className="flex flex-col gap-4">
      <motion.div
        className="grid grid-cols-2 gap-3 sm:grid-cols-3"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {STATS.map((stat) => (
          <motion.div
            key={stat.label}
            variants={itemVariants}
            whileHover={{
              y: -4,
              transition: { type: 'spring', stiffness: 400, damping: 30 },
            }}
            className={`border-border bg-surface group relative cursor-pointer overflow-hidden rounded-xl border p-4 transition-all`}
          >
            {/* Gradient background on hover */}
            <div
              className={`absolute inset-0 bg-gradient-to-br ${stat.accentColor} opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
            />

            <div className="relative z-10">
              <motion.div
                className={`mb-3 w-fit rounded-lg bg-gradient-to-br p-2 ${stat.accentColor}`}
                whileHover={{ scale: 1.1 }}
              >
                <div className={`${stat.color}`}>{stat.icon}</div>
              </motion.div>

              <div
                className={`mb-1 text-2xl font-[800] tracking-[-0.02em] ${stat.color}`}
              >
                {stat.value}
              </div>
              <div className="text-muted-foreground/40 text-[9px] font-[600] tracking-[0.08em] uppercase">
                {stat.label}
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Streak Section */}
      <motion.div
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.5 }}
        className="border-streak/20 from-streak/10 to-streak/5 relative overflow-hidden rounded-xl border bg-gradient-to-br p-5"
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="mb-3 flex items-center gap-2">
              <motion.div
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Flame className="text-streak h-5 w-5" />
              </motion.div>
              <p className="text-streak text-[12px] font-[700] tracking-[-0.02em]">
                7-Day Streak
              </p>
            </div>
            <p className="text-foreground text-[24px] font-[800] tracking-[-0.02em]">
              4 days
            </p>
            <p className="text-muted-foreground/60 mt-1 text-[10px] font-[600] tracking-[0.08em] uppercase">
              Keep it going
            </p>
          </div>

          {/* Streak Dots */}
          <div className="ml-4 flex gap-1.5">
            {Array(7)
              .fill(0)
              .map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5 + i * 0.05 }}
                  className={`h-3 w-3 rounded-full ${
                    i < 4
                      ? 'bg-streak shadow-[0_0_8px_rgba(234,88,12,0.6)]'
                      : 'bg-surface-hi/40'
                  }`}
                />
              ))}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
