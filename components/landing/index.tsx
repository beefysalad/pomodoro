'use client'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { SignedIn, SignedOut } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const HERO_FEATURES = [
  {
    val: '3 modes',
    label: 'Blitz · Focus · Deep',
    color: 'text-violet-mid',
  },
  {
    val: 'XP + Levels',
    label: 'Earn rewards per session',
    color: 'text-streak',
  },
  {
    val: 'Daily streaks',
    label: 'Study every day to keep it',
    color: 'text-success',
  },
]
const FOCUS_MODE = [
  {
    label: '⚡ Blitz',
    active: false,
    color: 'text-amber   border-border        bg-transparent',
  },
  {
    label: '🎯 Focus',
    active: true,
    color:
      'text-violet-mid border-violet-mid/50 bg-violet-glow shadow-[0_0_10px_var(--color-violet-glow)]',
  },
  {
    label: '🔬 Deep',
    active: false,
    color: 'text-muted-foreground border-border bg-transparent',
  },
]
const LandingComponent = () => {
  return (
    <div className="bg-background text-foreground selection:bg-violet-glow selection:text-violet-mid flex min-h-screen flex-col overflow-x-hidden font-mono">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="bg-violet/15 absolute -top-[10%] left-[40%] h-[600px] w-[700px] -translate-x-1/2 animate-[float-a_14s_ease-in-out_infinite] rounded-full blur-[120px]" />

        <div className="bg-violet/[0.06] absolute -right-[5%] bottom-[10%] h-[400px] w-[500px] animate-[float-b_18s_ease-in-out_infinite] rounded-full blur-[100px]" />

        <div className="bg-streak/[0.06] absolute top-[40%] -left-[5%] h-[300px] w-[300px] animate-[float-c_11s_ease-in-out_infinite] rounded-full blur-[90px]" />

        <div
          className="absolute inset-0 opacity-100"
          style={{
            backgroundImage:
              'linear-gradient(rgba(30,45,69,0.45) 1px, transparent 1px), linear-gradient(90deg, rgba(30,45,69,0.45) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
            maskImage:
              'radial-gradient(ellipse 80% 50% at 50% 0%, black 0%, transparent 100%)',
          }}
        />
      </div>

      <motion.nav
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="border-border bg-background/85 sticky top-0 z-50 border-b backdrop-blur-xl"
      >
        <div className="mx-auto flex h-[52px] max-w-[880px] items-center justify-between px-7">
          <div className="flex items-center gap-2.5">
            <div className="from-violet to-violet-mid flex h-7 w-7 items-center justify-center rounded-[7px] bg-gradient-to-br text-sm shadow-[0_0_14px_var(--color-violet-glow)]">
              📚
            </div>
            <span className="text-foreground text-[15px] font-[800] tracking-[-0.03em]">
              Tempo
            </span>
          </div>

          <div className="flex items-center gap-2">
            <SignedOut>
              <Link
                href="/sign-in"
                className="text-text-sub hover:text-foreground px-3 py-1.5 text-[11px] font-[500] tracking-[0.04em] transition-colors"
              >
                Sign in
              </Link>
              <Button
                asChild
                size="sm"
                variant="secondary"
                className="bg-surface-up border-border hover:bg-surface-hi h-8 rounded-[6px] border px-3 text-[11px] font-[600] tracking-[0.04em]"
              >
                <Link href="/sign-up">Get started →</Link>
              </Button>
            </SignedOut>
            <SignedIn>
              <Button
                asChild
                size="sm"
                className="bg-violet border-violet hover:bg-violet/90 h-8 rounded-[6px] border px-3 text-[11px] font-[600] tracking-[0.04em] text-white shadow-[0_0_14px_var(--color-violet-glow)]"
              >
                <Link href="/dashboard">Dashboard →</Link>
              </Button>
            </SignedIn>
          </div>
        </div>
      </motion.nav>

      <main className="relative z-10 flex-1">
        <div className="mx-auto max-w-[880px] px-7 pt-28 pb-20 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="mb-8 inline-flex"
          >
            <Badge
              variant="outline"
              className="bg-violet-glow border-violet/25 text-violet-mid gap-2 rounded-full px-4 py-1 text-[10px] font-[600] tracking-[0.18em] uppercase"
            >
              <span className="bg-violet-mid h-1.5 w-1.5 animate-pulse rounded-full shadow-[0_0_8px_var(--color-violet-mid)]" />
              Gamified Focus System
            </Badge>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15, ease: 'easeOut' }}
            className="text-foreground mb-2 text-[clamp(42px,8vw,76px)] leading-[1.0] font-[900] tracking-[-0.04em]"
          >
            Study at night.
          </motion.h1>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25, ease: 'easeOut' }}
            className="text-muted-foreground mb-10 text-[clamp(42px,8vw,76px)] leading-[1.05] font-[300] tracking-[-0.04em]"
          >
            Level up every day.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.32, ease: 'easeOut' }}
            className="text-text-sub mx-auto mb-10 max-w-[460px] text-[14px] leading-[1.85] md:text-[15px]"
          >
            Organize subjects, launch timed sessions on specific topics, earn
            XP, and keep your streak alive. Focus has never felt this good.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4, ease: 'easeOut' }}
            className="flex flex-wrap justify-center gap-3"
          >
            <SignedOut>
              <Button
                asChild
                size="lg"
                className="bg-violet border-violet hover:bg-violet/90 rounded-[8px] border px-7 py-3 text-[13px] font-[700] tracking-[0.04em] text-white shadow-[0_0_24px_var(--color-violet-glow),inset_0_1px_0_rgba(255,255,255,0.1)] transition-all hover:-translate-y-px hover:shadow-[0_0_36px_var(--color-violet-glow)]"
              >
                <Link href="/sign-up">
                  Start for free{' '}
                  <span className="text-[10px] opacity-80">▶</span>
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="bg-surface-up/80 border-border hover:bg-surface-hi rounded-[8px] px-6 py-3 text-[13px] font-[600] tracking-[0.04em] backdrop-blur-sm"
              >
                <Link href="#features">See how it works</Link>
              </Button>
            </SignedOut>
            <SignedIn>
              <Button
                asChild
                size="lg"
                className="bg-violet border-violet hover:bg-violet/90 rounded-[8px] border px-7 py-3 text-[13px] font-[700] tracking-[0.04em] text-white shadow-[0_0_24px_var(--color-violet-glow)]"
              >
                <Link href="/dashboard">Enter Dashboard →</Link>
              </Button>
            </SignedIn>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.55 }}
            className="mt-6 flex items-center justify-center gap-2"
          >
            <div className="flex">
              {[
                'bg-violet-mid',
                'bg-success',
                'bg-streak',
                'bg-foreground/60',
                'bg-violet/70',
              ].map((bg, i) => (
                <div
                  key={i}
                  className={`border-background h-[22px] w-[22px] rounded-full border-2 ${bg} ${i > 0 ? '-ml-2' : ''}`}
                />
              ))}
            </div>
            <span className="text-muted-foreground text-[11px]">
              Join students already leveling up
            </span>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="border-border bg-surface/60 border-y backdrop-blur-md"
        >
          <div className="divide-border mx-auto grid max-w-[880px] grid-cols-3 divide-x px-7 py-5">
            {HERO_FEATURES.map((s, i) => (
              <div key={i} className="px-6 text-center first:pl-0 last:pr-0">
                <div
                  className={`${s.color} mb-1 text-[15px] font-[800] tracking-[-0.02em]`}
                >
                  {s.val}
                </div>
                <div className="text-muted-foreground text-[10px] font-[500] tracking-[0.08em]">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <section id="features" className="mx-auto max-w-[880px] px-7 py-20">
          <div className="mb-12 text-center">
            <p className="text-muted-foreground mb-3 text-[10px] font-[600] tracking-[0.2em] uppercase">
              How it works
            </p>
            <h2 className="text-foreground text-[28px] font-[800] tracking-[-0.03em]">
              Built around how you actually study.
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5, ease: 'easeOut' }}
              className="bg-surface border-border hover:bg-surface-up group hover:border-border-up relative flex flex-col overflow-hidden rounded-2xl border p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(0,0,0,0.4)]"
            >
              <div className="bg-streak/[0.07] group-hover:bg-streak/[0.12] absolute -top-10 -right-10 h-32 w-32 rounded-full blur-2xl transition-all duration-300" />
              <div className="via-streak/30 absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <span className="mb-5 text-3xl drop-shadow-[0_0_10px_#EA580C]">
                🔥
              </span>
              <p className="text-streak mb-2 text-[10px] font-[600] tracking-[0.14em]">
                STREAKS
              </p>
              <h3 className="text-foreground mb-2.5 text-[15px] font-[800] tracking-[-0.02em]">
                Don&apos;t break the chain.
              </h3>
              <p className="text-muted-foreground mb-5 text-[12px] leading-[1.75]">
                Study any session per day to keep your streak alive. Hit 7, 14,
                30-day milestones for massive XP bonuses.
              </p>

              <div className="mt-auto">
                <div className="mb-2 flex gap-1.5">
                  {[true, true, true, true, false, false, false].map(
                    (done, i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-all ${done ? 'bg-streak shadow-[0_0_6px_rgba(234,88,12,0.5)]' : 'bg-surface-hi'}`}
                      />
                    )
                  )}
                </div>
                <p className="text-muted-foreground text-[9px] tracking-[0.1em]">
                  4-DAY STREAK · 3 TO NEXT MILESTONE
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.65, ease: 'easeOut' }}
              className="bg-surface border-border hover:bg-surface-up group hover:border-border-up relative flex flex-col overflow-hidden rounded-2xl border p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(0,0,0,0.4)]"
            >
              <div className="bg-violet/[0.08] group-hover:bg-violet/[0.14] absolute -top-10 -right-10 h-32 w-32 rounded-full blur-2xl transition-all duration-300" />
              <div className="via-violet-mid/30 absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <span className="mb-5 text-3xl drop-shadow-[0_0_10px_#A78BFA]">
                ⚡
              </span>
              <p className="text-violet-mid mb-2 text-[10px] font-[600] tracking-[0.14em]">
                XP & LEVELS
              </p>
              <h3 className="text-foreground mb-2.5 text-[15px] font-[800] tracking-[-0.02em]">
                Every session earns you XP.
              </h3>
              <p className="text-muted-foreground mb-5 text-[12px] leading-[1.75]">
                Blitz gives 10 XP. Focus gives 25. Deep gives 50. Level up as
                you grind — your progress is always visible.
              </p>

              <div className="mt-auto">
                <div className="mb-1.5 flex justify-between">
                  <span className="text-violet-mid text-[10px] font-[700]">
                    LEVEL 3
                  </span>
                  <span className="text-muted-foreground text-[10px]">
                    285 / 300 XP
                  </span>
                </div>
                <div className="bg-surface-hi border-border h-1 overflow-hidden rounded-full border">
                  <div className="from-violet to-violet-mid h-full w-[95%] rounded-full bg-gradient-to-r shadow-[0_0_10px_var(--color-violet-glow)]" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8, ease: 'easeOut' }}
              className="bg-surface border-border hover:bg-surface-up group hover:border-border-up relative flex flex-col overflow-hidden rounded-2xl border p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(0,0,0,0.4)]"
            >
              <div className="bg-success/[0.07] group-hover:bg-success/[0.12] absolute -top-10 -right-10 h-32 w-32 rounded-full blur-2xl transition-all duration-300" />
              <div className="via-success/30 absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <span className="mb-5 text-3xl drop-shadow-[0_0_10px_#10B981]">
                🎯
              </span>
              <p className="text-success mb-2 text-[10px] font-[600] tracking-[0.14em]">
                FOCUS MODES
              </p>
              <h3 className="text-foreground mb-2.5 text-[15px] font-[800] tracking-[-0.02em]">
                Pick your depth.
              </h3>
              <p className="text-muted-foreground mb-5 text-[12px] leading-[1.75]">
                Blitz for quick review. Focus for classic Pomodoro. Deep for
                50-minute sessions when it really matters.
              </p>

              <div className="mt-auto flex gap-2">
                {FOCUS_MODE.map((m) => (
                  <div
                    key={m.label}
                    className={`flex-1 rounded-md border py-1.5 text-center text-[9px] font-[700] tracking-[0.04em] ${m.color}`}
                  >
                    {m.label}
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.9 }}
          className="border-border bg-surface/40 relative mx-7 mb-20 overflow-hidden rounded-[20px] border p-16 text-center backdrop-blur-md"
          style={{
            background:
              'linear-gradient(135deg, rgba(124,58,237,0.08) 0%, rgba(13,17,23,0.85) 60%)',
          }}
        >
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="bg-violet/10 h-[200px] w-[400px] rounded-full blur-[80px]" />
          </div>
          <div className="relative z-10">
            <p className="text-violet-mid mb-4 text-[10px] font-[600] tracking-[0.2em] uppercase">
              Start today
            </p>
            <h2 className="text-foreground text-[clamp(26px,5vw,42px)] leading-tight font-[900] tracking-[-0.04em]">
              Your streak starts at zero.
            </h2>
            <h2 className="text-muted-foreground mb-8 text-[clamp(26px,5vw,42px)] font-[300] tracking-[-0.04em]">
              So does everyone else&apos;s.
            </h2>
            <Button
              asChild
              size="lg"
              className="bg-violet border-violet hover:bg-violet/90 rounded-[8px] border px-9 py-3.5 text-[14px] font-[700] tracking-[0.04em] text-white shadow-[0_0_28px_var(--color-violet-glow),inset_0_1px_0_rgba(255,255,255,0.1)] transition-all hover:-translate-y-px"
            >
              <Link href="/sign-up">Create free account →</Link>
            </Button>
          </div>
        </motion.div>

        <div className="border-border border-t px-7 py-6">
          <div className="mx-auto flex max-w-[880px] items-center justify-between">
            <span className="text-foreground text-[13px] font-[800] tracking-[-0.02em]">
              Tempo
            </span>
            <span className="text-muted-foreground/40 text-[10px] tracking-[0.08em]">
              BUILT FOR FOCUS
            </span>
          </div>
        </div>
      </main>
    </div>
  )
}

export default LandingComponent
