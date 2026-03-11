'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { useUser, useUpdateUser } from '@/hooks/use-user'
import { TutorialGuide } from './tutorial-guide'

export function TutorialAutoStart() {
  const pathname = usePathname()
  if (pathname === '/' || pathname === '/onboarding') {
    return null
  }
  return <TutorialAutoStartInner />
}

function TutorialAutoStartInner() {
  const { data: user } = useUser()
  const updateUser = useUpdateUser()
  const [dismissed, setDismissed] = useState(false)

  if (
    !user ||
    !user.onboarded ||
    user.hasSeenTutorial ||
    dismissed
  ) {
    return null
  }

  const handleComplete = () => {
    setDismissed(true)
    updateUser.mutate({ hasSeenTutorial: true })
  }

  return <TutorialGuide onComplete={handleComplete} />
}
