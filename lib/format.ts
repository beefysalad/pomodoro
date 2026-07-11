function pad(value: number) {
  return String(value).padStart(2, '0')
}

export function formatClock(seconds: number) {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${pad(mins)}:${pad(secs)}`
}

export function formatDuration(totalSeconds: number) {
  const totalMinutes = Math.floor(totalSeconds / 60)
  if (totalMinutes < 60) return `${totalMinutes}m`
  const hours = Math.floor(totalMinutes / 60)
  const mins = totalMinutes % 60
  return `${hours}h ${mins}m`
}

export function formatPercent(value: number) {
  return `${Math.round(value)}%`
}
