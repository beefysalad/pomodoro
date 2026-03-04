import { TimerProvider } from '@/contexts/timer-context'
import { GlobalTimerOverlay } from '@/components/dashboard/timer-overlay'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <TimerProvider>
      {children}
      {/* Timer overlay lives outside any page — persists across navigation */}
      <GlobalTimerOverlay />
    </TimerProvider>
  )
}
