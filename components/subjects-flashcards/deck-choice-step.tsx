'use client'

import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import type { FlashcardDeck } from '@/lib/api/flashcard-decks'

interface DeckChoiceStepProps {
  subjectId: string
  decks: FlashcardDeck[]
  deckId: string
  onDeckIdChange: (deckId: string) => void
  resolvedDeckId: string
  onContinue: () => void
  deckName: string
  onDeckNameChange: (name: string) => void
  onCreateDeck: () => void
  isCreatingDeck: boolean
}

export function DeckChoiceStep({
  subjectId,
  decks,
  deckId,
  onDeckIdChange,
  resolvedDeckId,
  onContinue,
  deckName,
  onDeckNameChange,
  onCreateDeck,
  isCreatingDeck,
}: DeckChoiceStepProps) {
  return (
    <div className="flex flex-col gap-8 py-10">
      <div className="text-center">
        <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">
          Ready to study?
        </h1>
        <p className="mt-4 text-lg text-slate-400">
          Choose a deck to add cards to, or create a fresh one to get started.
        </p>
      </div>

      <div className="mx-auto grid w-full max-w-4xl gap-6 sm:grid-cols-2">
        {/* Option 1: Existing Deck */}
        <Card className="flex flex-col border-white/10 bg-white/[0.05] p-6 backdrop-blur-xl transition hover:border-violet-500/50 hover:bg-white/[0.08]">
          <div className="mb-6">
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-violet-600/20 text-violet-400">
              <Plus className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-white">Use existing deck</h3>
            <p className="mt-1 text-sm text-slate-400">
              Add new cards to one of your existing decks in this subject.
            </p>
          </div>
          <div className="mt-auto space-y-4">
            <select
              value={deckId}
              onChange={(event) => onDeckIdChange(event.target.value)}
              className="h-11 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white focus:ring-2 focus:ring-violet-500 focus:outline-none"
            >
              <option value="" disabled className="bg-slate-900">
                Select a deck
              </option>
              {decks.map((deck) => (
                <option key={deck.id} value={deck.id} className="bg-slate-900">
                  {deck.name}
                </option>
              ))}
            </select>
            <Button
              onClick={onContinue}
              disabled={!resolvedDeckId}
              className="w-full bg-violet-600 font-bold hover:bg-violet-500"
            >
              Continue
            </Button>
          </div>
        </Card>

        {/* Option 2: New Deck */}
        <Card className="flex flex-col border-white/10 bg-white/[0.05] p-6 backdrop-blur-xl transition hover:border-cyan-500/50 hover:bg-white/[0.08]">
          <div className="mb-6">
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-600/20 text-cyan-400">
              <Plus className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-white">Create new deck</h3>
            <p className="mt-1 text-sm text-slate-400">
              Start a completely new collection of cards.
            </p>
          </div>
          <div className="mt-auto space-y-4">
            <Input
              value={deckName}
              onChange={(event) => onDeckNameChange(event.target.value)}
              placeholder="E.g., Midterm Review"
              className="h-11 border-white/15 bg-white/5 text-white placeholder:text-slate-500 focus:ring-cyan-500"
            />
            <Button
              onClick={onCreateDeck}
              disabled={!deckName.trim() || isCreatingDeck}
              className="w-full bg-cyan-600 font-bold hover:bg-cyan-500"
            >
              Create & Continue
            </Button>
          </div>
        </Card>
      </div>

      <div className="text-center">
        <Link
          href={`/subjects/${subjectId}`}
          className="text-sm font-medium text-slate-400 hover:text-white"
        >
          Nevermind, go back
        </Link>
      </div>
    </div>
  )
}
