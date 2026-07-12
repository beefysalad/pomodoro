'use client'

import { motion, type Variants } from 'framer-motion'
import {
  Flame,
  GalleryVerticalEnd,
  LayersIcon,
  Rocket,
  Trophy,
  Zap,
} from 'lucide-react'

const FEATURES = [
  {
    icon: Zap,
    title: 'XP + Levels',
    description: 'Finish sessions to earn XP and level up over time.',
    color: 'from-yellow-500/20 to-orange-500/10 border-yellow-500/30',
    iconColor: 'text-yellow-400',
  },
  {
    icon: Flame,
    title: 'Daily Streak',
    description: 'Study every day to build momentum you can feel.',
    color: 'from-orange-500/20 to-red-500/10 border-orange-500/30',
    iconColor: 'text-orange-400',
  },
  {
    icon: Trophy,
    title: 'Achievements',
    description: 'Unlock milestones for consistency and deep focus.',
    color: 'from-amber-500/20 to-yellow-500/10 border-amber-500/30',
    iconColor: 'text-amber-400',
  },
  {
    icon: LayersIcon,
    title: 'Flashcard Decks',
    description:
      "Create decks per subject and quiz yourself anytime. Set up whenever you're ready.",
    color: 'from-violet-500/20 to-purple-500/10 border-violet-500/30',
    iconColor: 'text-violet-400',
    badge: 'New',
  },
  {
    icon: Rocket,
    title: 'Quests',
    description: 'Daily quests guide your next move for fast progress.',
    color: 'from-cyan-500/20 to-blue-500/10 border-cyan-500/30',
    iconColor: 'text-cyan-400',
  },
  {
    icon: GalleryVerticalEnd,
    title: 'Leaderboard',
    description: 'See where you stack up against other learners weekly.',
    color: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/30',
    iconColor: 'text-emerald-400',
  },
]

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.96 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { delay: i * 0.08, duration: 0.35, ease: 'easeOut' },
  }),
}

export function FeaturesStep() {
  return (
    <div className="space-y-8">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-purple-500/30 bg-purple-600/20 text-2xl">
        🌟
      </div>
      <div className="space-y-2">
        <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
          Here is what you can do
        </h2>
        <p className="mx-auto max-w-2xl text-sm text-slate-400">
          Tools that keep you consistent and make study feel lighter.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((feature, i) => (
          <motion.div
            key={feature.title}
            custom={i}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileHover={{ scale: 1.02, y: -2 }}
            className={`relative rounded-2xl border bg-gradient-to-br p-5 ${feature.color} cursor-default transition-shadow hover:shadow-[0_0_24px_rgba(0,0,0,0.3)]`}
          >
            {feature.badge && (
              <span className="absolute top-2.5 right-2.5 rounded-full border border-violet-400/40 bg-violet-500/30 px-2 py-0.5 text-[10px] font-bold text-violet-300">
                {feature.badge}
              </span>
            )}
            <feature.icon className={`mb-3 h-6 w-6 ${feature.iconColor}`} />
            <p className="mb-1.5 text-[15px] font-bold text-white">
              {feature.title}
            </p>
            <p className="text-[13px] leading-relaxed text-slate-400">
              {feature.description}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
