# Tempo - Gamified Pomodoro Study Planner

A gamified study planner built around a structured Pomodoro system, complete with XP, leveling, daily streaks, and topic-based study tracking.

![StudyQuest Dashboard Preview](./public/preview.png) _(UI preview from design system)_

## Overview

StudyQuest helps students and self-learners organize their materials into **Subjects** and **Topics**, tracking focus sessions with built-in timers. You earn XP for completing study intervals and unlock milestones through consecutive studying days.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Authentication**: Clerk
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Styling**: Tailwind CSS 4 + custom brand design system
- **Deployment**: Vercel (Frontend), Supabase / Railway (Database)

## Core Features

1. **Subjects & Topics**: Organize your materials cleanly. Reorder via drag & drop. Tracker logs total time, session counts, and your latest rating of confidence on that topic.
2. **Timer Modes**: Three specific intervals for the perfect workflow:
   - **Blitz **: 10m Focus / 2m Break (10 XP)
   - **Focus **: 25m Focus / 5m Break (25 XP)
   - **Deep **: 50m Focus / 10m Break (50 XP)
3. **Gamification & XP**: Accumulate XP per session to level up. XP bar reflects progress to your next threshold.
4. **Streak System**: Increment streaks based on your _local timezone_. Reach consecutive daily milestone tiers (e.g. 7 days, 14 days) to earn massive bonus XP drops.
5. **Session History**: Look back on recent efforts with detailed records including topic, time studied, and user rating (1–3 stars).

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Clerk Account

### Installation

1. Clone the repository and install dependencies:

```bash
git clone https://github.com/beefysalad/pomodoro.git tempo
cd tempo
npm install
```

2. Set up environment variables:

```bash
cp .env.example .env.local
```

3. Update `.env.local` with your database and Clerk keys:

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
CLERK_SECRET_KEY=YOUR_SECRET_KEY
DATABASE_URL="postgresql://username:password@localhost:5432/your_database"
```

4. Intialize database schema & apply migrations:

```bash
npx prisma generate
npx prisma migrate dev
```

5. Start the development server:

```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000)

## Database Schema

We use Prisma with the following key models:

- **`User`**: Linked via `clerkUserId`. Tracks lifetime `totalXP`, `streak`, and `lastStudiedAt`.
- **`Subject`**: High-level learning containers with distinct colors.
- **`Topic`**: Belongs to a Subject. Tracks study duration statistics.
- **`Session`**: Historical logs attached to specific `Topics`. Includes mode duration and ratings.

## Design System

StudyQuest utilizes a dark-mode only, high-contrast palette meant for deep focus work:

- **Base Background:** Deep Midnight `#0D1117`
- **Primary Accent:** Glowing Violet `#7C3AED`
- **Key Identifiers:** `Geist Mono` standard font, with dynamic XP and Streak badges.

## Contributing

Contributions are welcome! Please open an issue or pull request to suggest additions like custom streak goals, weekly charts, or AI topic generation.
