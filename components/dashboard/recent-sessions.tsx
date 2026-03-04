'use client'

import { Star, Clock, Zap, BookOpen } from 'lucide-react'
import { motion } from 'framer-motion'

interface Session {
  id: string
  subject: string
  topic: string
  icon: React.ReactNode
  duration: string
  xp: number
  rating: number
  date: string
}

const RECENT_SESSIONS: Session[] = [
  {
    id: '1',
    subject: 'Mathematics',
    topic: 'Calculus - Integrals',
    icon: <BookOpen className="w-4 h-4" />,
    duration: '25m',
    xp: 25,
    rating: 3,
    date: 'Today, 2:30 PM',
  },
  {
    id: '2',
    subject: 'Physics',
    topic: 'Quantum Mechanics',
    icon: <Zap className="w-4 h-4" />,
    duration: '50m',
    xp: 50,
    rating: 2,
    date: 'Today, 10:00 AM',
  },
  {
    id: '3',
    subject: 'Chemistry',
    topic: 'Organic Reactions',
    icon: <BookOpen className="w-4 h-4" />,
    duration: '25m',
    xp: 25,
    rating: 3,
    date: 'Yesterday, 4:15 PM',
  },
  {
    id: '4',
    subject: 'History',
    topic: 'World War II',
    icon: <BookOpen className="w-4 h-4" />,
    duration: '10m',
    xp: 10,
    rating: 2,
    date: 'Yesterday, 3:00 PM',
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.5,
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

export function RecentSessions() {
  return (
    <motion.div 
      className="border-border bg-surface rounded-2xl border p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, type: 'spring', stiffness: 300, damping: 30 }}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-foreground text-[14px] font-[700] tracking-[-0.02em]">
          Recent Sessions
        </h2>
        <motion.button 
          className="text-violet-mid text-[11px] font-[700] hover:text-violet transition-colors"
          whileHover={{ x: 2 }}
        >
          View all →
        </motion.button>
      </div>

      <motion.div 
        className="space-y-2"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {RECENT_SESSIONS.map((session) => (
          <motion.div
            key={session.id}
            variants={itemVariants}
            whileHover={{ x: 4, backgroundColor: 'var(--color-surface-up)' }}
            className="flex items-center justify-between p-3.5 rounded-xl bg-surface-up/50 transition-all cursor-pointer group"
          >
            {/* Left side - Session info */}
            <div className="flex items-center gap-3.5 flex-1 min-w-0">
              <motion.div 
                className="w-8 h-8 rounded-lg bg-violet/10 flex items-center justify-center flex-shrink-0 text-violet-mid"
                whileHover={{ scale: 1.1, rotate: 5 }}
              >
                {session.icon}
              </motion.div>
              <div className="flex-1 min-w-0">
                <p className="text-foreground text-[12px] font-[600] truncate">
                  {session.topic}
                </p>
                <p className="text-muted-foreground/60 text-[10px] truncate">
                  {session.date}
                </p>
              </div>
            </div>

            {/* Right side - Stats */}
            <div className="flex items-center gap-5 ml-4">
              {/* Duration */}
              <motion.div 
                className="text-right"
                whileHover={{ scale: 1.05 }}
              >
                <p className="text-text-sub text-[11px] font-[700] text-nowrap flex items-center gap-1">
                  <Clock className="w-3 h-3 opacity-60" />
                  {session.duration}
                </p>
              </motion.div>

              {/* XP */}
              <motion.div 
                className="text-right"
                whileHover={{ scale: 1.05 }}
              >
                <p className="text-amber text-[11px] font-[700] text-nowrap flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  +{session.xp}
                </p>
              </motion.div>

              {/* Rating */}
              <motion.div className="text-right flex gap-0.5">
                {Array(3)
                  .fill(0)
                  .map((_, i) => (
                    <motion.div
                      key={i}
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      {i < session.rating ? (
                        <Star className="w-3.5 h-3.5 fill-amber text-amber" />
                      ) : (
                        <Star className="w-3.5 h-3.5 text-muted-foreground/30" />
                      )}
                    </motion.div>
                  ))}
              </motion.div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  )
}
