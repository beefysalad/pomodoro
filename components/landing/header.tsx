'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export function Header() {
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const fn = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  return (
    <nav
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${scrollY > 60 ? 'border-border bg-background/90 border-b backdrop-blur-xl' : ''}`}
    >
      <div className="mx-auto flex h-16 max-w-[1120px] items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="from-violet flex h-8 w-8 items-center justify-center rounded-[9px] bg-gradient-to-br to-indigo-500 text-[14px] shadow-[0_0_20px_var(--color-violet-glow)]">
            ⚡
          </div>
          <span className="text-[18px] font-[800] tracking-[-0.02em]">
            Tempo
          </span>
        </Link>
        <div className="hidden items-center gap-8 md:flex">
          {['Features', 'Pricing', 'FAQ'].map((l) => (
            <Link
              key={l}
              href={l === 'Features' ? '/#features' : `/${l.toLowerCase()}`}
              className="text-muted-foreground hover:text-foreground text-[13px] font-[500] transition-colors"
            >
              {l}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/sign-in"
            className="border-border text-muted-foreground hover:bg-surface-up hover:text-foreground cursor-pointer rounded-[9px] border bg-transparent px-4 py-2 text-[13px] font-[600] transition-all"
          >
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className="border-violet bg-violet cursor-pointer rounded-[9px] border px-4 py-2 text-[13px] font-[700] text-white shadow-[0_0_20px_var(--color-violet-glow)] transition-all hover:-translate-y-px hover:shadow-[0_0_32px_var(--color-violet-glow)]"
          >
            Get started →
          </Link>
        </div>
      </div>
    </nav>
  )
}
