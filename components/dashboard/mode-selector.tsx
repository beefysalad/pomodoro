import type { TimerMode as Mode } from '@/app/providers/timer-provider'
import { Button } from '@/components/ui/button'

interface ModeOption {
  label: string
  color: string
  minutes: number
  subtitle: (minutes: number) => string
}

interface ModeSelectorProps {
  modeConfig: Record<Mode, ModeOption>
  mode: Mode
  disabled: boolean
  onChangeMode: (mode: Mode) => void
}

export function ModeSelector({
  modeConfig,
  mode,
  disabled,
  onChangeMode,
}: ModeSelectorProps) {
  return (
    <div
      className="flex flex-wrap items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1.5 backdrop-blur-sm"
      id="tutorial-modes"
    >
      {(Object.keys(modeConfig) as Mode[]).map((entryMode) => {
        const option = modeConfig[entryMode]
        const active = mode === entryMode

        return (
          <Button
            key={entryMode}
            variant="ghost"
            onClick={() => onChangeMode(entryMode)}
            className="h-auto flex-col items-center gap-0.5 rounded-full border px-5 py-2.5 text-center hover:bg-transparent"
            style={
              active
                ? {
                    borderColor: `${option.color}70`,
                    background: `${option.color}22`,
                    boxShadow: `0 0 20px ${option.color}30`,
                  }
                : {
                    borderColor: 'transparent',
                    background: 'transparent',
                  }
            }
            disabled={disabled}
          >
            <p className="text-sm leading-tight font-semibold text-white">
              {option.label}
            </p>
            <p className="text-[11px] text-slate-400">
              {option.subtitle(option.minutes)}
            </p>
          </Button>
        )
      })}
    </div>
  )
}
