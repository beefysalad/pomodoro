'use client'

import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from '@clerk/nextjs'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { PublicTimer } from '@/components/public-timer'

export default function RootPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#060a14] text-slate-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-[-180px] left-1/2 h-[640px] w-[640px] -translate-x-1/2 rounded-full bg-violet-500/14 blur-[170px]" />
        <div className="absolute top-[18%] left-[-140px] h-[360px] w-[360px] rounded-full bg-fuchsia-500/10 blur-[140px]" />
        <div className="absolute right-[-160px] bottom-[-140px] h-[460px] w-[460px] rounded-full bg-cyan-500/12 blur-[160px]" />
        <div className="absolute bottom-[-140px] left-[30%] h-[360px] w-[360px] rounded-full bg-amber-400/10 blur-[140px]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-6 sm:px-6 lg:px-10">
        <header className="flex items-center justify-between">
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
        </header>

        <main className="flex flex-1 items-center justify-center py-8 sm:py-10">
          <motion.div
            className="w-full max-w-2xl"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            <div className="mb-4 flex items-center justify-center gap-2">
              <span className="rounded-full border border-cyan-400/25 bg-cyan-500/15 px-2.5 py-1 text-[10px] font-semibold tracking-[0.12em] text-cyan-100 uppercase">
                Demo mode
              </span>
              <span className="rounded-full border border-violet-400/25 bg-violet-500/15 px-2.5 py-1 text-[10px] font-semibold tracking-[0.12em] text-violet-100 uppercase">
                Try timer instantly
              </span>
            </div>
            <PublicTimer />
          </motion.div>
        </main>
      </div>
    </div>
  )
}
