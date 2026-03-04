'use client'

import { motion } from 'framer-motion'
import XpBar from '../landing/xp-bar'

export function XpLevelBar() {
  return (
    <motion.div 
      className="border-border bg-gradient-to-br from-surface to-surface-up/50 rounded-xl border p-5"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, type: 'spring', stiffness: 300, damping: 30 }}
      whileHover={{ border: 'var(--color-border-up)' }}
    >
      <div className="mb-4 flex items-center justify-between">
        <motion.span 
          className="text-violet-mid text-[11px] font-[700] tracking-[0.04em] uppercase"
          whileHover={{ scale: 1.05 }}
        >
          Level 12
        </motion.span>
        <motion.span 
          className="text-muted-foreground font-mono text-[10px] font-[600]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          840 / 1000 XP
        </motion.span>
      </div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.55 }}
      >
        <XpBar value={84} delay={0.4} />
      </motion.div>
    </motion.div>
  )
}
