import { Pause, Play, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { TimerPhase } from '@/app/providers/timer-provider'

interface TimerControlsProps {
  variant: 'inline' | 'overlay'
  phase: TimerPhase
  running: boolean
  finished: boolean
  timerRemaining: number
  totalSeconds: number
  activeColor: string
  isSessionPending: boolean
  hasResolvedTopic: boolean
  onResetTimer: () => void
  onSkipBreak: () => void
  onPlayPause: () => void
}

export function TimerControls({
  variant,
  phase,
  running,
  finished,
  timerRemaining,
  totalSeconds,
  activeColor,
  isSessionPending,
  hasResolvedTopic,
  onResetTimer,
  onSkipBreak,
  onPlayPause,
}: TimerControlsProps) {
  const boxShadowBlurPx = variant === 'inline' ? 28 : 30
  const boxShadowOpacityHex = variant === 'inline' ? '58' : '5f'
  const playColor = phase === 'focus' ? activeColor : '#22c55e'

  const label = running
    ? 'Pause'
    : variant === 'inline'
      ? finished
        ? 'Done'
        : timerRemaining === totalSeconds
          ? phase === 'focus'
            ? 'Start session'
            : 'Start break'
          : 'Resume'
      : timerRemaining === totalSeconds
        ? 'Start'
        : 'Resume'

  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <Button
        variant="outline"
        className="h-11 border-white/15 bg-white/5 text-slate-200 hover:bg-white/10"
        onClick={onResetTimer}
      >
        <RotateCcw className="h-4 w-4" />
        Reset
      </Button>

      {phase === 'break' && (
        <Button
          variant="outline"
          className="h-11 border-white/15 bg-white/5 text-slate-200 hover:bg-white/10"
          onClick={onSkipBreak}
        >
          Skip break
        </Button>
      )}

      <Button
        className="h-11 font-bold text-white"
        onClick={onPlayPause}
        disabled={isSessionPending || (phase === 'focus' && !hasResolvedTopic)}
        style={{
          backgroundColor: playColor,
          boxShadow: `0 0 ${boxShadowBlurPx}px ${playColor}${boxShadowOpacityHex}`,
        }}
      >
        {running ? (
          <Pause className="h-4 w-4" />
        ) : (
          <Play className="h-4 w-4" />
        )}
        {label}
      </Button>
    </div>
  )
}
