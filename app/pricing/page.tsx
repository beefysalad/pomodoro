'use client'
import { PricingCard } from '@/components/landing/pricing-card'
import { motion } from 'framer-motion'
import { Header } from '@/components/landing/header'

export default function PricingPage() {
  return (
    <div className="bg-background text-foreground min-h-screen overflow-x-hidden">
      <Header />
      <section className="mx-auto max-w-[1120px] px-7 py-28">
        <div className="mb-14 text-center">
          <p className="text-muted-foreground mb-3 text-[10px] font-[600] tracking-[0.2em] uppercase">
            Pricing
          </p>
          <h1 className="text-foreground mb-4 text-[clamp(32px,4vw,48px)] font-[900] tracking-[-0.04em]">
            Simple, transparent, and 100% free.
          </h1>
          <p className="text-muted-foreground mx-auto max-w-[500px] text-[15px] leading-[1.6]">
            Tempo is entirely free to use right now as we build out the core
            experience. Enjoy all Pro features at absolutely no cost.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="flex flex-col gap-4 md:flex-row"
        >
          <PricingCard
            plan="Starter"
            price={0}
            desc="Perfect for building the habit."
            currency="₱"
            features={[
              '3 subjects',
              'Blitz & Focus modes',
              'Streak tracking',
              'Basic XP & levels',
              '7-day history',
            ]}
            highlighted={false}
          />
          <PricingCard
            plan="Pro"
            price={0}
            desc="For students serious about results."
            currency="₱"
            features={[
              'Unlimited subjects',
              'All 3 focus modes',
              'Full analytics dashboard',
              'XP multipliers & bonuses',
              'Leaderboards',
              'Priority support',
            ]}
            highlighted={true}
          />
          <PricingCard
            plan="Teams"
            price={0}
            desc="For study groups & classrooms."
            currency="₱"
            features={[
              'Everything in Pro',
              'Up to 20 members',
              'Shared leaderboard',
              'Admin dashboard',
              'Custom challenges',
              'SSO & SAML',
            ]}
            highlighted={false}
          />
        </motion.div>
      </section>
    </div>
  )
}
