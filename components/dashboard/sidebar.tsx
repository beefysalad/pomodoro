'use client'

import { Plus } from 'lucide-react'

interface Subject {
  id: string
  name: string
  emoji: string
  active: boolean
  color: string
}

const SUBJECTS: Subject[] = [
  { id: '1', name: 'Mathematics', emoji: '📐', active: true, color: 'violet-mid' },
  { id: '2', name: 'Physics', emoji: '⚡', active: false, color: 'blue-400' },
  { id: '3', name: 'Chemistry', emoji: '🧪', active: false, color: 'success' },
  { id: '4', name: 'History', emoji: '📚', active: false, color: 'amber' },
]

export function Sidebar() {
  return (
    <div className="flex flex-col gap-6 h-full">
      {/* Subjects Section */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between px-2.5">
          <p className="text-muted-foreground/40 text-[9px] font-[700] tracking-[0.16em] uppercase">
            Subjects
          </p>
          <button className="text-muted-foreground/40 hover:text-muted-foreground transition-colors">
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex flex-col gap-1.5">
          {SUBJECTS.map((subject) => (
            <button
              key={subject.id}
              className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[12px] font-[600] transition-all w-full text-left ${
                subject.active
                  ? 'border-violet/20 bg-violet/10 text-violet-mid border'
                  : 'text-muted-foreground/60 hover:bg-surface-up hover:text-muted-foreground'
              }`}
            >
              <span className="text-[14px]">{subject.emoji}</span>
              <span className="truncate">{subject.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Streak Card */}
      <div className="mt-auto pt-4">
        <div className="border-streak/20 bg-streak-bg rounded-xl border p-3.5">
          <div className="flex items-center gap-1.5 mb-3">
            <span className="text-streak text-[12px] font-[700]">🔥</span>
            <p className="text-streak text-[10px] font-[700] tracking-[0.08em] uppercase">
              7-Day Streak
            </p>
          </div>

          {/* Streak Dots */}
          <div className="flex gap-1 mb-2">
            {Array(7)
              .fill(0)
              .map((_, i) => (
                <div
                  key={i}
                  className={`flex-1 h-2 rounded-full ${
                    i < 4
                      ? 'bg-streak shadow-[0_0_6px_rgba(234,88,12,0.5)]'
                      : 'bg-surface-hi'
                  }`}
                />
              ))}
          </div>

          <p className="text-muted-foreground/60 text-[9px] font-[600] tracking-[0.08em] uppercase">
            4 consecutive days
          </p>
        </div>
      </div>
    </div>
  )
}
