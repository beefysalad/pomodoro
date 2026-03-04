'use client'

import { useState } from 'react'
import { Plus, BookOpen, X, Menu } from 'lucide-react'
import { useRouter, useParams } from 'next/navigation'
import { motion, AnimatePresence, Variants } from 'framer-motion'
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

function SubjectList({ onNavigate }: { onNavigate?: () => void }) {
  const router = useRouter()
  const params = useParams()
  const { data: subjects = [], isLoading } = useSubjects()
  const currentSubjectId = params.id as string

  return (
    <div className="flex h-full flex-col gap-8">
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <BookOpen className="text-violet-mid h-4 w-4" />
            <p className="text-foreground text-sm font-semibold">Subjects</p>
          </div>
          <motion.button
            onClick={() => {
              router.push('/dashboard/subjects/new')
              onNavigate?.()
            }}
            className="text-muted-foreground hover:text-violet-mid hover:bg-surface-up rounded-lg p-1.5 transition-all"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Add new subject"
          >
            <Plus className="h-4 w-4" />
          </motion.button>
        </div>

        {/* List */}
        <motion.div
          className="flex flex-col gap-2"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {isLoading ? (
            <div className="text-muted-foreground/60 px-4 py-3 text-center text-sm">
              Loading subjects...
            </div>
          ) : subjects.length === 0 ? (
            <div className="text-muted-foreground/50 px-4 py-3 text-center text-sm">
              No subjects yet
            </div>
          ) : (
            subjects.map((subject) => {
              const active = currentSubjectId === subject.id
              return (
                <motion.button
                  key={subject.id}
                  onClick={() => {
                    router.push(`/dashboard/subjects/${subject.id}`)
                    onNavigate?.()
                  }}
                  variants={itemVariants}
                  whileHover={{ x: 4 }}
                  className={`group relative flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-all ${
                    active
                      ? 'border-violet/30 bg-surface-hi border shadow-[0_0_16px_rgba(124,58,237,0.2)]'
                      : 'hover:border-border-up hover:bg-surface-up border border-transparent'
                  }`}
                >
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
                  <span
                    className={`truncate text-sm font-medium transition-colors ${
                      active
                        ? 'text-foreground'
                        : 'text-muted-foreground group-hover:text-foreground'
                    }`}
                  >
                    {subject.name}
                  </span>
                  {active && (
                    <div className="bg-violet-mid ml-auto h-2 w-2 rounded-full" />
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

// ── Desktop Sidebar ───────────────────────────────────────────────────────────
export function Sidebar() {
  return (
    <aside className="hidden h-full md:block">
      <SubjectList />
    </aside>
  )
}

// ── Mobile Sidebar Trigger (hamburger button for header) ──────────────────────
export function MobileSidebarTrigger({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      className="text-muted-foreground hover:text-foreground hover:bg-surface-up rounded-lg p-2 transition-all md:hidden"
      aria-label="Open subjects menu"
    >
      <Menu className="h-5 w-5" />
    </button>
  )
}

// ── Mobile Sidebar Drawer ─────────────────────────────────────────────────────
export function MobileSidebar({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            className="bg-background border-border fixed inset-y-0 left-0 z-50 w-72 border-r p-6 shadow-2xl md:hidden"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <div className="mb-6 flex items-center justify-between">
              <span className="text-foreground text-[18px] font-[800] tracking-[-0.03em]">
                tempo
              </span>
              <button
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground hover:bg-surface-up rounded-lg p-1.5 transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <SubjectList onNavigate={onClose} />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
