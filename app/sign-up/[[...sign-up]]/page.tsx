import { SignUp } from '@clerk/nextjs'
import Link from 'next/link'
import { ArrowLeft, BookOpen } from 'lucide-react'

export default function SignUpPage() {
  return (
    <div className="bg-background relative flex min-h-screen flex-col items-center justify-center overflow-hidden p-4">
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="bg-violet/10 absolute top-1/2 left-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[120px]" />
      </div>

      <Link
        href="/"
        className="text-text-sub hover:text-foreground group absolute top-8 left-8 z-20 flex items-center gap-2 text-sm font-medium transition-colors"
      >
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
        Back to Home
      </Link>

      <div className="relative z-10 w-full max-w-[400px]">
        <div className="mb-8 flex items-center justify-center gap-2">
          <div className="from-violet to-violet-mid flex h-8 w-8 items-center justify-center rounded-[8px] bg-gradient-to-br text-white shadow-[0_0_14px_var(--color-violet-glow)]">
            <BookOpen className="h-[16px] w-[16px]" />
          </div>
          <span className="text-foreground text-[20px] font-[800] tracking-[-0.03em]">
            Tempo
          </span>
        </div>

        <SignUp />
      </div>
    </div>
  )
}
