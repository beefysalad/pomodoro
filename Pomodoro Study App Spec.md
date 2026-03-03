# StudyQuest — Product Spec & System Architecture

## Overview

StudyQuest is a gamified study planner built around a structured Pomodoro system. Users organize their study material into **Subjects** containing **Topics**, then launch focused timer sessions on individual topics. Progress is tracked via XP, levels, session history, and a daily streak system.

**Target platforms:** Web (Next.js) + Mobile (React Native or PWA)
**Primary users:** Students and self-learners of any age

---

## Tech Stack

| Layer      | Choice                             |
| ---------- | ---------------------------------- |
| Frontend   | Next.js (App Router)               |
| Auth       | Clerk                              |
| Database   | PostgreSQL                         |
| ORM        | Prisma                             |
| Deployment | Vercel (frontend) + Neon(Postgres) |

---

## Core Features

### 1. Authentication (Clerk)

- Sign up / sign in via email, Google OAuth
- Clerk user ID (`clerkUserId`) is the primary foreign key linking all user data
- Store user timezone on first login (used for streak calculation)
- On first sign-in, create a `User` record in the database seeded with default XP = 0, streak = 0

### 2. Subjects

- A Subject is a top-level container (e.g. "Biology", "Calculus")
- Each Subject has a display color chosen from a preset palette
- Subjects can be collapsed/expanded in the UI
- Subjects are ordered by `position` (integer) for drag-and-drop reordering

### 3. Topics

- Topics live inside a Subject (e.g. "Cell Division", "Derivatives")
- Topics can be dragged to reorder within a subject or moved to another subject
- Topics track: total time studied (seconds), number of sessions, last session rating
- Topics are ordered by `position` within their subject

### 4. Timer / Session Modes

Three timer modes available per session:

| Mode     | Focus Duration | Break Duration | XP Reward |
| -------- | -------------- | -------------- | --------- |
| Blitz ⚡ | 10 min         | 2 min          | 10 XP     |
| Focus 🎯 | 25 min         | 5 min          | 25 XP     |
| Deep 🔬  | 50 min         | 10 min         | 50 XP     |

- Timer runs client-side
- On session completion, user rates the session 1–3 stars
- A `Session` record is written to the database on completion
- XP is awarded and added to the user's total

### 5. XP & Leveling

- Users accumulate XP from completed sessions
- Level = `Math.floor(totalXP / 100) + 1`
- XP bar shows progress toward next level threshold
- Milestone streaks award bonus XP (see Streak section)

### 6. Streak System

- A study day is counted when the user completes **any** session that day
- Streak is calculated based on the user's **local timezone** (stored on the User record)
- Streak increments by 1 per calendar day (not per session)
- Missing a day resets streak to 0
- Streak milestones trigger a celebration modal and award bonus XP:

| Milestone | Bonus XP |
| --------- | -------- |
| 3 days    | 15 XP    |
| 7 days    | 35 XP    |
| 14 days   | 70 XP    |
| 30 days   | 150 XP   |
| 60 days   | 300 XP   |
| 100 days  | 500 XP   |

- The weekly dots widget shows the last 7 days, highlighting studied days and today

### 7. Session History

- All completed sessions are stored and displayed in a History tab
- Each entry shows: topic name, mode, time ago, XP earned, star rating

---

## Database Schema (Prisma)

```prisma
model User {
  id           String    @id @default(cuid())
  clerkUserId  String    @unique
  email        String    @unique
  timezone     String    @default("UTC")
  totalXP      Int       @default(0)
  streak       Int       @default(0)
  lastStudiedAt DateTime?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  subjects     Subject[]
  sessions     Session[]
}

model Subject {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  name      String
  color     String
  position  Int      @default(0)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  topics    Topic[]
}

model Topic {
  id          String   @id @default(cuid())
  subjectId   String
  subject     Subject  @relation(fields: [subjectId], references: [id], onDelete: Cascade)
  name        String
  position    Int      @default(0)
  totalTime   Int      @default(0)  // in seconds
  sessionCount Int     @default(0)
  lastRating  Int?     // 1-3
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  sessions    Session[]
}

model Session {
  id         String   @id @default(cuid())
  userId     String
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  topicId    String
  topic      Topic    @relation(fields: [topicId], references: [id], onDelete: Cascade)
  mode       String   // "Blitz" | "Focus" | "Deep"
  duration   Int      // seconds
  xpEarned   Int
  rating     Int      // 1-3
  createdAt  DateTime @default(now())
}
```

