'use client'

import type { Dispatch, SetStateAction } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import type { Flashcard } from '@/lib/api/flashcards'

type QuizItem = {
  id: string
  question: string
  answer: string
  choices: string[]
}

export function FlashcardQuizModal({
  flashcards,
  testActive,
  setTestActive,
  testItems,
  testIndex,
  testScore,
  testResponses,
  quizTimeLeft,
  normalizeAnswer,
  onSelectTestChoice,
  onStartTest,
  setIsQuizOpen,
}: {
  flashcards: Flashcard[]
  testActive: boolean
  setTestActive: Dispatch<SetStateAction<boolean>>
  testItems: QuizItem[]
  testIndex: number
  testScore: number
  testResponses: Record<string, string>
  quizTimeLeft: number
  normalizeAnswer: (value: string) => string
  onSelectTestChoice: (choice: string) => void
  onStartTest: (count: number) => void
  setIsQuizOpen: Dispatch<SetStateAction<boolean>>
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0d1627]/80 p-6">
      {flashcards.length < 2 ? (
        <p className="text-sm text-slate-400">
          Add at least two cards to start a quiz.
        </p>
      ) : testActive ? (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <Badge className="bg-white/10 text-slate-300">
              {testIndex + 1} / {testItems.length}
            </Badge>
            <div className="flex items-center gap-2">
              <Badge className="bg-slate-700/40 text-slate-200">
                {quizTimeLeft}s
              </Badge>
              <Badge className="bg-emerald-500/15 text-emerald-200">
                Score {testScore}
              </Badge>
            </div>
          </div>
          <Progress
            value={Math.max(1, ((testIndex + 1) / testItems.length) * 100)}
            className="h-2 bg-white/10"
          />

          <div className="rounded-2xl border border-white/10 bg-[#121b30]/85 p-8">
            <p className="text-xs font-semibold tracking-[0.2em] text-slate-400 uppercase">
              Term
            </p>
            <p className="mt-4 text-2xl font-semibold text-white">
              {testItems[testIndex]?.question}
            </p>
            <p className="mt-6 text-xs tracking-[0.18em] text-slate-400 uppercase">
              Choose an answer
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {(testItems[testIndex]?.choices ?? []).map((choice, idx) => (
                <Button
                  key={`${choice}-${idx}`}
                  variant="ghost"
                  onClick={() => onSelectTestChoice(choice)}
                  className="bg-glass-soft h-auto justify-start rounded-xl border border-white/10 px-4 py-3 text-left text-sm font-semibold text-slate-100 hover:border-cyan-300/50 hover:bg-cyan-500/10 hover:text-slate-100 dark:hover:bg-cyan-500/10"
                >
                  <span className="mr-2 text-xs text-slate-400">{idx + 1}</span>
                  {choice}
                </Button>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
              <span>Not sure?</span>
              <Button
                variant="ghost"
                className="h-auto p-0 text-cyan-300 hover:bg-transparent hover:text-cyan-200 dark:hover:bg-transparent"
                onClick={() => onSelectTestChoice('')}
              >
                Skip
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="border-white/15 bg-white/5 text-slate-200 hover:bg-white/10"
              onClick={() => setTestActive(false)}
            >
              End test
            </Button>
          </div>
        </div>
      ) : (
        <div className="bg-glass-soft rounded-xl border border-white/10 p-4">
          <p className="text-sm text-slate-300">
            Last score: {testScore}/{testItems.length}
          </p>
          <div className="mt-4 space-y-2">
            {testItems.map((item, index) => {
              const selected = testResponses[item.id] ?? ''
              const isCorrect =
                selected !== '' &&
                normalizeAnswer(selected) === normalizeAnswer(item.answer)
              return (
                <div
                  key={item.id}
                  className={`rounded-lg border px-3 py-2 ${
                    isCorrect
                      ? 'bg-glass-empty border-white/10'
                      : 'border-rose-500/40 bg-rose-500/5'
                  }`}
                >
                  <p className="text-xs text-slate-400">
                    {index + 1}. {item.question}
                  </p>
                  <p
                    className={`mt-2 text-sm font-semibold ${
                      isCorrect ? 'text-emerald-200' : 'text-rose-300'
                    }`}
                  >
                    {isCorrect ? 'Correct' : 'Incorrect'}
                  </p>
                  <p
                    className={`mt-1 text-xs ${
                      isCorrect ? 'text-slate-300' : 'text-rose-200'
                    }`}
                  >
                    Your answer: {selected ? selected : 'No answer'}
                  </p>
                  {!isCorrect && (
                    <p className="mt-1 text-xs text-emerald-200">
                      Correct answer: {item.answer}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
          <div className="mt-3 flex items-center gap-2">
            <Button
              onClick={() => onStartTest(5)}
              className="bg-cyan-600 text-white hover:bg-cyan-500"
            >
              Restart quick test
            </Button>
            <Button
              variant="outline"
              className="border-white/15 bg-white/5 text-slate-200 hover:bg-white/10"
              onClick={() => setIsQuizOpen(false)}
            >
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
