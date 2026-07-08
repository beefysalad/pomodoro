'use client'

import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface DoneStepProps {
  canComplete: boolean
  isPending: boolean
  onStartSession: () => void
  onOpenFlashcards: () => void
}

export function DoneStep({
  canComplete,
  isPending,
  onStartSession,
  onOpenFlashcards,
}: DoneStepProps) {
  return (
    <div className="space-y-10">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-violet-500/30 bg-violet-600/20 text-3xl">
        ✅
      </div>
      <div className="space-y-2">
        <h2 className="text-4xl font-black tracking-tight text-white">
          You are ready
        </h2>
        <p className="mx-auto max-w-2xl text-sm text-slate-400">
          Pick how you want to start. You can always switch later.
        </p>
      </div>
      <div className="mx-auto grid w-full max-w-4xl gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-violet-500/25 bg-violet-500/10 p-8 text-left">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-violet-500/30 bg-violet-600/20 text-xl">
            ⏱️
          </div>
          <h3 className="text-lg font-bold text-white">Run a Pomodoro</h3>
          <p className="mt-1 text-sm text-slate-400">
            Jump into the dashboard and start a focused session.
          </p>
          <Button
            onClick={onStartSession}
            disabled={!canComplete || isPending}
            className="mt-6 w-full rounded-full bg-violet-600 text-white hover:bg-violet-500"
          >
            Start a session
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-8 text-left">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-cyan-500/30 bg-cyan-600/20 text-xl">
            🧠
          </div>
          <h3 className="text-lg font-bold text-white">Study or Quiz</h3>
          <p className="mt-1 text-sm text-slate-400">
            Open a subject to review flashcards or take a quick quiz.
          </p>
          <Button
            onClick={onOpenFlashcards}
            disabled={!canComplete || isPending}
            className="mt-6 w-full rounded-full border border-violet-400/40 bg-violet-500/15 text-violet-100 hover:bg-violet-500/25"
          >
            Open flashcards
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
