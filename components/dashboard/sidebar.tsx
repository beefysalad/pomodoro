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
      staggerChildren: 0.08,
      delayChildren: 0.15,
    },
  },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, x: -15 },
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
    <div className="flex h-full flex-col gap-8">
      {/* Subjects Section */}
      <div className="flex flex-col gap-4">
        {/* Header with Title and Add Button */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4.5 w-4.5 text-violet-mid" />
            <p className="text-foreground text-sm font-semibold">Subjects</p>
          </div>
          <motion.button
            onClick={() => router.push('/dashboard/subjects/new')}
            className="text-muted-foreground hover:text-violet-mid hover:bg-surface-up transition-all rounded-lg p-1.5"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Add new subject"
          >
            <Plus className="h-4 w-4" />
          </motion.button>
        </div>

        {/* Subjects List */}
        <motion.div
          className="flex flex-col gap-2"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {isLoading ? (
            <div className="text-muted-foreground/60 px-4 py-3 text-sm text-center">
              Loading subjects...
            </div>
          ) : subjects.length === 0 ? (
            <div className="text-muted-foreground/50 px-4 py-3 text-sm text-center">
              No subjects yet
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
                  whileHover={{ x: 6 }}
                  className={`group relative flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-all ${
                    active
                      ? 'bg-surface-hi border border-violet/30 shadow-[0_0_16px_rgba(124,58,237,0.2)]'
                      : 'hover:bg-surface-up border border-transparent hover:border-border-up'
                  }`}
                >
                  {/* Icon with color indicator */}
                  <div
                    className="flex-shrink-0 rounded-md p-1.5 transition-all"
                    style={{
                      backgroundColor: `${subject.color}20`,
                      borderLeft: `3px solid ${subject.color}`,
                    }}
                  >
                    <BookOpen
                      className="h-4 w-4"
                      style={{ color: subject.color }}
                    />
                  </div>

                  {/* Subject Name */}
                  <span className={`truncate font-medium text-sm transition-colors ${
                    active
                      ? 'text-foreground'
                      : 'text-muted-foreground group-hover:text-foreground'
                  }`}>
                    {subject.name}
                  </span>

                  {/* Active Indicator */}
                  {active && (
                    <div className="ml-auto h-2 w-2 rounded-full bg-violet-mid" />
                  )}
                </motion.button>
              )
            })
          )}
        </motion.div>
      </div>
    </div>
  )
}
