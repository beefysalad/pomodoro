'use client'

import { useMemo, useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Plus } from 'lucide-react'
import { AppHeader } from '@/components/app-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useSubjectTopics } from '@/hooks/use-topics'
import { useCreateFlashcard } from '@/hooks/use-flashcards'
import {
  useCreateFlashcardDeck,
  useFlashcardDecks,
} from '@/hooks/use-flashcard-decks'
import { DeckChoiceStep } from '@/components/subjects-flashcards/deck-choice-step'
import { BulkImportCard } from '@/components/subjects-flashcards/bulk-import-card'
import { DraftCardEditor } from '@/components/subjects-flashcards/draft-card-editor'
import type { DraftCard } from '@/components/subjects-flashcards/draft-card'

export default function FlashcardCreatePage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const subjectId = params.id
  useSubjectTopics(subjectId)

  const [step, setStep] = useState<'choice' | 'content'>('choice')
  const [deckName, setDeckName] = useState('')
  const [title, setTitle] = useState(() => {
    if (typeof window === 'undefined') return ''
    try {
      return (
        window.localStorage.getItem(`tempo.flashcards.title.${subjectId}`) ?? ''
      )
    } catch {
      return ''
    }
  })
  const [drafts, setDrafts] = useState<DraftCard[]>(() => [
    {
      id: crypto.randomUUID(),
      question: '',
      answer: '',
      hint: '',
      choicesText: '',
    },
  ])
  const [importText, setImportText] = useState('')
  const [importOpen, setImportOpen] = useState(false)

  const { data: decks = [] } = useFlashcardDecks(subjectId)
  const [deckId, setDeckId] = useState('')
  const resolvedDeckId = deckId || decks[0]?.id || ''
  const createDeck = useCreateFlashcardDeck(subjectId)
  const createFlashcard = useCreateFlashcard(resolvedDeckId)

  const filledCount = useMemo(
    () =>
      drafts.filter((card) => card.question.trim() && card.answer.trim())
        .length,
    [drafts]
  )

  const updateDraft = (id: string, patch: Partial<DraftCard>) => {
    setDrafts((prev) =>
      prev.map((card) => (card.id === id ? { ...card, ...patch } : card))
    )
  }

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(`tempo.flashcards.title.${subjectId}`, title)
    } catch {
      // ignore storage failures
    }
  }, [subjectId, title])

  const addDraft = () => {
    setDrafts((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        question: '',
        answer: '',
        hint: '',
        choicesText: '',
      },
    ])
  }

  const importFromText = () => {
    const lines = importText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)

    if (!lines.length) return

    const imported = lines.map((line) => {
      const parts = line
        .split('|')
        .map((part) => part.trim())
        .filter(Boolean)
      const choices = parts.slice(2)
      return {
        id: crypto.randomUUID(),
        question: parts[0] ?? '',
        answer: parts[1] ?? '',
        hint: '',
        choicesText: choices.join('\n'),
      }
    })

    setDrafts((prev) => [...prev, ...imported])
    setImportText('')
  }

  const removeDraft = (id: string) => {
    setDrafts((prev) => prev.filter((card) => card.id !== id))
  }

  const onSave = async () => {
    if (!resolvedDeckId) return
    const queue = drafts.filter(
      (card) => card.question.trim() && card.answer.trim()
    )
    if (!queue.length) return

    try {
      for (const card of queue) {
        const choices = card.choicesText
          .split('\n')
          .map((item) => item.trim())
          .filter(Boolean)
        await createFlashcard.mutateAsync({
          question: card.question.trim(),
          answer: card.answer.trim(),
          hint: card.hint.trim() || null,
          choices: choices.length ? choices : undefined,
        })
      }
      router.push(`/subjects/${subjectId}`)
    } catch {
      // keep on page
    }
  }

  const onCreateDeck = async () => {
    const name = deckName.trim()
    if (!name) return
    try {
      const deck = await createDeck.mutateAsync({ name })
      setDeckId(deck.id)
      setDeckName('')
      setStep('content')
    } catch {
      // ignore
    }
  }

  const handleNextStep = () => {
    if (resolvedDeckId) {
      setStep('content')
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#070b16] text-slate-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-[-120px] right-[-120px] h-[360px] w-[360px] rounded-full bg-violet-600/16 blur-[130px]" />
        <div className="absolute bottom-[-160px] left-[-120px] h-[360px] w-[360px] rounded-full bg-cyan-500/12 blur-[130px]" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-10">
        <AppHeader />

        {step === 'choice' ? (
          <DeckChoiceStep
            subjectId={subjectId}
            decks={decks}
            deckId={deckId}
            onDeckIdChange={setDeckId}
            resolvedDeckId={resolvedDeckId}
            onContinue={handleNextStep}
            deckName={deckName}
            onDeckNameChange={setDeckName}
            onCreateDeck={onCreateDeck}
            isCreatingDeck={createDeck.isPending}
          />
        ) : (
          <>
            <section className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStep('choice')}
                  className="h-auto gap-1.5 px-0 text-xs font-semibold text-slate-400 hover:bg-transparent hover:text-slate-200 dark:hover:bg-transparent"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Change deck
                </Button>
                <h1 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">
                  {title.trim() ? title : 'Add your cards'}
                </h1>
                <p className="mt-2 text-sm text-slate-400">
                  Adding to:{' '}
                  <span className="font-bold text-slate-200">
                    {decks.find((d) => d.id === resolvedDeckId)?.name ||
                      'New Deck'}
                  </span>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  className="border-white/15 bg-white/5 text-slate-200 hover:bg-white/10"
                  onClick={() => router.push(`/subjects/${subjectId}`)}
                >
                  Cancel
                </Button>
                <Button
                  className="bg-violet-600 text-white hover:bg-violet-500"
                  disabled={!filledCount || createFlashcard.isPending}
                  onClick={onSave}
                >
                  Save & practice
                </Button>
              </div>
            </section>

            <Card className="py-0 backdrop-blur-xl">
              <CardContent className="space-y-4 px-4 py-5 sm:px-6">
                <Input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Set title for this session (optional)"
                  className="border-white/15 bg-white/5 text-white placeholder:text-slate-500"
                />
              </CardContent>
            </Card>

            <div className="space-y-4">
              <BulkImportCard
                importOpen={importOpen}
                onToggleImportOpen={() => setImportOpen((open) => !open)}
                importText={importText}
                onImportTextChange={setImportText}
                onImportFromText={importFromText}
              />

              {drafts.map((card, index) => (
                <DraftCardEditor
                  key={card.id}
                  card={card}
                  index={index}
                  onUpdate={updateDraft}
                  onRemove={removeDraft}
                  canRemove={drafts.length > 1}
                />
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <Button
                variant="outline"
                className="border-white/15 bg-white/5 text-slate-200 hover:bg-white/10"
                onClick={addDraft}
              >
                <Plus className="h-4 w-4" />
                Add card
              </Button>
              <p className="text-xs text-slate-400">
                {filledCount} ready · {drafts.length} total
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
