export const dynamic = 'force-dynamic'

import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <div className="from-violet mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br to-indigo-500 text-[24px] shadow-[0_0_20px_var(--color-violet-glow)]">
        ⚡
      </div>
      <h2 className="text-foreground mb-4 text-[36px] font-[900] tracking-[-0.04em]">
        404 - Not Found
      </h2>
      <p className="text-muted-foreground mb-8 max-w-[400px] text-[16px]">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link
        href="/"
        className="border-violet bg-violet cursor-pointer rounded-[9px] border px-6 py-3 text-[14px] font-[700] text-white shadow-[0_0_20px_var(--color-violet-glow)] transition-all hover:-translate-y-px hover:shadow-[0_0_32px_var(--color-violet-glow)]"
      >
        Return Home
      </Link>
    </div>
  )
}
