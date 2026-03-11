'use client'

import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from '@clerk/nextjs'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { PublicTimer } from '@/components/public-timer'

export default function RootPage() {
  const [timerRunning, setTimerRunning] = useState(false)

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#060a14] text-slate-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-[-160px] left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-cyan-500/12 blur-[160px]" />
        <div className="absolute right-[-160px] bottom-[-160px] h-[420px] w-[420px] rounded-full bg-violet-600/12 blur-[160px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.05),transparent_55%)]" />
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

        <main className="flex flex-1 flex-col items-center justify-center py-10 sm:py-12">
          <motion.div
            className="w-full max-w-2xl text-center"
            initial={{ opacity: 0, y: 10 }}
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

            <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
              Focus faster, track smarter.
            </h1>
            <p className="mt-3 text-sm text-slate-400">
              Tempo keeps your study flow tight: run sessions, see momentum, and
              organize subjects in one place.
            </p>

            <div className="mt-6">
              <PublicTimer onRunningChange={setTimerRunning} immersive />
            </div>

            <div className="mt-5 flex items-center justify-center gap-3">
              <SignedOut>
                <SignUpButton mode="modal">
                  <button className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-500">
                    Get started
                  </button>
                </SignUpButton>
                <SignInButton mode="modal">
                  <button className="rounded-lg border border-white/10 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-white/30 hover:text-white">
                    Sign in
                  </button>
                </SignInButton>
              </SignedOut>

              <SignedIn>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-500"
                >
                  Go to dashboard
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </SignedIn>
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  )
}
