'use client'

import { Header } from '@/components/landing/header'

export default function FAQPage() {
  return (
    <div className="bg-background text-foreground min-h-screen overflow-x-hidden">
      <Header />
      <section className="mx-auto max-w-[880px] px-7 py-28">
        <div className="mb-14 text-center">
          <p className="text-muted-foreground mb-3 text-[10px] font-[600] tracking-[0.2em] uppercase">
            Help Center
          </p>
          <h1 className="text-foreground text-[36px] font-[900] tracking-[-0.04em]">
            Frequently Asked Questions
          </h1>
        </div>

        <div className="mx-auto grid max-w-[680px] gap-6">
          <div className="bg-surface/50 border-border rounded-2xl border p-6">
            <h4 className="text-foreground mb-2 text-[16px] font-[700] tracking-[-0.01em]">
              Why is Tempo free?
            </h4>
            <p className="text-muted-foreground text-[14px] leading-[1.6]">
              I know how frustrating it is to hit a paywall just to unlock basic
              study tools. I&apos;m keeping the core gamified focus timer 100%
              free.
            </p>
          </div>

          <div className="bg-surface/50 border-border rounded-2xl border p-6">
            <h4 className="text-foreground mb-2 text-[16px] font-[700] tracking-[-0.01em]">
              How do I keep my streak alive?
            </h4>
            <p className="text-muted-foreground text-[14px] leading-[1.6]">
              To maintain your daily learning streak, you just need to complete
              any one focus session (even a simple 10-minute Blitz session)
              before midnight in your local timezone.
            </p>
          </div>

          <div className="bg-surface/50 border-border rounded-2xl border p-6">
            <h4 className="text-foreground mb-2 text-[16px] font-[700] tracking-[-0.01em]">
              Can I use it on my phone?
            </h4>
            <p className="text-muted-foreground text-[14px] leading-[1.6]">
              Absolutely! Tempo is a highly responsive web application. You can
              log in from any mobile browser and your sessions, XP, and streak
              will instantly sync with your desktop.
            </p>
          </div>

          <div className="bg-surface/50 border-border rounded-2xl border p-6">
            <h4 className="text-foreground mb-2 text-[16px] font-[700] tracking-[-0.01em]">
              What are the different focus modes?
            </h4>
            <p className="text-muted-foreground text-[14px] leading-[1.6]">
              We split studying into three categories: <strong>Blitz</strong>{' '}
              (15 mins) for quick reviews, <strong>Focus</strong> (25 mins) for
              classic Pomodoro pacing, and <strong>Deep</strong> (50 mins) for
              when you need to grind out difficult concepts. The longer the
              session, the more XP you earn!
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
