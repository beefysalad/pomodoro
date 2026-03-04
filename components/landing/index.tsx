'use client'

import { Flame, Zap, Target, BookOpen, BarChart2 } from 'lucide-react'
import { TickerWord } from './ticker-word'
import XpBar from './xp-bar'
import FeatureCard from './feature-card'
import { Header } from './header'

export default function LandingComponent() {
  return (
    <div className="bg-background text-foreground min-h-screen overflow-x-hidden">
      <Header />

      <section className="relative overflow-hidden pt-36 pb-20">
        <div className="pointer-events-none absolute inset-0">
          <div
            className="bg-violet/[0.07] absolute top-[5%] left-[10%] h-[500px] w-[500px] rounded-full blur-[100px]"
            style={{ animation: 'float-a 12s ease-in-out infinite' }}
          />
          <div
            className="absolute top-[20%] right-[5%] h-[350px] w-[350px] rounded-full bg-blue-500/[0.04] blur-[80px]"
            style={{ animation: 'float-b 10s ease-in-out infinite' }}
          />
          <div
            className="bg-success/[0.04] absolute bottom-[10%] left-[40%] h-[250px] w-[250px] rounded-full blur-[60px]"
            style={{ animation: 'float-c 14s ease-in-out infinite' }}
          />
          <div
            className="absolute inset-0 opacity-50"
            style={{
              backgroundImage:
                'linear-gradient(rgba(30,41,59,0.25) 1px, transparent 1px), linear-gradient(90deg, rgba(30,41,59,0.25) 1px, transparent 1px)',
              backgroundSize: '48px 48px',
              maskImage:
                'radial-gradient(ellipse 80% 50% at 50% 0%, black, transparent)',
            }}
          />
        </div>

        <div className="relative mx-auto max-w-[1120px] px-6 text-center">
          <div className="mb-7 inline-flex">
            <span className="border-violet/25 bg-violet/[0.08] text-violet-mid flex items-center gap-2 rounded-full border px-4 py-1.5 text-[10px] font-[700] tracking-[0.18em] uppercase">
              <span className="from-violet to-violet-mid flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-br text-[8px]">
                ✦
              </span>
              Now with Deep Focus Mode
            </span>
          </div>

          <h1 className="mb-5 text-[clamp(44px,7.5vw,84px)] leading-[1.0] font-[900] tracking-[-0.05em]">
            <span className="text-foreground block">Study smarter.</span>
            <span className="text-muted-foreground block font-[300]">
              Track your <TickerWord />.
            </span>
          </h1>

          <p className="text-text-sub mx-auto mb-10 max-w-[500px] text-[15px] leading-[1.8]">
            Tempo turns every study session into measurable progress. Earn XP,
            maintain streaks, and level up — the gamified focus system built for
            serious learners.
          </p>

          <div className="mb-12 flex flex-wrap items-center justify-center gap-3">
            <button className="border-violet bg-violet cursor-pointer rounded-[12px] border px-7 py-3.5 text-[14px] font-[700] tracking-[0.02em] text-white shadow-[0_0_30px_var(--color-violet-glow)] transition-all hover:-translate-y-px hover:shadow-[0_0_44px_var(--color-violet-glow)]">
              Start for free — no credit card
            </button>
            <button className="border-border bg-surface-up/80 text-muted-foreground hover:bg-surface-hi hover:text-foreground cursor-pointer rounded-[12px] border px-6 py-3.5 text-[14px] font-[600] backdrop-blur-sm transition-all">
              ▶ Watch 60s demo
            </button>
          </div>

          <div className="mb-16 flex items-center justify-center gap-3">
            <div className="flex">
              {[
                'bg-violet-mid',
                'bg-blue-400',
                'bg-success',
                'bg-amber',
                'bg-rose-500',
              ].map((c, i) => (
                <div
                  key={i}
                  className={`border-background h-7 w-7 rounded-full border-2 ${c} ${i > 0 ? '-ml-2.5' : ''} opacity-80`}
                />
              ))}
            </div>
            <span className="text-muted-foreground text-[12px]">
              Trusted by <strong className="text-text-sub">8,400+</strong>{' '}
              students worldwide
            </span>
          </div>

          {/* App Preview */}
          <div className="relative mx-auto max-w-[860px]">
            <div className="bg-violet/[0.05] pointer-events-none absolute -inset-10 rounded-full blur-[80px]" />
            <div className="border-border bg-surface relative overflow-hidden rounded-3xl border shadow-[0_40px_100px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.03)]">
              {/* Chrome */}
              <div className="border-border flex items-center gap-2 border-b px-5 py-3.5">
                {['bg-rose-500', 'bg-amber', 'bg-success'].map((c, i) => (
                  <div
                    key={i}
                    className={`h-2.5 w-2.5 rounded-full ${c} opacity-70`}
                  />
                ))}
                <div className="flex flex-1 justify-center">
                  <div className="border-border bg-surface-hi text-muted-foreground rounded-md border px-4 py-1 font-mono text-[11px]">
                    app.tempo.study
                  </div>
                </div>
                <div className="w-16" />
              </div>

              {/* Dashboard */}
              <div className="grid grid-cols-[180px_1fr] gap-5 p-6">
                {/* Sidebar */}
                <div className="flex flex-col gap-1">
                  <p className="text-muted-foreground/40 mb-3 px-2.5 text-[9px] font-[700] tracking-[0.16em] uppercase">
                    Subjects
                  </p>
                  {[
                    { name: 'Mathematics', emoji: '📐', active: true },
                    { name: 'Physics', emoji: '⚡', active: false },
                    { name: 'Chemistry', emoji: '🧪', active: false },
                    { name: 'History', emoji: '📚', active: false },
                  ].map((s) => (
                    <div
                      key={s.name}
                      className={`flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2.5 text-[12px] transition-all ${s.active ? 'border-violet/20 bg-violet/10 text-violet-mid border font-[600]' : 'text-muted-foreground/60 hover:bg-surface-up'}`}
                    >
                      <span className="text-[13px]">{s.emoji}</span>
                      {s.name}
                    </div>
                  ))}
                  <div className="mt-auto pt-4">
                    <div className="border-streak/20 bg-streak-bg rounded-xl border p-3">
                      <p className="text-streak mb-2 text-[10px] font-[700]">
                        🔥 7-Day Streak
                      </p>
                      <div className="flex gap-1">
                        {Array(7)
                          .fill(0)
                          .map((_, i) => (
                            <div
                              key={i}
                              className="bg-streak h-1 flex-1 rounded-full shadow-[0_0_6px_rgba(234,88,12,0.5)]"
                            />
                          ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Main */}
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      {
                        label: 'Total XP',
                        val: '2,840',
                        icon: '⚡',
                        color: 'text-violet-mid',
                      },
                      {
                        label: 'Level',
                        val: '12',
                        icon: '🏆',
                        color: 'text-amber',
                      },
                      {
                        label: 'Sessions',
                        val: '84',
                        icon: '🎯',
                        color: 'text-success',
                      },
                    ].map((s) => (
                      <div
                        key={s.label}
                        className="border-border bg-surface rounded-xl border p-3.5"
                      >
                        <div className="mb-1 text-base">{s.icon}</div>
                        <div
                          className={`text-[18px] font-[800] tracking-[-0.02em] ${s.color}`}
                        >
                          {s.val}
                        </div>
                        <div className="text-muted-foreground/40 text-[9px] font-[600] tracking-[0.08em] uppercase">
                          {s.label}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Timer */}
                  <div className="border-violet/20 from-violet/[0.08] flex flex-col items-center gap-4 rounded-2xl border bg-gradient-to-br to-indigo-500/[0.04] p-6">
                    <div className="flex gap-2">
                      {[
                        { l: '⚡ Blitz', a: false },
                        { l: '🎯 Focus', a: true },
                        { l: '🔬 Deep', a: false },
                      ].map((m) => (
                        <div
                          key={m.l}
                          className={`cursor-pointer rounded-lg px-3 py-1.5 text-[9px] font-[700] tracking-[0.04em] transition-all ${m.a ? 'border-violet-mid/40 bg-violet/20 text-violet-mid border shadow-[0_0_10px_var(--color-violet-glow)]' : 'border-border text-muted-foreground border'}`}
                        >
                          {m.l}
                        </div>
                      ))}
                    </div>
                    <div className="text-foreground font-mono text-[52px] leading-none font-[900] tracking-[-0.06em]">
                      24:00
                    </div>
                    <div className="w-full max-w-[200px]">
                      <XpBar value={0} />
                    </div>
                    <button className="border-violet bg-violet cursor-pointer rounded-xl border px-7 py-2.5 text-[12px] font-[700] text-white shadow-[0_0_20px_var(--color-violet-glow)]">
                      Start Session →
                    </button>
                  </div>

                  {/* XP bar */}
                  <div className="border-border bg-surface rounded-xl border p-3.5">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-violet-mid text-[11px] font-[700]">
                        LEVEL 12
                      </span>
                      <span className="text-muted-foreground font-mono text-[10px]">
                        840 / 1000 XP
                      </span>
                    </div>
                    <XpBar value={84} delay={200} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS STRIP */}
      <div className="border-border bg-surface/60 border-y backdrop-blur-md">
        <div className="divide-border mx-auto grid max-w-[1120px] grid-cols-4 divide-x px-6 py-5">
          {[
            { val: '8,400+', label: 'Active learners' },
            { val: '1.2M+', label: 'Sessions completed' },
            { val: '94%', label: 'Streak retention' },
            { val: '4.9 ★', label: 'Average rating' },
          ].map((s, i) => (
            <div key={i} className="px-6 text-center first:pl-0 last:pr-0">
              <div className="text-foreground mb-1 text-[22px] font-[900] tracking-[-0.04em]">
                {s.val}
              </div>
              <div className="text-muted-foreground text-[10px] font-[500] tracking-[0.1em] uppercase">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FEATURES */}
      <section id="features" className="py-24">
        <div className="mx-auto max-w-[1120px] px-6">
          <div className="mb-16 text-center">
            <span className="border-violet/20 bg-violet/[0.08] text-violet-mid mb-4 inline-block rounded-full border px-4 py-1 text-[10px] font-[700] tracking-[0.2em] uppercase">
              Features
            </span>
            <h2 className="text-foreground text-[clamp(28px,4vw,44px)] font-[900] tracking-[-0.04em]">
              Everything you need to
              <br />
              build unstoppable habits.
            </h2>
            <p className="text-muted-foreground mx-auto mt-4 max-w-[400px] text-[15px] leading-[1.7]">
              Not just a timer. A complete focus operating system.
            </p>
          </div>

          <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
            <FeatureCard
              icon={Flame}
              accentColor="text-streak"
              accentBg="bg-streak-bg"
              label="Daily Streaks"
              title="Don't break the chain."
              footer={
                <div>
                  <div className="mb-1.5 flex gap-1.5">
                    {[1, 1, 1, 1, 0, 0, 0].map((d, i) => (
                      <div
                        key={i}
                        className={`h-1.5 flex-1 rounded-full ${d ? 'bg-streak shadow-[0_0_8px_rgba(234,88,12,0.5)]' : 'bg-surface-hi'}`}
                      />
                    ))}
                  </div>
                  <p className="text-muted-foreground text-[9px] font-[600] tracking-[0.1em] uppercase">
                    4-day streak · 3 to next milestone
                  </p>
                </div>
              }
            >
              Study any session per day to keep your streak alive. Hit 7, 14,
              and 30-day milestones for massive XP bonuses.
            </FeatureCard>

            <FeatureCard
              icon={Zap}
              accentColor="text-violet-mid"
              accentBg="bg-violet/10"
              label="XP & Levels"
              title="Every session earns XP."
              footer={
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-violet-mid text-[10px] font-[700]">
                      Level 3
                    </span>
                    <span className="text-muted-foreground font-mono text-[9px]">
                      285 / 300 XP
                    </span>
                  </div>
                  <XpBar value={95} />
                </div>
              }
            >
              Blitz earns 10 XP. Focus gives 25. Deep rewards 50. Level up as
              you grind — your progress is always visible.
            </FeatureCard>

            <FeatureCard
              icon={Target}
              accentColor="text-success"
              accentBg="bg-success-bg"
              label="Focus Modes"
              title="Pick your depth."
              footer={
                <div className="flex gap-2">
                  {[
                    {
                      l: '⚡ Blitz',
                      cls: 'border-border text-muted-foreground',
                    },
                    {
                      l: '🎯 Focus',
                      cls: 'border-violet-mid/40 bg-violet/10 text-violet-mid shadow-[0_0_10px_var(--color-violet-glow)]',
                    },
                    {
                      l: '🔬 Deep',
                      cls: 'border-border text-muted-foreground',
                    },
                  ].map((m) => (
                    <div
                      key={m.l}
                      className={`flex-1 rounded-lg border py-1.5 text-center text-[9px] font-[700] tracking-[0.04em] ${m.cls}`}
                    >
                      {m.l}
                    </div>
                  ))}
                </div>
              }
            >
              Blitz for quick review. Focus for classic Pomodoro. Deep for
              50-minute sessions when it really matters.
            </FeatureCard>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FeatureCard
              icon={BookOpen}
              accentColor="text-blue-400"
              accentBg="bg-blue-500/10"
              label="Subject Library"
              title="Organize everything you study."
              footer={null}
            >
              Create subjects, tag sessions, and track performance per topic.
              Know exactly where you&apos;re strong and where to focus next.
            </FeatureCard>
            <FeatureCard
              icon={BarChart2}
              accentColor="text-amber"
              accentBg="bg-amber/10"
              label="Progress Analytics"
              title="See your growth over time."
              footer={null}
            >
              Weekly heatmaps, subject breakdowns, session histories, and XP
              trends. Your data tells a story of consistent improvement.
            </FeatureCard>
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="mx-auto max-w-[1120px] px-6">
          <h2 className="text-foreground mb-14 text-center text-[clamp(24px,3.5vw,38px)] font-[900] tracking-[-0.03em]">
            What students are saying.
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {[
              {
                name: 'Maya R.',
                role: 'Med student',
                avatar: 'bg-violet-mid',
                quote:
                  "I've tried every Pomodoro app. Tempo is the first one I've actually stuck with. The streak system is addictive in the best way.",
              },
              {
                name: 'James T.',
                role: 'CS sophomore',
                avatar: 'bg-blue-400',
                quote:
                  'The XP system sounds gimmicky but it genuinely changed how I approach studying. I think about earning XP before I open Netflix now.',
              },
              {
                name: 'Sofia L.',
                role: 'Bar exam prep',
                avatar: 'bg-success',
                quote:
                  'Made it to a 34-day streak during bar prep. Tempo gave me structure when I needed it most. Passed on my first try.',
              },
            ].map((t, i) => (
              <div
                key={i}
                className="border-border bg-surface hover:border-border-up hover:bg-surface-up flex flex-col overflow-hidden rounded-2xl border p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(0,0,0,0.4)]"
              >
                <p className="text-amber mb-4 text-[18px] tracking-widest">
                  ★★★★★
                </p>
                <p className="text-muted-foreground mb-6 flex-1 text-[13px] leading-[1.8] italic">
                  &quot;{t.quote}&quot;
                </p>
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-full text-[13px] font-[700] text-white opacity-80 ${t.avatar}`}
                  >
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="text-text-sub text-[12px] font-[700]">
                      {t.name}
                    </p>
                    <p className="text-muted-foreground text-[10px]">
                      {t.role}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BOTTOM CTA */}
      <section className="px-6 pb-28">
        <div className="border-violet/20 from-violet/[0.1] relative mx-auto max-w-[860px] overflow-hidden rounded-3xl border bg-gradient-to-br to-indigo-500/[0.04] p-16 text-center md:p-24">
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="bg-violet/[0.1] h-[300px] w-[500px] rounded-full blur-[100px]" />
          </div>
          <div className="relative">
            <div className="bg-violet-mid/20 mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-2xl shadow-[0_0_20px_var(--color-violet-glow)]">
              <Zap className="text-violet-mid h-5 w-5" />
            </div>
            <h2 className="text-foreground text-[clamp(32px,5.5vw,52px)] leading-[1.05] font-[900] tracking-[-0.04em]">
              Your streak starts at zero.
            </h2>
            <p className="text-muted-foreground mt-2 mb-10 text-[clamp(20px,3vw,30px)] font-[300] tracking-[-0.03em]">
              So does everyone else&apos;s.
            </p>
            <p className="text-text-sub mx-auto mb-10 max-w-[400px] text-[15px] leading-[1.7]">
              Join thousands of students already turning their study sessions
              into a daily habit.
            </p>
            <button className="border-violet bg-violet cursor-pointer rounded-[14px] border px-10 py-4 text-[15px] font-[700] tracking-[0.02em] text-white shadow-[0_0_36px_var(--color-violet-glow),inset_0_1px_0_rgba(255,255,255,0.15)] transition-all hover:-translate-y-1 hover:shadow-[0_0_50px_var(--color-violet-glow)]">
              Start your journey today
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-border border-t px-6 pt-14 pb-10">
        <div className="mx-auto max-w-[1120px]">
          <div className="mb-12 grid grid-cols-1 gap-10 md:grid-cols-[2fr_1fr_1fr_1fr]">
            <div>
              <div className="mb-4 flex items-center gap-2">
                <div className="from-violet flex h-7 w-7 items-center justify-center rounded-[7px] bg-gradient-to-br to-indigo-500 text-[13px]">
                  ⚡
                </div>
                <span className="text-[16px] font-[800] tracking-[-0.02em]">
                  tempo
                </span>
              </div>
              <p className="text-muted-foreground max-w-[220px] text-[13px] leading-[1.7]">
                A gamified focus system built for students who refuse to stay
                average.
              </p>
            </div>
            {[
              {
                title: 'Product',
                links: ['Features', 'Pricing', 'Changelog', 'Roadmap'],
              },
              {
                title: 'Company',
                links: ['About', 'Blog', 'Careers', 'Press'],
              },
              {
                title: 'Legal',
                links: ['Privacy', 'Terms', 'Cookies', 'Security'],
              },
            ].map((col) => (
              <div key={col.title}>
                <p className="text-muted-foreground/40 mb-4 text-[10px] font-[700] tracking-[0.16em] uppercase">
                  {col.title}
                </p>
                {col.links.map((l) => (
                  <a
                    key={l}
                    href="#"
                    className="text-muted-foreground hover:text-text-sub mb-2 block text-[13px] transition-colors"
                  >
                    {l}
                  </a>
                ))}
              </div>
            ))}
          </div>
          <div className="border-border flex items-center justify-between border-t pt-6">
            <span className="text-muted-foreground text-[12px]">
              © 2026 Tempo. All rights reserved.
            </span>
            <span className="text-muted-foreground/30 text-[12px]">
              Built for learners who mean it.
            </span>
          </div>
        </div>
      </footer>
    </div>
  )
}
