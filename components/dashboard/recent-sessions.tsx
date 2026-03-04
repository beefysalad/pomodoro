'use client'

interface Session {
  id: string
  subject: string
  topic: string
  emoji: string
  duration: string
  xp: number
  rating: number
  date: string
}

const RECENT_SESSIONS: Session[] = [
  {
    id: '1',
    subject: 'Mathematics',
    topic: 'Calculus - Integrals',
    emoji: '📐',
    duration: '25m',
    xp: 25,
    rating: 3,
    date: 'Today, 2:30 PM',
  },
  {
    id: '2',
    subject: 'Physics',
    topic: 'Quantum Mechanics',
    emoji: '⚡',
    duration: '50m',
    xp: 50,
    rating: 2,
    date: 'Today, 10:00 AM',
  },
  {
    id: '3',
    subject: 'Chemistry',
    topic: 'Organic Reactions',
    emoji: '🧪',
    duration: '25m',
    xp: 25,
    rating: 3,
    date: 'Yesterday, 4:15 PM',
  },
  {
    id: '4',
    subject: 'History',
    topic: 'World War II',
    emoji: '📚',
    duration: '10m',
    xp: 10,
    rating: 2,
    date: 'Yesterday, 3:00 PM',
  },
]

export function RecentSessions() {
  return (
    <div className="border-border bg-surface rounded-2xl border p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-foreground text-[14px] font-[700] tracking-[-0.02em]">
          Recent Sessions
        </h2>
        <button className="text-violet-mid text-[11px] font-[700] hover:text-violet transition-colors">
          View all →
        </button>
      </div>

      <div className="space-y-2">
        {RECENT_SESSIONS.map((session) => (
          <div
            key={session.id}
            className="flex items-center justify-between p-3 rounded-xl bg-surface-up/50 hover:bg-surface-up transition-colors"
          >
            {/* Left side - Session info */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="text-[16px]">{session.emoji}</div>
              <div className="flex-1 min-w-0">
                <p className="text-foreground text-[12px] font-[600] truncate">
                  {session.topic}
                </p>
                <p className="text-muted-foreground/60 text-[10px] truncate">
                  {session.date}
                </p>
              </div>
            </div>

            {/* Right side - Stats */}
            <div className="flex items-center gap-4 ml-4">
              {/* Duration */}
              <div className="text-right">
                <p className="text-text-sub text-[11px] font-[700] text-nowrap">
                  {session.duration}
                </p>
              </div>

              {/* XP */}
              <div className="text-right">
                <p className="text-amber text-[11px] font-[700] text-nowrap">
                  +{session.xp}
                </p>
              </div>

              {/* Rating */}
              <div className="text-right">
                <p className="text-amber text-[12px] text-nowrap">
                  {Array(3)
                    .fill(0)
                    .map((_, i) => (
                      <span key={i}>{i < session.rating ? '★' : '☆'}</span>
                    ))}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