---

## API Routes (Next.js App Router)

All routes are protected via Clerk's `auth()` middleware. The `clerkUserId` from the session is used to look up the internal `User` record.

### Users

| Method | Route             | Description                                      |
| ------ | ----------------- | ------------------------------------------------ |
| POST   | `/api/users/sync` | Create or update user record after Clerk sign-in |

### Subjects

| Method | Route                   | Description                                            |
| ------ | ----------------------- | ------------------------------------------------------ |
| GET    | `/api/subjects`         | Get all subjects (with nested topics) for current user |
| POST   | `/api/subjects`         | Create a new subject                                   |
| PATCH  | `/api/subjects/[id]`    | Update subject name, color, or position                |
| DELETE | `/api/subjects/[id]`    | Delete subject and cascade topics/sessions             |
| PATCH  | `/api/subjects/reorder` | Bulk update positions after drag-and-drop              |

### Topics

| Method | Route                 | Description                               |
| ------ | --------------------- | ----------------------------------------- |
| POST   | `/api/topics`         | Create a topic inside a subject           |
| PATCH  | `/api/topics/[id]`    | Update topic name or position             |
| DELETE | `/api/topics/[id]`    | Delete topic                              |
| PATCH  | `/api/topics/reorder` | Bulk update positions after drag-and-drop |

### Sessions

| Method | Route           | Description                                         |
| ------ | --------------- | --------------------------------------------------- |
| POST   | `/api/sessions` | Record a completed session, award XP, update streak |

### Stats

| Method | Route        | Description                                                           |
| ------ | ------------ | --------------------------------------------------------------------- |
| GET    | `/api/stats` | Return totalXP, level, streak, studiedDays (last 30), session history |

---

## Streak Calculation Logic (Server-Side)

When `POST /api/sessions` is called:

```
1. Get user's timezone from User record
2. Get current date in user's timezone
3. Get user's lastStudiedAt converted to user's timezone date
4. If lastStudiedAt date == today → streak already counted, skip
5. If lastStudiedAt date == yesterday → streak += 1
6. If lastStudiedAt date is older → streak = 1 (reset)
7. Update User: { streak, lastStudiedAt: now(), totalXP += xpEarned }
8. Update Topic: { totalTime += duration, sessionCount += 1, lastRating: rating }
9. Check if new streak hits a milestone → award bonus XP if so
10. Return updated user stats + milestone flag to client
```

---

## Key Implementation Notes

- **Timezone safety:** Always convert `lastStudiedAt` to the user's timezone before comparing dates. Use a library like `date-fns-tz` or `dayjs` with timezone plugin. Never compare raw UTC dates for streak logic.
- **Drag and drop:** Use `@hello-pangea/dnd` (maintained fork of react-beautiful-dnd) for subject/topic reordering. On drop, send a bulk reorder PATCH with the new position array.
- **Optimistic updates:** Update UI immediately on session complete, then sync to server. Roll back on error.
- **Timer is client-only:** Never trust the client for session duration. Consider storing `startedAt` on session start and computing duration server-side on completion.
- **Auth middleware:** Use Clerk's `middleware.ts` to protect all `/api/*` and `/dashboard/*` routes globally.
- **User sync webhook:** Use Clerk's `user.created` webhook to automatically create the User record in Postgres instead of relying on the client to call `/api/users/sync`.

---

## Planned Features (Future Scope)

- **Spaced repetition:** Surface topics not studied in N days based on configurable intervals
- **Weekly goals:** Set target hours per subject per week with progress rings
- **AI topic suggestions:** Given a subject name, use an LLM to suggest a starter list of topics
- **Session notes:** Short text field attached to each session ("finished ch. 4, review limits")
- **Calendar heatmap:** GitHub-style grid showing study activity over time
- **Focus sounds:** Ambient audio (rain, lo-fi, white noise) during sessions
- **Push notifications:** Daily streak reminder if user hasn't studied by evening (via web push or mobile)
- **Friend activity:** See when friends are in an active session
