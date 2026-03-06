'use client'

import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from '@clerk/nextjs'
import { AnimatePresence, motion } from 'framer-motion'
import { Flame, Star, Zap } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { PublicTimer } from '@/components/public-timer'

export default function RootPage() {
  const [timerRunning, setTimerRunning] = useState(false)

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#060a14] text-slate-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-[-180px] left-1/2 h-[640px] w-[640px] -translate-x-1/2 rounded-full bg-violet-500/14 blur-[170px]" />
        <div className="absolute top-[18%] left-[-140px] h-[360px] w-[360px] rounded-full bg-fuchsia-500/10 blur-[140px]" />
        <div className="absolute right-[-160px] bottom-[-140px] h-[460px] w-[460px] rounded-full bg-cyan-500/12 blur-[160px]" />
        <div className="absolute bottom-[-140px] left-[30%] h-[360px] w-[360px] rounded-full bg-amber-400/10 blur-[140px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.04),transparent_35%)]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-6 sm:px-6 lg:px-10">
        <AnimatePresence>
          {!timerRunning && (
            <motion.header
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="flex items-center justify-between"
            >
              <div className="leading-none text-white">
                <span className="block text-lg font-black tracking-tight sm:text-xl">
                  Tempo
                </span>
                <span className="mt-0.5 block text-[10px] font-semibold tracking-[0.14em] text-slate-400 uppercase">
                  by Patrick
                </span>
              </div>

              <nav className="flex items-center gap-2">
                <SignedOut>
                  <SignInButton mode="modal">
                    <button className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-300 transition hover:text-white">
                      Sign in
                    </button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <button className="rounded-lg bg-violet-600 px-3.5 py-1.5 text-sm font-semibold text-white transition hover:bg-violet-500">
                      Sign up
                    </button>
                  </SignUpButton>
                </SignedOut>

                <SignedIn>
                  <Link
                    href="/dashboard"
                    className="rounded-lg bg-violet-600 px-3.5 py-1.5 text-sm font-semibold text-white transition hover:bg-violet-500"
                  >
                    Dashboard
                  </Link>
                  <UserButton
                    appearance={{
                      elements: {
                        avatarBox: 'w-8 h-8 border border-violet-400/50',
                      },
                    }}
                  />
                </SignedIn>
              </nav>
            </motion.header>
          )}
        </AnimatePresence>

        <main className="flex flex-1 flex-col items-center justify-center py-8 sm:py-10">
          <motion.div
            className="w-full max-w-2xl"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          >
            <AnimatePresence mode="wait">
              {!timerRunning && (
                <motion.div
                  key="demo-pill"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className="mb-4 flex items-center justify-center"
                >
                  <span className="rounded-full border border-cyan-400/25 bg-cyan-500/15 px-2.5 py-1 text-[10px] font-semibold tracking-[0.12em] text-cyan-100 uppercase">
                    Demo mode · Try timer instantly
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
            <PublicTimer onRunningChange={setTimerRunning} immersive />
          </motion.div>

          <AnimatePresence>
            {!timerRunning && (
              <motion.div
                className="mt-6 grid w-full max-w-3xl gap-3 sm:grid-cols-3"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 16 }}
                transition={{ delay: 0.08, duration: 0.25, ease: 'easeOut' }}
              >
                <QuestCard
                  icon={Star}
                  title="Quick quest"
                  subtitle="Complete 1 Blitz to start your streak."
                  accent="from-fuchsia-500/20 to-violet-500/10"
                />
                <QuestCard
                  icon={Zap}
                  title="XP pulse"
                  subtitle="Finish a Focus run and bank XP."
                  accent="from-violet-500/20 to-cyan-500/10"
                />
                <QuestCard
                  icon={Flame}
                  title="Momentum"
                  subtitle="Return tomorrow to grow your streak."
                  accent="from-amber-500/20 to-orange-500/10"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}

function QuestCard({
  icon: Icon,
  title,
  subtitle,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  subtitle: string
  accent: string
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3">
      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${accent}`} />
      <div className="relative">
        <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-white">
          <Icon className="h-3.5 w-3.5" />
          {title}
        </p>
        <p className="mt-1 text-xs text-slate-300">{subtitle}</p>
      </div>
    </div>
  )
}
