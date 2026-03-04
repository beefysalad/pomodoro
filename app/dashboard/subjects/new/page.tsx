'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { BookOpen, Zap, Beaker, History, ArrowLeft, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'

const SUBJECT_ICONS = [
  { id: 'math', name: 'Mathematics', icon: <BookOpen className="w-6 h-6" />, color: 'violet-mid' },
  { id: 'physics', name: 'Physics', icon: <Zap className="w-6 h-6" />, color: 'blue-400' },
  { id: 'chemistry', name: 'Chemistry', icon: <Beaker className="w-6 h-6" />, color: 'success' },
  { id: 'history', name: 'History', icon: <History className="w-6 h-6" />, color: 'amber' },
]

export default function NewSubjectPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [selectedIcon, setSelectedIcon] = useState('math')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    // TODO: Wire up to actual API
    await new Promise(resolve => setTimeout(resolve, 800))
    router.push('/dashboard')
  }

  return (
    <div className="bg-background min-h-screen flex flex-col">
      {/* Header */}
      <div className="border-border border-b sticky top-0 z-50 bg-background/80 backdrop-blur-md">
        <div className="flex items-center justify-between px-6 py-4">
          <motion.button
            onClick={() => router.back()}
            className="text-muted-foreground hover:text-foreground transition-colors"
            whileHover={{ x: -4 }}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft className="w-5 h-5" />
          </motion.button>
          <span className="text-foreground text-[18px] font-[800] tracking-[-0.03em]">
            Tempo
          </span>
          <div className="w-5" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div 
          className="w-full max-w-2xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          {/* Hero Section */}
          <div className="mb-12 text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 300 }}
              className="flex items-center justify-center gap-2 mb-4"
            >
              <Sparkles className="w-6 h-6 text-violet-mid" />
              <h1 className="text-foreground text-4xl font-[800] tracking-[-0.03em]">
                New Subject
              </h1>
            </motion.div>
            <motion.p 
              className="text-muted-foreground/60 text-[14px] font-[500]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              Create a new study subject to organize your learning
            </motion.p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Name Input */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="relative"
            >
              <label className="block text-foreground text-[12px] font-[700] tracking-[0.04em] uppercase mb-3">
                Subject Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Advanced Calculus"
                className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-violet-mid focus:ring-1 focus:ring-violet-mid/30 transition-all text-[14px]"
              />
            </motion.div>

            {/* Icon Selection */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <label className="block text-foreground text-[12px] font-[700] tracking-[0.04em] uppercase mb-4">
                Choose Icon
              </label>
              <div className="grid grid-cols-4 gap-3">
                {SUBJECT_ICONS.map((icon, idx) => (
                  <motion.button
                    key={icon.id}
                    type="button"
                    onClick={() => setSelectedIcon(icon.id)}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.35 + idx * 0.05 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-2 ${
                      selectedIcon === icon.id
                        ? 'border-violet-mid bg-violet/10 text-violet-mid shadow-[0_0_12px_rgba(124,58,237,0.3)]'
                        : 'border-border bg-surface hover:border-border-up text-muted-foreground'
                    }`}
                  >
                    <div className="text-[24px]">{icon.icon}</div>
                    <span className="text-[10px] font-[600] text-center">{icon.name}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex gap-3 pt-4"
            >
              <motion.button
                type="button"
                onClick={() => router.back()}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 border border-border rounded-xl px-6 py-3 text-[12px] font-[700] text-muted-foreground hover:text-foreground hover:border-border-up transition-all"
              >
                Cancel
              </motion.button>
              <motion.button
                type="submit"
                disabled={!name.trim() || isSubmitting}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 bg-violet border border-violet rounded-xl px-6 py-3 text-[12px] font-[700] text-white shadow-[0_0_20px_var(--color-violet-glow)] hover:shadow-[0_0_30px_var(--color-violet-glow)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      <Sparkles className="w-4 h-4" />
                    </motion.div>
                    Creating...
                  </>
                ) : (
                  'Create Subject'
                )}
              </motion.button>
            </motion.div>
          </form>
        </motion.div>
      </div>
    </div>
  )
}
