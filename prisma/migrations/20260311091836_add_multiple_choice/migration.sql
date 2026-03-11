-- AlterTable
ALTER TABLE "Flashcard" ADD COLUMN     "choices" TEXT[] DEFAULT ARRAY[]::TEXT[];
