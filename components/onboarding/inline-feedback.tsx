'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2 } from 'lucide-react'

interface InlineFeedbackProps {
  show: boolean
  label: string
}

export function InlineFeedback({ show, label }: InlineFeedbackProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.85, y: -4 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300"
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          {label}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
