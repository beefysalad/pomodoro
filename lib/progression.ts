export const MODE_XP = {
  blitz: 10,
  focus: 25,
  deep: 50,
} as const

export function getLevelFromXp(totalXP: number) {
  return Math.floor(Math.sqrt(totalXP / 100)) + 1
}

export function getLevelProgress(totalXP: number) {
  const level = getLevelFromXp(totalXP)
  const currentLevelFloor = Math.pow(level - 1, 2) * 100
  const nextLevelFloor = Math.pow(level, 2) * 100
  const xpIntoLevel = Math.max(0, totalXP - currentLevelFloor)
  const xpForLevel = Math.max(1, nextLevelFloor - currentLevelFloor)
  const xpToNext = Math.max(0, nextLevelFloor - totalXP)
  const progressPct = Math.max(0, Math.min(100, (xpIntoLevel / xpForLevel) * 100))

  return {
    level,
    currentLevelFloor,
    nextLevelFloor,
    xpIntoLevel,
    xpForLevel,
    xpToNext,
    progressPct,
  }
}

function getDateKeyInTimeZone(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)

  const year = parts.find((part) => part.type === 'year')?.value
  const month = parts.find((part) => part.type === 'month')?.value
  const day = parts.find((part) => part.type === 'day')?.value

  if (!year || !month || !day) {
    return date.toISOString().slice(0, 10)
  }

  return `${year}-${month}-${day}`
}

function dateKeyToDayNumber(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number)
  return Math.floor(Date.UTC(year, month - 1, day) / 86400000)
}

export function getNextStreak({
  currentStreak,
  lastStudiedAt,
  timezone,
  now,
}: {
  currentStreak: number
  lastStudiedAt: Date | null
  timezone: string
  now: Date
}) {
  if (!lastStudiedAt) return 1

  const todayKey = getDateKeyInTimeZone(now, timezone)
  const lastKey = getDateKeyInTimeZone(lastStudiedAt, timezone)

  if (todayKey === lastKey) {
    return Math.max(1, currentStreak || 1)
  }

  const dayDelta =
    dateKeyToDayNumber(todayKey) - dateKeyToDayNumber(lastKey)

  if (dayDelta === 1) {
    return Math.max(1, currentStreak) + 1
  }

  return 1
}
