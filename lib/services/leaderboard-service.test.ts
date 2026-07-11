import { describe, expect, it } from 'vitest'
import { getDisplayName, rankWithTies } from './leaderboard-service'

describe('getDisplayName', () => {
  it('joins first and last name when present', () => {
    expect(
      getDisplayName({ firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.com' })
    ).toBe('Ada Lovelace')
  })

  it('falls back to the email local part when no name is set', () => {
    expect(getDisplayName({ firstName: null, lastName: null, email: 'ghost@example.com' })).toBe(
      'ghost'
    )
  })
})

describe('rankWithTies', () => {
  it('gives tied values the same rank and skips ranks for the tie count', () => {
    const rows = [{ v: 100 }, { v: 100 }, { v: 50 }]
    const ranked = rankWithTies(rows, (row) => row.v)
    expect(ranked.map((row) => row.rank)).toEqual([1, 1, 3])
  })

  it('assigns sequential ranks when there are no ties', () => {
    const rows = [{ v: 30 }, { v: 20 }, { v: 10 }]
    const ranked = rankWithTies(rows, (row) => row.v)
    expect(ranked.map((row) => row.rank)).toEqual([1, 2, 3])
  })
})
