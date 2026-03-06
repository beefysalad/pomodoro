CREATE TABLE IF NOT EXISTS "WeeklyLeaderboardSnapshot" (
  "id" TEXT NOT NULL,
  "weekStart" TIMESTAMP(3) NOT NULL,
  "userId" TEXT NOT NULL,
  "sessions" INTEGER NOT NULL DEFAULT 0,
  "focusMinutes" INTEGER NOT NULL DEFAULT 0,
  "xpGained" INTEGER NOT NULL DEFAULT 0,
  "rank" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "WeeklyLeaderboardSnapshot_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "WeeklyLeaderboardSnapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "WeeklyLeaderboardSnapshot_weekStart_userId_key"
  ON "WeeklyLeaderboardSnapshot"("weekStart", "userId");

CREATE INDEX IF NOT EXISTS "WeeklyLeaderboardSnapshot_weekStart_rank_idx"
  ON "WeeklyLeaderboardSnapshot"("weekStart", "rank");

CREATE INDEX IF NOT EXISTS "WeeklyLeaderboardSnapshot_userId_weekStart_idx"
  ON "WeeklyLeaderboardSnapshot"("userId", "weekStart");
