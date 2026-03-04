'use client'

import { FolderPlus, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'

export function EmptyState() {
  const router = useRouter()

  return (
    <div className="flex h-full min-h-[500px] w-full items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{
          duration: 0.5,
          type: 'spring',
          stiffness: 300,
          damping: 25,
        }}
        className="border-border/40 bg-surface/50 flex max-w-md flex-col items-center justify-center rounded-2xl border p-8 text-center"
      >
        <div className="relative mb-6">
          <motion.div
            className="bg-violet/20 absolute -inset-4 rounded-full blur-xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 0.8, 0.5],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          <div className="border-violet/30 from-violet/20 to-violet/5 relative flex h-20 w-20 items-center justify-center rounded-2xl border bg-gradient-to-br shadow-[0_0_30px_var(--color-violet-glow)]">
            <FolderPlus className="text-violet h-10 w-10" />
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
              className="absolute -top-2 -right-2"
            >
              <Sparkles className="text-amber h-5 w-5" />
            </motion.div>
          </div>
        </div>

        <h2 className="text-foreground mb-2 text-[24px] font-[800] tracking-[-0.03em]">
          Welcome to Tempo!
        </h2>
        <p className="text-muted-foreground/80 mb-8 text-[14px] leading-relaxed font-[500] tracking-[-0.01em]">
          Your workspace is empty right now. Get started by creating your first
          subject to organize your study sessions, topics, and track your
          progress over time.
        </p>

        <motion.button
          onClick={() => router.push('/dashboard/subjects/new')}
          whileHover={{
            scale: 1.05,
            boxShadow: '0px 0px 30px var(--color-violet-glow)',
          }}
          whileTap={{ scale: 0.95 }}
          className="group border-violet bg-violet relative flex items-center gap-2 overflow-hidden rounded-xl border px-6 py-3 font-[700] tracking-[0.02em] text-white shadow-[0_0_20px_var(--color-violet-glow)] transition-all"
        >
          <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-[shimmer_1.5s_infinite]" />
          <FolderPlus className="h-4 w-4" />
          <span>Create First Subject</span>
        </motion.button>
      </motion.div>
    </div>
  )
}
