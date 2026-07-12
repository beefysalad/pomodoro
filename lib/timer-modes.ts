export type TimerMode = 'blitz' | 'focus' | 'deep'

export interface TimerModeConfig {
  label: string
  color: string
  defaultMinutes: number
  xp: number
  describeDuration: (minutes: number) => string
}

export const TIMER_MODE_ORDER: TimerMode[] = ['blitz', 'focus', 'deep']

export const TIMER_MODES: Record<TimerMode, TimerModeConfig> = {
  blitz: {
    label: 'Blitz',
    color: '#d97706',
    defaultMinutes: 10,
    xp: 10,
    describeDuration: (minutes) => `${minutes} min sprint`,
  },
  focus: {
    label: 'Focus',
    color: '#7c3aed',
    defaultMinutes: 25,
    xp: 25,
    describeDuration: (minutes) => `${minutes} min session`,
  },
  deep: {
    label: 'Deep',
    color: '#06b6d4',
    defaultMinutes: 50,
    xp: 50,
    describeDuration: (minutes) => `${minutes} min block`,
  },
}

export function getTimerModeSeconds(mode: TimerMode, minutesOverride?: number) {
  return (minutesOverride ?? TIMER_MODES[mode].defaultMinutes) * 60
}

export const BREAK_MODE_COLOR = '#22c55e'
