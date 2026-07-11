import { AnimatePresence, motion } from 'framer-motion'
import { Minimize2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PomodoroRing } from '@/components/dashboard/pomodoro-ring'
import { SessionRatingPanel } from '@/components/dashboard/session-rating-panel'
import { TimerControls } from '@/components/dashboard/timer-controls'
import type { TimerPhase } from '@/app/providers/timer-provider'
import type { Quote } from '@/lib/api/quote'

interface FocusModeOverlayProps {
  isOpen: boolean
  forceCompletionFocus: boolean
  onClose: () => void
  phase: TimerPhase
  activeModeLabel: string
  activeModeColor: string
  running: boolean
  quote: Quote | undefined
  finished: boolean
  progress: number
  timerRemaining: number
  totalSeconds: number
  pendingReview: boolean
  rating: number
  onRatingChange: (score: number) => void
  isSessionPending: boolean
  hasResolvedTopic: boolean
  onResetTimer: () => void
  onSkipBreak: () => void
  onPlayPause: () => void
  onSaveSession: () => void
}

export function FocusModeOverlay({
  isOpen,
  forceCompletionFocus,
  onClose,
  phase,
  activeModeLabel,
  activeModeColor,
  running,
  quote,
  finished,
  progress,
  timerRemaining,
  totalSeconds,
  pendingReview,
  rating,
  onRatingChange,
  isSessionPending,
  hasResolvedTopic,
  onResetTimer,
  onSkipBreak,
  onPlayPause,
  onSaveSession,
}: FocusModeOverlayProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 bg-[#040812]/86 backdrop-blur-2xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute inset-0 bg-[#030712]/55" />
            <div className="absolute top-[-140px] left-1/2 h-[440px] w-[440px] -translate-x-1/2 rounded-full bg-violet-600/16 blur-[130px]" />
            <div className="absolute right-[-120px] bottom-[-160px] h-[420px] w-[420px] rounded-full bg-cyan-500/12 blur-[130px]" />
          </div>

          <div className="relative z-10 flex h-full flex-col px-4 py-6 sm:px-6 lg:px-10">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold tracking-[0.18em] text-cyan-300 uppercase">
                  Focus mode
                </p>
                <p className="mt-1 text-sm text-slate-300">
                  {phase === 'focus' ? activeModeLabel : 'Break'} ·{' '}
                  {running ? 'In progress' : 'Ready'}
                </p>
              </div>
              <Button
                variant="outline"
                className="border-white/15 bg-white/5 text-slate-100 hover:bg-white/10"
                onClick={onClose}
                disabled={forceCompletionFocus}
              >
                <Minimize2 className="h-4 w-4" />
                {forceCompletionFocus ? 'Complete action first' : 'Exit'}
              </Button>
            </div>

            <div className="flex flex-1 flex-col items-center justify-center gap-8">
              <PomodoroRing
                color={phase === 'focus' ? activeModeColor : '#22c55e'}
                finished={finished}
                progress={progress}
                remaining={timerRemaining}
                large
              />

              {!!quote && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  className="max-w-2xl rounded-2xl border border-white/10 bg-gradient-to-r from-white/8 via-white/4 to-transparent px-5 py-4 text-center text-sm text-slate-200 shadow-[0_0_30px_rgba(15,23,42,0.35)]"
                >
                  <p className="text-[11px] font-semibold tracking-[0.18em] text-cyan-300 uppercase">
                    Focus mantra
                  </p>
                  <p className="mt-2 text-lg font-semibold text-white">
                    &ldquo;{quote.text}&rdquo;
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    — {quote.author}
                  </p>
                </motion.div>
              )}

              {!pendingReview ? (
                <TimerControls
                  variant="overlay"
                  phase={phase}
                  running={running}
                  finished={finished}
                  timerRemaining={timerRemaining}
                  totalSeconds={totalSeconds}
                  activeColor={activeModeColor}
                  isSessionPending={isSessionPending}
                  hasResolvedTopic={hasResolvedTopic}
                  onResetTimer={onResetTimer}
                  onSkipBreak={onSkipBreak}
                  onPlayPause={onPlayPause}
                />
              ) : (
                <SessionRatingPanel
                  variant="overlay"
                  rating={rating}
                  onRatingChange={onRatingChange}
                  onSaveSession={onSaveSession}
                  onDiscard={onResetTimer}
                  isSaving={isSessionPending}
                />
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
