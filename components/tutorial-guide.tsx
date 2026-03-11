'use client'

import { useMemo } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { X, ChevronRight } from 'lucide-react'

interface TutorialPageStep {
  route: string
  title: string
  description: string
  nextRoute?: string
  nextLabel?: string
}

const PAGE_STEPS: TutorialPageStep[] = [
  {
    route: '/dashboard',
    title: 'Dashboard',
    description:
      'Run focus sessions here. Choose a mode, pick your subject + topic, then start the timer.',
    nextRoute: '/stats',
    nextLabel: 'Go to Stats',
  },
  {
    route: '/stats',
    title: 'Stats',
    description:
      'Review streaks, level progress, session volume, and where your time goes.',
    nextRoute: '/leaderboard',
    nextLabel: 'Go to Leaderboard',
  },
  {
    route: '/leaderboard',
    title: 'Leaderboard',
    description:
      'Benchmark your cadence with global XP and weekly session rankings.',
    nextRoute: '/subjects',
    nextLabel: 'Go to Subjects',
  },
  {
    route: '/subjects',
    title: 'Subjects',
    description:
      'Organize study areas. Open a subject to manage topics, workflows, and flashcards.',
  },
]

interface TutorialGuideProps {
  onComplete: () => void
}

export function TutorialGuide({ onComplete }: TutorialGuideProps) {
  const pathname = usePathname()
  const router = useRouter()

  const currentStep = useMemo(
    () => PAGE_STEPS.find((step) => step.route === pathname),
    [pathname]
  )

  if (!currentStep) return null

  const handleNext = () => {
    if (currentStep.nextRoute) {
      router.push(currentStep.nextRoute)
      return
    }
    onComplete()
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-[100]">
      <div className="absolute inset-0 bg-slate-950/45" />

      <div className="pointer-events-none fixed inset-0 z-[101] flex items-end justify-center px-4 pb-6 sm:pb-8">
        <div className="pointer-events-auto w-full max-w-md">
          <div className="rounded-3xl border border-white/10 bg-[#0f172a] p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400">
                <div className="text-lg font-bold">
                  {PAGE_STEPS.findIndex((step) => step.route === pathname) + 1}
                </div>
              </div>
              <button
                onClick={onComplete}
                className="rounded-full p-1 text-slate-500 transition-colors hover:bg-white/5 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <h3 className="mb-2 text-xl font-bold text-white">
              {currentStep.title}
            </h3>
            <p className="mb-6 text-sm leading-relaxed text-slate-400">
              {currentStep.description}
            </p>

            <div className="flex items-center justify-between gap-4">
              <div className="flex gap-1.5">
                {PAGE_STEPS.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      PAGE_STEPS[i].route === pathname
                        ? 'w-6 bg-cyan-400'
                        : PAGE_STEPS.findIndex((step) => step.route === pathname) > i
                          ? 'w-1.5 bg-cyan-400/50'
                          : 'w-1.5 bg-white/10'
                    }`}
                  />
                ))}
              </div>

              <Button
                onClick={handleNext}
                className="rounded-xl bg-cyan-500 px-6 py-6 font-bold text-white shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:bg-cyan-400"
              >
                {currentStep.nextLabel ?? 'Finish'}
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
