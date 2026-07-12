'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { UserButton } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'

interface WizardShellProps {
  step: number
  totalSteps: number
  flowMessage: string
  onBack: () => void
  backDisabled: boolean
  showNext: boolean
  nextLabel: string
  nextDisabled: boolean
  onNext: () => void
  children: React.ReactNode
}

export function WizardShell({
  step,
  totalSteps,
  flowMessage,
  onBack,
  backDisabled,
  showNext,
  nextLabel,
  nextDisabled,
  onNext,
  children,
}: WizardShellProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#070b16] text-slate-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.05),transparent_55%)]" />
        <div className="absolute -top-32 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-violet-600/16 blur-[160px]" />
        <div className="absolute right-[-120px] -bottom-32 h-[440px] w-[440px] rounded-full bg-cyan-500/12 blur-[160px]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-6 sm:px-6 lg:px-10">
        <header className="flex items-center justify-between">
          <div className="leading-none text-white">
            <span className="block text-lg font-black tracking-tight sm:text-xl">
              Tempo
            </span>
            <span className="mt-0.5 block text-[10px] font-semibold tracking-[0.14em] text-slate-400 uppercase">
              onboarding
            </span>
          </div>
          <UserButton
            appearance={{
              elements: { avatarBox: 'w-9 h-9 border border-violet-400/40' },
            }}
          />
        </header>

        <main className="flex flex-1 flex-col items-center justify-center py-10 sm:py-12">
          <div className="w-full max-w-4xl space-y-6 text-center">
            <AnimatePresence>
              {!!flowMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="mx-auto max-w-2xl rounded-full border border-amber-500/25 bg-amber-500/10 px-5 py-2 text-sm text-amber-200"
                >
                  {flowMessage}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="bg-glass-soft rounded-3xl border border-white/10 p-8 backdrop-blur-xl sm:p-12">
              {children}
            </div>

            <div className="flex items-center justify-center gap-3">
              <Button
                variant="outline"
                className="bg-glass-soft h-11 rounded-full border-white/15 px-6 text-slate-300 hover:bg-white/10 hover:text-white"
                onClick={onBack}
                disabled={backDisabled}
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>

              {showNext && (
                <Button
                  className="h-11 rounded-full bg-violet-600 px-8 text-sm font-semibold text-white shadow-[0_0_20px_rgba(124,58,237,0.35)] hover:bg-violet-500"
                  onClick={onNext}
                  disabled={nextDisabled}
                >
                  {nextLabel}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>

            <p className="text-center text-xs text-slate-600">
              Timer and preferences can be changed anytime in Settings.
            </p>
          </div>
        </main>

        <div className="pb-6">
          <div className="mx-auto flex items-center justify-center gap-2.5">
            {Array.from({ length: totalSteps }).map((_, index) => (
              <div
                key={`step-dot-${index}`}
                className={`h-2 rounded-full transition-all ${
                  index === step
                    ? 'w-9 bg-violet-400 shadow-[0_0_10px_rgba(167,139,250,0.55)]'
                    : index < step
                      ? 'w-3.5 bg-violet-400/60'
                      : 'w-3.5 bg-white/10'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
