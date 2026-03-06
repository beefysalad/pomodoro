import api from '../axios'

export interface LeaderboardEntry {
  rank: number
  userId: string
  name: string
}

export interface GlobalEntry extends LeaderboardEntry {
  totalXP: number
  level: number
  streak: number
}

export interface WeeklyEntry extends LeaderboardEntry {
  sessions: number
  focusMinutes: number
  weeklyXP: number
}

export interface LeaderboardResponse {
  generatedAt: string
  weekStart: string
  global: {
    top: GlobalEntry[]
    me: GlobalEntry
  }
  weekly: {
    top: WeeklyEntry[]
    me: WeeklyEntry | Omit<WeeklyEntry, 'rank'> & { rank: null }
  }
}

export const getLeaderboard = async (): Promise<LeaderboardResponse> => {
  const { data } = await api.get<LeaderboardResponse>('/leaderboard')
  return data
}
