'use client'

import { useState } from 'react'
import { Sidebar, MobileSidebar, MobileSidebarTrigger } from './sidebar'
import { SubjectDetail } from './subject-detail'

export function SubjectDetailPage() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Mobile sub-header */}
      <div className="border-border/40 flex items-center gap-3 border-b px-4 py-3 md:hidden">
        <MobileSidebarTrigger onOpen={() => setMobileSidebarOpen(true)} />
        <span className="text-foreground text-[15px] font-[800] tracking-[-0.03em]">
          tempo
        </span>
      </div>

      <MobileSidebar
        isOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop sidebar */}
        <aside className="hidden w-[220px] shrink-0 overflow-y-auto p-4 md:block">
          <Sidebar />
        </aside>

        {/* Subject content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <SubjectDetail />
        </main>
      </div>
    </div>
  )
}
