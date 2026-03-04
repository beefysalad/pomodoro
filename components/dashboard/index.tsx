'use client'

import { useState } from 'react'
import { Sidebar, MobileSidebar, MobileSidebarTrigger } from './sidebar'
import { useSubjects } from '@/hooks/use-subjects'
import { useUser } from '@/hooks/use-user'
import { OnboardingWizard } from './onboarding-wizard'
import { EmptyState } from './empty-state'
import { motion } from 'framer-motion'
import {
  BookOpen,
  Plus,
  Zap,
  Flame,
  BarChart2,
  Clock,
  Star,
  Award,
  Target,
  Microscope,
  ChevronRight,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { XpLevelBar } from './xp-level-bar'

interface StatPillProps {
  icon: React.ReactNode
  label: string
  value: string
  color: string
}
function StatPill({ icon, label, value, color }: StatPillProps) {
  return (
    <div className="border-border bg-surface flex items-center gap-3 rounded-2xl border px-4 py-3">
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
        style={{ backgroundColor: `${color}18` }}
      >
        <div style={{ color }}>{icon}</div>
      </div>
      <div>
        <p className="text-foreground text-[17px] leading-none font-[800] tracking-tight">
          {value}
        </p>
        <p className="text-muted-foreground/50 mt-0.5 text-[11px] font-[600]">
          {label}
        </p>
      </div>
    </div>
  )
}

interface SessionRowProps {
  topic: string
  subject: string
  mode: string
  xp: number
  rating: number
  time: string
}
function SessionRow({
  topic,
  subject,
  mode,
  xp,
  rating,
  time,
}: SessionRowProps) {
  const modeColor =
    mode === 'blitz' ? '#f59e0b' : mode === 'focus' ? '#7c3aed' : '#06b6d4'
  return (
    <div className="flex items-center gap-4 py-3.5">
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[10px] font-[800] text-white uppercase"
        style={{ backgroundColor: `${modeColor}20`, color: modeColor }}
      >
        {mode.slice(0, 1)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-foreground truncate text-[13px] font-[700]">
          {topic}
        </p>
        <p className="text-muted-foreground/50 text-[11px]">
          {subject} · {time}
        </p>
      </div>
      <div className="flex items-center gap-3 text-right">
        <span className="text-amber text-[12px] font-[800]">+{xp}</span>
        <div className="flex gap-0.5">
          {Array(3)
            .fill(0)
            .map((_, i) => (
              <Star
                key={i}
                className={`h-3 w-3 ${i < rating ? 'fill-amber text-amber' : 'text-muted-foreground/20'}`}
              />
            ))}
        </div>
      </div>
    </div>
  )
}

// ── Main dashboard content ──────────────────────────────────────────────────
function DashboardContent() {
  const router = useRouter()
  const { data: subjects = [] } = useSubjects()

  const MOCK_SESSIONS = [
    {
      id: '1',
      topic: 'Calculus – Integrals',
      subject: 'Mathematics',
      mode: 'focus',
      xp: 25,
      rating: 3,
      time: '2h ago',
    },
    {
      id: '2',
      topic: 'Quantum Mechanics',
      subject: 'Physics',
      mode: 'deep',
      xp: 50,
      rating: 2,
      time: 'Yesterday',
    },
    {
      id: '3',
      topic: 'Organic Reactions',
      subject: 'Chemistry',
      mode: 'blitz',
      xp: 10,
      rating: 3,
      time: 'Yesterday',
    },
  ]

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* ── Greeting + XP ───────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4"
      >
        <div>
          <h1 className="text-foreground text-[26px] font-[900] tracking-[-0.03em] md:text-[30px]">
            Your workspace
          </h1>
          <p className="text-muted-foreground/60 mt-1 text-[13px] font-[500]">
            Pick up where you left off
          </p>
        </div>
        <XpLevelBar />
      </motion.div>

      {/* ── Stats row ───────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.06 }}
        className="grid grid-cols-2 gap-3 sm:grid-cols-4"
      >
        <StatPill
          icon={<Zap className="h-4 w-4" />}
          label="Total XP"
          value="2,840"
          color="#7c3aed"
        />
        <StatPill
          icon={<Award className="h-4 w-4" />}
          label="Level"
          value="12"
          color="#f59e0b"
        />
        <StatPill
          icon={<BarChart2 className="h-4 w-4" />}
          label="Sessions"
          value="84"
          color="#22c55e"
        />
        <StatPill
          icon={<Flame className="h-4 w-4" />}
          label="Streak"
          value="4 days"
          color="#ea580c"
        />
      </motion.div>

      {/* ── Subjects ────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col gap-3"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-foreground text-[13px] font-[800] tracking-[0.06em] uppercase opacity-60">
            Subjects
          </h2>
          <button
            onClick={() => router.push('/dashboard/subjects/new')}
            className="text-violet flex items-center gap-1 text-[12px] font-[700] transition-opacity hover:opacity-80"
          >
            <Plus className="h-3.5 w-3.5" />
            New
          </button>
        </div>

        <div className="bg-surface border-border overflow-hidden rounded-2xl border">
          {subjects.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <div className="bg-violet/10 flex h-12 w-12 items-center justify-center rounded-2xl">
                <BookOpen className="text-violet h-6 w-6" />
              </div>
              <p className="text-muted-foreground/60 text-[13px]">
                No subjects yet
              </p>
              <button
                onClick={() => router.push('/dashboard/subjects/new')}
                className="text-violet text-[12px] font-[700] underline-offset-2 hover:underline"
              >
                Add your first subject →
              </button>
            </div>
          ) : (
            <div className="divide-border divide-y">
              {subjects.map((subject) => (
                <motion.button
                  key={subject.id}
                  onClick={() =>
                    router.push(`/dashboard/subjects/${subject.id}`)
                  }
                  whileHover={{ x: 4 }}
                  className="hover:bg-surface-up flex w-full items-center gap-4 px-5 py-4 text-left transition-all"
                >
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                    style={{ backgroundColor: `${subject.color}18` }}
                  >
                    <BookOpen
                      className="h-5 w-5"
                      style={{ color: subject.color }}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-foreground truncate text-[14px] font-[700]">
                      {subject.name}
                    </p>
                  </div>
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: subject.color }}
                  />
                  <ChevronRight className="text-muted-foreground/30 h-4 w-4" />
                </motion.button>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* ── Quick start timer ────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.14 }}
        className="flex flex-col gap-3"
      >
        <h2 className="text-foreground text-[13px] font-[800] tracking-[0.06em] uppercase opacity-60">
          Quick Start
        </h2>
        <div className="grid grid-cols-3 gap-3">
          {[
            {
              id: 'blitz',
              label: 'Blitz',
              sub: '10 min · +10 XP',
              Icon: Zap,
              color: '#f59e0b',
            },
            {
              id: 'focus',
              label: 'Focus',
              sub: '25 min · +25 XP',
              Icon: Target,
              color: '#7c3aed',
            },
            {
              id: 'deep',
              label: 'Deep',
              sub: '50 min · +50 XP',
              Icon: Microscope,
              color: '#06b6d4',
            },
          ].map(({ id, label, sub, Icon, color }) => (
            <motion.button
              key={id}
              onClick={() => router.push('/dashboard/subjects/new')}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.97 }}
              className="border-border bg-surface flex flex-col items-center gap-2.5 rounded-2xl border p-4 text-center transition-all hover:shadow-lg"
              style={{ '--accent': color } as React.CSSProperties}
            >
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ backgroundColor: `${color}18` }}
              >
                <Icon className="h-5 w-5" style={{ color }} />
              </div>
              <div>
                <p className="text-foreground text-[13px] font-[800]">
                  {label}
                </p>
                <p className="text-muted-foreground/50 text-[10px] font-[600]">
                  {sub}
                </p>
              </div>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* ── Recent Sessions ──────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18 }}
        className="flex flex-col gap-3"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-foreground text-[13px] font-[800] tracking-[0.06em] uppercase opacity-60">
            Recent Sessions
          </h2>
          <button className="text-violet text-[12px] font-[700] transition-opacity hover:opacity-80">
            View all
          </button>
        </div>
        <div className="bg-surface border-border overflow-hidden rounded-2xl border px-5">
          <div className="divide-border divide-y">
            {MOCK_SESSIONS.map((s) => (
              <SessionRow key={s.id} {...s} />
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// ── Root export ──────────────────────────────────────────────────────────────
export function Dashboard() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const { data: subjects = [], isLoading: subjectsLoading } = useSubjects()
  const { data: user, isLoading: userLoading } = useUser()

  if (userLoading) {
    return (
      <div className="text-muted-foreground flex h-full items-center justify-center text-sm">
        Loading…
      </div>
    )
  }

  if (user && !user.onboarded) {
    return <OnboardingWizard />
  }

  return (
    <div className="flex h-full flex-col">
      {/* Mobile header */}
      <div className="border-border/40 flex items-center gap-3 border-b px-4 py-3 md:hidden">
        <MobileSidebarTrigger onOpen={() => setMobileSidebarOpen(true)} />
        <span className="text-foreground text-[15px] font-[800] tracking-[-0.03em]">
          tempo
        </span>
      </div>

      <MobileSidebar
        isOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop sidebar */}
        <aside className="border-border/40 hidden w-[220px] shrink-0 overflow-y-auto border-r p-4 md:block">
          <Sidebar />
        </aside>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {!subjectsLoading && subjects.length === 0 ? (
            <EmptyState />
          ) : (
            <DashboardContent />
          )}
        </main>
      </div>
    </div>
  )
}
