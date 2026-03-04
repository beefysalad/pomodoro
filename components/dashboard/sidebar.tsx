'use client'

import { Plus, BookOpen, Zap, Beaker, History } from 'lucide-react'
import { motion } from 'framer-motion'

interface Subject {
  id: string
  name: string
  icon: React.ReactNode
  active: boolean
  color: string
}

const SUBJECTS: Subject[] = [
  { id: '1', name: 'Mathematics', icon: <BookOpen className="w-4 h-4" />, active: true, color: 'violet-mid' },
  { id: '2', name: 'Physics', icon: <Zap className="w-4 h-4" />, active: false, color: 'blue-400' },
  { id: '3', name: 'Chemistry', icon: <Beaker className="w-4 h-4" />, active: false, color: 'success' },
  { id: '4', name: 'History', icon: <History className="w-4 h-4" />, active: false, color: 'amber' },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { type: 'spring', stiffness: 300, damping: 30 },
  },
}

export function Sidebar() {
  return (
    <div className="flex flex-col gap-6 h-full">
      {/* Subjects Section */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between px-2.5">
          <p className="text-muted-foreground/40 text-[9px] font-[700] tracking-[0.16em] uppercase">
            Subjects
          </p>
          <motion.button 
            className="text-muted-foreground/40 hover:text-violet-mid transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <Plus className="w-3.5 h-3.5" />
          </motion.button>
        </div>

        <motion.div 
          className="flex flex-col gap-1.5"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {SUBJECTS.map((subject) => (
            <motion.button
              key={subject.id}
              variants={itemVariants}
              whileHover={{ x: 4 }}
              className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[12px] font-[600] transition-all w-full text-left ${
                subject.active
                  ? 'border-violet/20 bg-violet/10 text-violet-mid border shadow-[0_0_12px_rgba(124,58,237,0.15)]'
                  : 'text-muted-foreground/60 hover:bg-surface-up hover:text-muted-foreground border border-transparent'
              }`}
            >
              <span className="flex-shrink-0">{subject.icon}</span>
              <span className="truncate">{subject.name}</span>
            </motion.button>
          ))}
        </motion.div>
      </div>

      {/* Streak Card */}
      <div className="mt-auto pt-4">
        <motion.div 
          className="border-streak/20 bg-gradient-to-br from-streak/10 to-streak/5 rounded-xl border p-4"
          whileHover={{ y: -2 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          <div className="flex items-center gap-2 mb-3">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-[16px]"
            >
              🔥
            </motion.div>
            <p className="text-streak text-[10px] font-[700] tracking-[0.08em] uppercase">
              7-Day Streak
            </p>
          </div>

          {/* Streak Dots */}
          <div className="flex gap-1.5 mb-3">
            {Array(7)
              .fill(0)
              .map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className={`flex-1 h-2.5 rounded-full ${
                    i < 4
                      ? 'bg-streak shadow-[0_0_8px_rgba(234,88,12,0.6)]'
                      : 'bg-surface-hi/40'
                  }`}
                />
              ))}
          </div>

          <p className="text-muted-foreground/60 text-[9px] font-[600] tracking-[0.08em] uppercase">
            4 consecutive days
          </p>
        </motion.div>
      </div>
    </div>
  )
}
