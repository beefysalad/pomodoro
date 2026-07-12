import { describe, expect, it } from 'vitest'
import {
  buildHeatmap,
  computeCompletionRate,
  computeConcentrationRate,
  computeConsistencyScore,
  computeNextStreakGoal,
  computeTrends,
  getTopTopics,
  summarizeSubjects,
} from './stats-service'
import type { SubjectWithTopics } from '@/lib/repositories/stats-repository'

describe('computeNextStreakGoal', () => {
  it('targets 3 when streak is below 3', () => {
    expect(computeNextStreakGoal(0)).toBe(3)
    expect(computeNextStreakGoal(2)).toBe(3)
  })

  it('targets 7 when streak is between 3 and 6', () => {
    expect(computeNextStreakGoal(3)).toBe(7)
    expect(computeNextStreakGoal(6)).toBe(7)
  })

  it('targets 14 when streak is between 7 and 13', () => {
    expect(computeNextStreakGoal(7)).toBe(14)
    expect(computeNextStreakGoal(13)).toBe(14)
  })

  it('targets streak + 7 once past 14', () => {
    expect(computeNextStreakGoal(14)).toBe(21)
    expect(computeNextStreakGoal(30)).toBe(37)
  })
})

describe('computeConsistencyScore', () => {
  it('returns 0 for no streak and no sessions', () => {
    expect(computeConsistencyScore(0, 0)).toBe(0)
  })

  it('caps at 100', () => {
    expect(computeConsistencyScore(10, 30)).toBe(100)
  })
})

describe('computeCompletionRate', () => {
  it('returns 0 when there are no topics', () => {
    expect(computeCompletionRate(0, 0)).toBe(0)
  })

  it('returns the percentage of done topics', () => {
    expect(computeCompletionRate(4, 1)).toBe(25)
  })
})

describe('computeConcentrationRate', () => {
  it('returns 0 when there is no tracked time', () => {
    expect(computeConcentrationRate(0, 0)).toBe(0)
  })

  it('returns the top subject share of total time', () => {
    expect(computeConcentrationRate(30, 120)).toBe(25)
  })
})

describe('summarizeSubjects', () => {
  it('rolls up topic totals per subject', () => {
    const subjects: SubjectWithTopics[] = [
      {
        id: 'subj_1',
        name: 'Biology',
        color: '#7c3aed',
        icon: null,
        topics: [
          { id: 't1', name: 'Cells', status: 'DONE', totalTime: 600, sessionCount: 2 },
          { id: 't2', name: 'Genetics', status: 'IN_PROGRESS', totalTime: 300, sessionCount: 1 },
        ],
      },
    ]

    expect(summarizeSubjects(subjects)).toEqual([
      {
        id: 'subj_1',
        name: 'Biology',
        color: '#7c3aed',
        icon: null,
        totalSeconds: 900,
        sessionCount: 3,
        topicCount: 2,
        doneTopics: 1,
      },
    ])
  })
})

describe('getTopTopics', () => {
  it('sorts topics across subjects by total time and applies the limit', () => {
    const subjects: SubjectWithTopics[] = [
      {
        id: 'subj_1',
        name: 'Biology',
        color: '#7c3aed',
        icon: null,
        topics: [
          { id: 't1', name: 'Cells', status: 'DONE', totalTime: 300, sessionCount: 1 },
          { id: 't2', name: 'Genetics', status: 'DONE', totalTime: 900, sessionCount: 3 },
        ],
      },
      {
        id: 'subj_2',
        name: 'Chemistry',
        color: '#06b6d4',
        icon: null,
        topics: [{ id: 't3', name: 'Bonds', status: 'DONE', totalTime: 600, sessionCount: 2 }],
      },
    ]

    expect(getTopTopics(subjects, 2)).toEqual([
      { id: 't2', name: 'Genetics', subjectName: 'Biology', totalSeconds: 900, sessions: 3 },
      { id: 't3', name: 'Bonds', subjectName: 'Chemistry', totalSeconds: 600, sessions: 2 },
    ])
  })
})

describe('computeTrends', () => {
  const now = new Date('2026-07-12T12:00:00.000Z')

  it('splits sessions into the last 7 days vs the 7 days before that', () => {
    const sessions = [
      { createdAt: new Date('2026-07-10T12:00:00.000Z'), duration: 600, xpEarned: 25 },
      { createdAt: new Date('2026-07-02T12:00:00.000Z'), duration: 300, xpEarned: 10 },
      { createdAt: new Date('2026-06-12T12:00:00.000Z'), duration: 1200, xpEarned: 50 },
    ]

    const trends = computeTrends(sessions, now)

    expect(trends.xp).toEqual({ value: 25, deltaPct: 150 })
    expect(trends.focusSeconds).toEqual({ value: 600, deltaPct: 100 })
    expect(trends.sessions).toEqual({ value: 1, deltaPct: 0 })
  })

  it('reports a 100% increase when the previous window had no sessions', () => {
    const sessions = [{ createdAt: new Date('2026-07-10T12:00:00.000Z'), duration: 600, xpEarned: 25 }]
    expect(computeTrends(sessions, now).xp.deltaPct).toBe(100)
  })

  it('reports 0% when both windows are empty', () => {
    expect(computeTrends([], now).xp).toEqual({ value: 0, deltaPct: 0 })
  })
})

describe('buildHeatmap', () => {
  it('buckets sessions by local day and fills empty days with zero, spanning 84 days', () => {
    const now = new Date('2026-07-12T12:00:00.000Z')
    const sessions = [
      { createdAt: new Date('2026-07-12T09:00:00.000Z'), duration: 600, xpEarned: 25 },
      { createdAt: new Date('2026-07-12T15:00:00.000Z'), duration: 300, xpEarned: 10 },
      { createdAt: new Date('2026-07-11T09:00:00.000Z'), duration: 900, xpEarned: 25 },
    ]

    const heatmap = buildHeatmap(sessions, 'UTC', now)

    expect(heatmap).toHaveLength(84)
    expect(heatmap[heatmap.length - 1]).toEqual({ date: '2026-07-12', seconds: 900, sessions: 2 })
    expect(heatmap[heatmap.length - 2]).toEqual({ date: '2026-07-11', seconds: 900, sessions: 1 })
    expect(heatmap[0]).toEqual({ date: '2026-04-20', seconds: 0, sessions: 0 })
  })
})
