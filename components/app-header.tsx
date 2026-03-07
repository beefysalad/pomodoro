'use client'

import Link from 'next/link'
import { UserButton } from '@clerk/nextjs'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import {
  BarChart3,
  BookOpen,
  Home,
  Settings as SettingsIcon,
  Trophy,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUser } from '@/hooks/use-user'

const NAV_LINKS = [
  { href: '/dashboard', label: 'Dashboard', shortLabel: 'Home', icon: Home },
  { href: '/stats', label: 'Stats', shortLabel: 'Stats', icon: BarChart3 },
  { href: '/leaderboard', label: 'Leaderboard', shortLabel: 'Ranks', icon: Trophy },
  { href: '/subjects', label: 'Subjects', shortLabel: 'Subjects', icon: BookOpen },
  { href: '/settings', label: 'Settings', shortLabel: 'Settings', icon: SettingsIcon },
]

export function AppHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const { data: user, isLoading } = useUser()

  useEffect(() => {
    if (isLoading || !user) return
    if (!user.onboarded && pathname !== '/onboarding') {
      router.replace('/onboarding')
    }
  }, [isLoading, pathname, router, user])

  return (
    <>
      <header className="space-y-2 border-b border-slate-800 px-1 pb-2 sm:space-y-0 sm:px-0 sm:pb-3">
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard"
            className="leading-none text-white transition hover:text-violet-200"
          >
            <span className="block text-base font-black tracking-tight sm:text-lg">
              Tempo
            </span>
            <span className="mt-0.5 block text-[9px] font-semibold tracking-[0.12em] text-slate-400 uppercase sm:text-[10px] sm:tracking-[0.14em]">
              by Patrick
            </span>
          </Link>

          <UserButton
            appearance={{
              elements: {
                avatarBox:
                  'w-8 h-8 border border-violet-400/50 sm:w-9 sm:h-9 sm:border-2',
              },
            }}
          />
        </div>

        <div className="hidden sm:block">
          <nav className="flex items-center justify-center gap-1.5 p-0.5">
            {NAV_LINKS.map((link) => {
              const isActive =
                pathname === link.href ||
                (link.href !== '/dashboard' && pathname.startsWith(link.href))

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'rounded-md px-3.5 py-1.5 text-sm font-semibold whitespace-nowrap transition',
                    isActive
                      ? 'bg-violet-600 text-white'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100'
                  )}
                >
                  {link.label}
                </Link>
              )
            })}
          </nav>
        </div>
      </header>

      <nav className="fixed right-3 bottom-3 left-3 z-40 rounded-2xl border border-slate-700/80 bg-[#0b1220]/96 p-1.5 shadow-2xl backdrop-blur-xl sm:hidden">
        <div className="grid grid-cols-5 gap-1">
          {NAV_LINKS.map((link) => {
            const isActive =
              pathname === link.href ||
              (link.href !== '/dashboard' && pathname.startsWith(link.href))
            const Icon = link.icon

            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'flex flex-col items-center gap-1 rounded-xl px-1 py-1.5 text-[10px] font-semibold transition',
                  isActive
                    ? 'bg-violet-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800/80'
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="leading-none">{link.shortLabel}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
