import api from '../axios'

export interface TrendMetric {
  value: number
  deltaPct: number
}

export interface SubjectStat {
  id: string
  name: string
  color: string
  icon: string | null
  totalSeconds: number
  sessionCount: number
  topicCount: number
  doneTopics: number
}

export interface TopicStat {
  id: string
  name: string
  subjectName: string
  totalSeconds: number
  sessions: number
}

export interface HeatmapDay {
  date: string
  seconds: number
  sessions: number
}

export interface StatsResponse {
  totals: { xp: number; level: number; focusSeconds: number; sessions: number }
  trends: { xp: TrendMetric; focusSeconds: TrendMetric; sessions: TrendMetric }
  levelProgress: {
    level: number
    currentLevelFloor: number
    nextLevelFloor: number
    xpIntoLevel: number
    xpForLevel: number
    xpToNext: number
    progressPct: number
  }
  streak: { current: number; nextGoal: number }
  insights: { consistencyScore: number; completionRate: number; concentrationRate: number }
  subjects: SubjectStat[]
  topTopics: TopicStat[]
  heatmap: { days: HeatmapDay[] }
  topSubject: SubjectStat | null
}

export const getStats = async (): Promise<StatsResponse> => {
  const { data } = await api.get<StatsResponse>('/stats')
  return data
}
