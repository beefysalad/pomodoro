'use client'

import Link from 'next/link'
import { UserButton } from '@clerk/nextjs'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { cn } from '@/lib/utils'
import { useUser } from '@/hooks/use-user'

const NAV_LINKS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/stats', label: 'Stats' },
  { href: '/leaderboard', label: 'Leaderboard' },
  { href: '/subjects', label: 'Subjects' },
  { href: '/settings', label: 'Settings' },
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

      <div className="-mx-1 overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex justify-center">
          <nav className="inline-flex min-w-max items-center gap-1.5 p-0.5">
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
      </div>
    </header>
  )
}
