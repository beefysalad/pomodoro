'use client'

import { Plus, BookOpen } from 'lucide-react'
import { useRouter, useParams } from 'next/navigation'
import { motion, Variants } from 'framer-motion'
import { useSubjects } from '@/hooks/use-subjects'

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, x: -10 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { type: 'spring', stiffness: 300, damping: 30 },
  },
}

export function Sidebar() {
  const router = useRouter()
  const params = useParams()
  const { data: subjects = [], isLoading } = useSubjects()

  const currentSubjectId = params.id as string

  return (
    <div className="flex h-full flex-col gap-6">
      {/* Subjects Section */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between px-2.5">
          <p className="text-muted-foreground/40 text-[9px] font-[700] tracking-[0.16em] uppercase">
            Subjects
          </p>
          <motion.button
            onClick={() => router.push('/dashboard/subjects/new')}
            className="text-muted-foreground/40 hover:text-violet-mid transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <Plus className="h-3.5 w-3.5" />
          </motion.button>
        </div>

        <motion.div
          className="flex flex-col gap-1.5"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {isLoading ? (
            <div className="text-muted-foreground/60 px-3 py-2.5 text-[12px]">
              Loading...
            </div>
          ) : (
            subjects.map((subject) => {
              const active = currentSubjectId === subject.id
              return (
                <motion.button
                  key={subject.id}
                  onClick={() =>
                    router.push(`/dashboard/subjects/${subject.id}`)
                  }
                  variants={itemVariants}
                  whileHover={{ x: 4 }}
                  className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[12px] font-[600] transition-all ${
                    active
                      ? 'border-violet/20 bg-violet/10 text-violet-mid border shadow-[0_0_12px_rgba(124,58,237,0.15)]'
                      : 'text-muted-foreground/60 hover:bg-surface-up hover:text-muted-foreground border border-transparent'
                  }`}
                >
                  <span className="flex-shrink-0">
                    <BookOpen
                      className="h-4 w-4"
                      style={{ color: subject.color }}
                    />
                  </span>
                  <span className="truncate">{subject.name}</span>
                </motion.button>
              )
            })
          )}
        </motion.div>
      </div>
    </div>
  )
}
