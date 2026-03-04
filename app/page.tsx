'use client'

import {
  SignedIn,
  SignedOut,
  UserButton,
  SignInButton,
  SignUpButton,
} from '@clerk/nextjs'
import { motion } from 'framer-motion'
import { ArrowRight, BarChart2, Flame, Zap } from 'lucide-react'
import Link from 'next/link'
import { PublicTimer } from '@/components/public-timer'

export default function RootPage() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#0d1117]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-violet-600/10 blur-[120px]" />
        <div className="absolute top-1/2 -right-40 h-[400px] w-[400px] -translate-y-1/2 rounded-full bg-cyan-500/8 blur-[100px]" />
        <div className="absolute bottom-0 left-0 h-[300px] w-[500px] rounded-full bg-amber-500/5 blur-[100px]" />
      </div>

      <header className="relative z-10 flex items-center justify-between px-6 py-5 sm:px-10">
        <span className="text-[20px] font-[900] tracking-[-0.04em] text-white">
          Tempo
        </span>

        <nav className="flex items-center gap-3">
          <SignedOut>
            <SignInButton mode="modal">
              <button className="rounded-xl px-4 py-2 text-[13px] font-[600] text-slate-400 transition-colors hover:text-white">
                Sign in
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="rounded-xl bg-violet-600 px-4 py-2 text-[13px] font-[700] text-white shadow-[0_0_20px_rgba(124,58,237,0.35)] transition-all hover:bg-violet-500 hover:shadow-[0_0_28px_rgba(124,58,237,0.5)]">
                Sign up free
              </button>
            </SignUpButton>
          </SignedOut>

          <SignedIn>
            <Link
              href="/dashboard"
              className="flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-[13px] font-[700] text-white shadow-[0_0_20px_rgba(124,58,237,0.35)] transition-all hover:bg-violet-500"
            >
              Dashboard <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <UserButton
              appearance={{
                elements: {
                  avatarBox:
                    'w-9 h-9 border-2 border-violet-500/40 shadow-[0_0_12px_rgba(124,58,237,0.25)]',
                },
              }}
            />
          </SignedIn>
        </nav>
      </header>

      <main className="relative z-10 flex flex-1 flex-col items-center gap-16 px-6 py-10 sm:px-10 sm:py-14">
        <motion.div
          className="flex max-w-xl flex-col items-center gap-5 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-4 py-1.5 text-[12px] font-[700] tracking-widest text-violet-400 uppercase">
            <Flame className="h-3 w-3" />
            Gamified study timer
          </div>

          <h1 className="text-[42px] leading-[1.05] font-[900] tracking-[-0.04em] text-white sm:text-[52px]">
            Study smarter.
            <br />
            <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
              Level up faster.
            </span>
          </h1>

          <p className="text-[16px] leading-relaxed text-slate-400">
            Start a session below — no account needed. Sign up to track your
            progress, earn XP, and build streaks.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease: 'easeOut' }}
          className="w-full max-w-md"
        >
          <PublicTimer />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3, ease: 'easeOut' }}
          className="flex flex-wrap items-center justify-center gap-3"
        >
          {[
            { icon: Zap, label: 'XP & levelling system' },
            { icon: Flame, label: 'Daily streaks' },
            { icon: BarChart2, label: 'Session history' },
          ].map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-2 rounded-xl border border-white/8 bg-white/4 px-4 py-2.5 text-[13px] font-[600] text-slate-400 backdrop-blur-sm"
            >
              <Icon className="h-4 w-4 text-violet-400" />
              {label}
            </div>
          ))}
        </motion.div>

        <SignedOut>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.45, ease: 'easeOut' }}
            className="flex flex-col items-center gap-4 rounded-2xl border border-violet-500/15 bg-violet-500/8 px-8 py-6 text-center backdrop-blur-sm"
          >
            <p className="text-[15px] font-[600] text-slate-200">
              Ready to track your progress?
            </p>
            <p className="text-[13px] text-slate-500">
              Create a free account to earn XP, build streaks, and see your
              growth over time.
            </p>
            <SignUpButton mode="modal">
              <button className="flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-3 text-[14px] font-[800] text-white shadow-[0_0_24px_rgba(124,58,237,0.4)] transition-all hover:bg-violet-500 hover:shadow-[0_0_36px_rgba(124,58,237,0.6)]">
                Get started for free <ArrowRight className="h-4 w-4" />
              </button>
            </SignUpButton>
            <p className="text-[12px] text-slate-600">
              No credit card required
            </p>
          </motion.div>
        </SignedOut>
      </main>

      <footer className="relative z-10 py-6 text-center text-[12px] text-slate-700">
        © {new Date().getFullYear()} Tempo. Built for focused study.
      </footer>
    </div>
  )
}
