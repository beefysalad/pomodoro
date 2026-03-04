'use client'
import { useEffect, useState } from 'react'

const TICKER_ITEMS = [
  'Streaks',
  'XP',
  'Levels',
  'Focus',
  'Progress',
  'Flow',
  'Depth',
  'Momentum',
]

export function TickerWord() {
  const [idx, setIdx] = useState(0)
  const [visible, setVisible] = useState(true)
  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setIdx((i) => (i + 1) % TICKER_ITEMS.length)
        setVisible(true)
      }, 300)
    }, 2000)
    return () => clearInterval(interval)
  }, [])
  return (
    <span
      className={`from-violet-mid inline-block bg-gradient-to-r to-blue-400 bg-clip-text text-transparent transition-all duration-300 ${visible ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'}`}
    >
      {TICKER_ITEMS[idx]}
    </span>
  )
}
