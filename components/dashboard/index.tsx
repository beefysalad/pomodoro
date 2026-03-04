'use client'

import { Flame, Zap, Target, Clock, Plus } from 'lucide-react'
import { Sidebar } from './sidebar'
import { StatsGrid } from './stats-grid'
import { TimerSection } from './timer-section'
import { RecentSessions } from './recent-sessions'
import { XpLevelBar } from './xp-level-bar'

export function Dashboard() {
  return (
    <div className="grid grid-cols-[200px_1fr] gap-6 h-full">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex flex-col gap-6 overflow-y-auto pb-6">
        {/* Stats Grid */}
        <StatsGrid />

        {/* Timer Section */}
        <TimerSection />

        {/* XP Level Bar */}
        <XpLevelBar />

        {/* Recent Sessions */}
        <RecentSessions />
      </div>
    </div>
  )
}
