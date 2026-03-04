'use client'

import { Sidebar } from './sidebar'
import { StatsGrid } from './stats-grid'
import { TimerSection } from './timer-section'
import { RecentSessions } from './recent-sessions'
import { XpLevelBar } from './xp-level-bar'
import { EmptyState } from './empty-state'
import { OnboardingWizard } from './onboarding-wizard'
import { useSubjects } from '@/hooks/use-subjects'
import { useUser } from '@/hooks/use-user'

export function Dashboard() {
  const { data: subjects = [], isLoading: subjectsLoading } = useSubjects()
  const { data: user, isLoading: userLoading } = useUser()

  if (userLoading) {
    return (
      <div className="text-muted-foreground flex h-full items-center justify-center">
        Loading workspace...
      </div>
    )
  }

  // If user is not onboarded, show the Onboarding Wizard filling the entire dashboard area
  if (user && !user.onboarded) {
    return <OnboardingWizard />
  }

  return (
    <div className="grid h-full grid-cols-[200px_1fr] gap-6">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex flex-col gap-6 overflow-y-auto pb-6">
        {!subjectsLoading && subjects.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* Stats Grid */}
            <StatsGrid />

            {/* Timer Section */}
            <TimerSection />

            {/* XP Level Bar */}
            <XpLevelBar />

            {/* Recent Sessions */}
            <RecentSessions />
          </>
        )}
      </div>
    </div>
  )
}
