import { Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SessionRatingPanelProps {
  variant: 'inline' | 'overlay'
  rating: number
  onRatingChange: (score: number) => void
  onSaveSession: () => void
  onDiscard: () => void
  isSaving: boolean
}

export function SessionRatingPanel({
  variant,
  rating,
  onRatingChange,
  onSaveSession,
  onDiscard,
  isSaving,
}: SessionRatingPanelProps) {
  return (
    <div
      className={`w-full max-w-xl rounded-xl border border-white/10 p-4 ${
        variant === 'inline' ? 'bg-glass-subtle' : 'bg-glass-soft'
      }`}
    >
      <p className="text-center text-sm font-semibold text-white">
        How was that session?
      </p>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {[1, 2, 3].map((score) => (
          <Button
            key={score}
            variant="outline"
            onClick={() => onRatingChange(score)}
            className={`h-auto rounded-lg px-2 py-2 text-sm font-semibold shadow-none ${
              rating === score
                ? 'border-violet-400/70 bg-violet-500/20 text-violet-100 hover:bg-violet-500/20'
                : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:bg-white/5'
            }`}
          >
            {score === 1 ? 'Hard' : score === 2 ? 'Okay' : 'Great'}
          </Button>
        ))}
      </div>
      <div
        className={`mt-3 flex justify-center gap-2 ${
          variant === 'inline' ? 'flex-wrap' : ''
        }`}
      >
        <Button
          onClick={onSaveSession}
          disabled={isSaving}
          className="bg-violet-600 text-white hover:bg-violet-500"
        >
          <Zap className="h-4 w-4" />
          Save session
        </Button>
        {variant === 'inline' && (
          <Button
            variant="outline"
            onClick={onDiscard}
            className="border-white/15 bg-white/5 text-slate-200 hover:bg-white/10"
          >
            Discard
          </Button>
        )}
      </div>
    </div>
  )
}
