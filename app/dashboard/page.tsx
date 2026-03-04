export const dynamic = 'force-dynamic'

import { UserButton } from '@clerk/nextjs'
import { currentUser } from '@clerk/nextjs/server'

export default async function DashboardPage() {
  const user = await currentUser()

  return (
    <div className="bg-background relative flex min-h-screen flex-col items-center justify-center p-4">
      <div className="absolute inset-x-0 top-0 flex items-center justify-between p-6">
        <span className="text-foreground text-[18px] font-[800] tracking-[-0.03em]">
          Tempo
        </span>

        <UserButton
          appearance={{
            elements: {
              avatarBox:
                'w-10 h-10 border-2 border-surface-up shadow-[0_0_14px_var(--color-violet-glow)]',
            },
          }}
        />
      </div>

      <div className="flex flex-col items-center text-center">
        <h1 className="text-foreground text-3xl font-[800] tracking-[-0.03em]">
          Welcome back, {user?.firstName || 'User'}!
        </h1>
        <p className="text-text-sub mt-4 font-mono text-sm">
          Your dashboard is currently under construction.
        </p>
      </div>
    </div>
  )
}
