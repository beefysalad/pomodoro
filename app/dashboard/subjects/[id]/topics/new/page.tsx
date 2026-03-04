export const dynamic = 'force-dynamic'

import { UserButton } from '@clerk/nextjs'
import { currentUser } from '@clerk/nextjs/server'
import { NewTopicForm } from '@/components/dashboard/new-topic-form'

export default async function NewTopicPage() {
  const user = await currentUser()

  return (
    <div className="bg-background min-h-screen flex flex-col">
      {/* Header */}
      <div className="border-border border-b sticky top-0 z-50 bg-background/80 backdrop-blur-md">
        <div className="flex items-center justify-between px-6 py-4">
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
      </div>

      {/* Main Content with Sidebar */}
      <div className="flex-1 overflow-hidden p-6">
        <div className="grid grid-cols-[200px_1fr] gap-6 h-full">
          {/* Sidebar Placeholder */}
          <div />

          {/* Form Content */}
          <div className="flex flex-col">
            <NewTopicForm />
          </div>
        </div>
      </div>
    </div>
  )
}
