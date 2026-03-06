'use client'

import { Crown, Flame, Medal, Timer, Trophy, Zap } from 'lucide-react'
import { AppHeader } from '@/components/app-header'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { useLeaderboard } from '@/hooks/use-leaderboard'

function formatMinutes(minutes: number) {
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours}h ${mins}m`
}

export default function LeaderboardPage() {
  const { data, isLoading } = useLeaderboard()

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#070b16] text-slate-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-[-120px] left-[-120px] h-[360px] w-[360px] rounded-full bg-violet-600/12 blur-[130px]" />
        <div className="absolute right-[-140px] bottom-[-140px] h-[420px] w-[420px] rounded-full bg-cyan-500/10 blur-[140px]" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-10">
        <AppHeader />

        <section>
          <p className="text-xs font-semibold tracking-[0.18em] text-cyan-300 uppercase">
            Leaderboard
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">
            Global rank and weekly grind
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Compete by total XP and weekly study sessions. Weekly ranking resets every Monday (UTC).
          </p>
        </section>

        {isLoading || !data ? (
          <Card className="border-white/10 bg-white/[0.05] py-0 backdrop-blur-xl">
            <CardContent className="px-4 py-6 text-sm text-slate-300">
              Loading leaderboard...
            </CardContent>
          </Card>
        ) : (
          <>
            <section className="grid gap-4 lg:grid-cols-2">
              <Card className="border-white/10 bg-white/[0.05] py-0 backdrop-blur-xl">
                <CardContent className="space-y-3 px-4 py-5 sm:px-5">
                  <div className="flex items-center justify-between">
                    <h2 className="inline-flex items-center gap-2 text-base font-bold text-white">
                      <Crown className="h-4 w-4 text-amber-300" />
                      Your global rank
                    </h2>
                    <Badge className="bg-violet-500/20 text-violet-200">
                      #{data.global.me.rank}
                    </Badge>
                  </div>
                  <div className="space-y-1 text-sm text-slate-300">
                    <p className="font-semibold text-white">{data.global.me.name}</p>
                    <p>
                      Level {data.global.me.level} · {data.global.me.totalXP} XP ·{' '}
                      {data.global.me.streak} day streak
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-white/10 bg-white/[0.05] py-0 backdrop-blur-xl">
                <CardContent className="space-y-3 px-4 py-5 sm:px-5">
                  <div className="flex items-center justify-between">
                    <h2 className="inline-flex items-center gap-2 text-base font-bold text-white">
                      <Flame className="h-4 w-4 text-cyan-300" />
                      Your weekly rank
                    </h2>
                    <Badge className="bg-cyan-500/20 text-cyan-200">
                      {data.weekly.me.rank ? `#${data.weekly.me.rank}` : 'Unranked'}
                    </Badge>
                  </div>
                  <div className="space-y-1 text-sm text-slate-300">
                    <p className="font-semibold text-white">{data.weekly.me.name}</p>
                    <p>
                      {data.weekly.me.sessions} sessions ·{' '}
                      {formatMinutes(data.weekly.me.focusMinutes)} · {data.weekly.me.weeklyXP} XP
                    </p>
                  </div>
                </CardContent>
              </Card>
            </section>

            <section className="grid gap-6 xl:grid-cols-2">
              <Card className="border-white/10 bg-white/[0.05] py-0 backdrop-blur-xl">
                <CardContent className="space-y-4 px-4 py-5 sm:px-5">
                  <div className="flex items-center justify-between">
                    <h2 className="inline-flex items-center gap-2 text-lg font-bold text-white">
                      <Trophy className="h-4 w-4 text-amber-300" />
                      Global XP ranking
                    </h2>
                    <Badge className="bg-amber-500/20 text-amber-100">
                      Top {data.global.top.length}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    {data.global.top.map((entry) => (
                      <div
                        key={entry.userId}
                        className="grid grid-cols-[56px_1fr_auto] items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5"
                      >
                        <span className="inline-flex items-center gap-1 text-sm font-bold text-slate-300">
                          <Medal className="h-3.5 w-3.5 text-violet-300" />#{entry.rank}
                        </span>
                        <div>
                          <p className="truncate text-sm font-semibold text-white">{entry.name}</p>
                          <p className="text-xs text-slate-400">Level {entry.level}</p>
                        </div>
                        <div className="text-right">
                          <p className="inline-flex items-center justify-end gap-1 text-sm font-semibold text-violet-200">
                            <Zap className="h-3.5 w-3.5" />
                            {entry.totalXP}
                          </p>
                          <p className="text-xs text-slate-400">{entry.streak}d streak</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-white/10 bg-white/[0.05] py-0 backdrop-blur-xl">
                <CardContent className="space-y-4 px-4 py-5 sm:px-5">
                  <div className="flex items-center justify-between">
                    <h2 className="inline-flex items-center gap-2 text-lg font-bold text-white">
                      <Flame className="h-4 w-4 text-cyan-300" />
                      Weekly session ranking
                    </h2>
                    <Badge className="bg-cyan-500/20 text-cyan-200">
                      Top {data.weekly.top.length}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    {data.weekly.top.map((entry) => (
                      <div
                        key={entry.userId}
                        className="grid grid-cols-[56px_1fr_auto] items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5"
                      >
                        <span className="inline-flex items-center gap-1 text-sm font-bold text-slate-300">
                          <Medal className="h-3.5 w-3.5 text-cyan-300" />#{entry.rank}
                        </span>
                        <div>
                          <p className="truncate text-sm font-semibold text-white">{entry.name}</p>
                          <p className="text-xs text-slate-400">{entry.sessions} sessions</p>
                        </div>
                        <div className="text-right">
                          <p className="inline-flex items-center justify-end gap-1 text-sm font-semibold text-cyan-200">
                            <Timer className="h-3.5 w-3.5" />
                            {formatMinutes(entry.focusMinutes)}
                          </p>
                          <p className="text-xs text-slate-400">{entry.weeklyXP} XP</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </section>
          </>
        )}
      </div>
    </div>
  )
}
