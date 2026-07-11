'use client'

import type { Dispatch, SetStateAction } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import type { Flashcard } from '@/lib/api/flashcards'

export function FlashcardStudyModal({
  flashcards,
  studyIndex,
  setStudyIndex,
  activeStudyCard,
  showAnswer,
  setShowAnswer,
  onReviewFlashcard,
}: {
  flashcards: Flashcard[]
  studyIndex: number
  setStudyIndex: Dispatch<SetStateAction<number>>
  activeStudyCard: Flashcard | undefined
  showAnswer: boolean
  setShowAnswer: Dispatch<SetStateAction<boolean>>
  onReviewFlashcard: (cardId: string, status: string) => void | Promise<void>
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0d1627]/80 p-6">
      {!flashcards.length ? (
        <div className="rounded-xl border border-dashed border-white/15 bg-white/[0.02] px-4 py-10 text-center text-sm text-slate-400">
          No flashcards available for this topic yet.
        </div>
      ) : (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <Badge className="bg-white/10 text-slate-300">
              {studyIndex + 1} / {flashcards.length}
            </Badge>
            <Badge className="bg-violet-500/20 text-violet-100">
              {activeStudyCard?.status ?? 'NEW'}
            </Badge>
          </div>
          <Progress
            value={Math.max(1, ((studyIndex + 1) / flashcards.length) * 100)}
            className="h-2 bg-white/10"
          />

          <div className="rounded-2xl border border-white/10 bg-[#121b30]/85 p-8">
            <p className="text-xs font-semibold tracking-[0.2em] text-slate-400 uppercase">
              Term
            </p>
            <p className="mt-4 text-3xl font-semibold text-white">
              {activeStudyCard?.question ?? 'No card selected'}
            </p>

            {showAnswer && (
              <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.04] p-5">
                <p className="text-xs text-slate-400">Definition</p>
                <p className="mt-2 text-base text-slate-100">
                  {activeStudyCard?.answer}
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              className="h-9 border-white/15 bg-white/5 text-slate-200 hover:bg-white/10"
              onClick={() => setShowAnswer((prev) => !prev)}
              disabled={!activeStudyCard}
            >
              {showAnswer ? 'Hide answer' : 'Show answer'}
            </Button>
            <Button
              variant="outline"
              className="h-9 border-white/15 bg-white/5 text-slate-200 hover:bg-white/10"
              onClick={() => {
                setStudyIndex((prev) =>
                  Math.min(prev + 1, Math.max(0, flashcards.length - 1))
                )
                setShowAnswer(false)
              }}
              disabled={!activeStudyCard}
            >
              Next
            </Button>
            {showAnswer && activeStudyCard && (
              <>
                <Button
                  size="sm"
                  className="bg-rose-500/80 text-white hover:bg-rose-500"
                  onClick={() =>
                    onReviewFlashcard(activeStudyCard.id, 'REVIEW')
                  }
                >
                  Again
                </Button>
                <Button
                  size="sm"
                  className="bg-cyan-500/80 text-white hover:bg-cyan-500"
                  onClick={() =>
                    onReviewFlashcard(activeStudyCard.id, 'LEARNING')
                  }
                >
                  Good
                </Button>
                <Button
                  size="sm"
                  className="bg-emerald-500/80 text-white hover:bg-emerald-500"
                  onClick={() =>
                    onReviewFlashcard(activeStudyCard.id, 'MASTERED')
                  }
                >
                  Easy
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
