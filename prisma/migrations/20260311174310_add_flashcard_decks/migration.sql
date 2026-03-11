-- CreateTable
CREATE TABLE "FlashcardDeck" (
    "id" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FlashcardDeck_pkey" PRIMARY KEY ("id")
);

-- Drop old index + FK
DROP INDEX IF EXISTS "Flashcard_topicId_status_idx";
ALTER TABLE "Flashcard" DROP CONSTRAINT IF EXISTS "Flashcard_topicId_fkey";

-- Add deckId as required (assumes Flashcard table is empty)
ALTER TABLE "Flashcard" ADD COLUMN "deckId" TEXT NOT NULL;

-- Remove topicId column
ALTER TABLE "Flashcard" DROP COLUMN "topicId";

-- Indexes
CREATE INDEX "Flashcard_deckId_status_idx" ON "Flashcard"("deckId", "status");
CREATE INDEX "FlashcardDeck_subjectId_name_idx" ON "FlashcardDeck"("subjectId", "name");

-- Foreign keys
ALTER TABLE "Flashcard"
  ADD CONSTRAINT "Flashcard_deckId_fkey" FOREIGN KEY ("deckId") REFERENCES "FlashcardDeck"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FlashcardDeck"
  ADD CONSTRAINT "FlashcardDeck_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
