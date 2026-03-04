'use client'

import { Zap, Award, Target } from 'lucide-react'
import { motion } from 'framer-motion'

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
    icon: <Zap className="w-5 h-5" />,
    color: 'text-violet-mid',
    accentColor: 'from-violet/20 to-violet/5',
  },
  {
    label: 'Level',
    value: '12',
    icon: <Award className="w-5 h-5" />,
    color: 'text-amber',
    accentColor: 'from-amber/20 to-amber/5',
  },
  {
    label: 'Sessions',
    value: '84',
    icon: <Target className="w-5 h-5" />,
    color: 'text-success',
    accentColor: 'from-success/20 to-success/5',
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 30 },
  },
}

export function StatsGrid() {
  return (
    <motion.div 
      className="grid grid-cols-3 gap-3"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {STATS.map((stat) => (
        <motion.div
          key={stat.label}
          variants={itemVariants}
          whileHover={{ y: -4, transition: { type: 'spring', stiffness: 400, damping: 30 } }}
          className={`relative overflow-hidden border-border bg-surface rounded-xl border p-4 transition-all group cursor-pointer`}
        >
          {/* Gradient background on hover */}
          <div className={`absolute inset-0 bg-gradient-to-br ${stat.accentColor} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
          
          <div className="relative z-10">
            <motion.div 
              className={`mb-3 w-fit p-2 rounded-lg bg-gradient-to-br ${stat.accentColor}`}
              whileHover={{ scale: 1.1 }}
            >
              <div className={`${stat.color}`}>
                {stat.icon}
              </div>
            </motion.div>
            
            <div className={`text-2xl font-[800] tracking-[-0.02em] mb-1 ${stat.color}`}>
              {stat.value}
            </div>
            <div className="text-muted-foreground/40 text-[9px] font-[600] tracking-[0.08em] uppercase">
              {stat.label}
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  )
}
