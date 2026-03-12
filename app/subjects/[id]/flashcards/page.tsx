'use client'

import Link from 'next/link'
import { useMemo, useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
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

type DraftCard = {
  id: string
  question: string
  answer: string
  hint: string
  choicesText: string
}

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
          <div className="flex flex-col gap-8 py-10">
            <div className="text-center">
              <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">
                Ready to study?
              </h1>
              <p className="mt-4 text-lg text-slate-400">
                Choose a deck to add cards to, or create a fresh one to get
                started.
              </p>
            </div>

            <div className="mx-auto grid w-full max-w-4xl gap-6 sm:grid-cols-2">
              {/* Option 1: Existing Deck */}
              <Card className="flex flex-col border-white/10 bg-white/[0.05] p-6 backdrop-blur-xl transition hover:border-violet-500/50 hover:bg-white/[0.08]">
                <div className="mb-6">
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-violet-600/20 text-violet-400">
                    <Plus className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold text-white">
                    Use existing deck
                  </h3>
                  <p className="mt-1 text-sm text-slate-400">
                    Add new cards to one of your existing decks in this subject.
                  </p>
                </div>
                <div className="mt-auto space-y-4">
                  <select
                    value={deckId}
                    onChange={(event) => setDeckId(event.target.value)}
                    className="h-11 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white focus:ring-2 focus:ring-violet-500 focus:outline-none"
                  >
                    <option value="" disabled className="bg-slate-900">
                      Select a deck
                    </option>
                    {decks.map((deck) => (
                      <option
                        key={deck.id}
                        value={deck.id}
                        className="bg-slate-900"
                      >
                        {deck.name}
                      </option>
                    ))}
                  </select>
                  <Button
                    onClick={handleNextStep}
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
                  <h3 className="text-xl font-bold text-white">
                    Create new deck
                  </h3>
                  <p className="mt-1 text-sm text-slate-400">
                    Start a completely new collection of cards.
                  </p>
                </div>
                <div className="mt-auto space-y-4">
                  <Input
                    value={deckName}
                    onChange={(event) => setDeckName(event.target.value)}
                    placeholder="E.g., Midterm Review"
                    className="h-11 border-white/15 bg-white/5 text-white placeholder:text-slate-500 focus:ring-cyan-500"
                  />
                  <Button
                    onClick={onCreateDeck}
                    disabled={!deckName.trim() || createDeck.isPending}
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
        ) : (
          <>
            <section className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <button
                  onClick={() => setStep('choice')}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 transition hover:text-slate-200"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Change deck
                </button>
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

            <Card className="border-white/10 bg-white/[0.05] py-0 backdrop-blur-xl">
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
              <Card className="border-white/10 bg-white/[0.05] py-0 backdrop-blur-xl">
                <CardContent className="space-y-3 px-4 py-5 sm:px-6">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold tracking-[0.16em] text-slate-400 uppercase">
                        Import
                      </p>
                      <h3 className="text-base font-bold text-white">
                        Paste Q/A
                      </h3>
                      <p className="text-xs text-slate-400">
                        One per line:{' '}
                        <span className="text-slate-200">
                          Term | Answer | choice1 | choice2 | choice3
                        </span>
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      className="border-white/15 bg-white/5 text-slate-200 hover:bg-white/10"
                      onClick={importFromText}
                      disabled={!importText.trim()}
                    >
                      Import
                    </Button>
                  </div>
                  <textarea
                    value={importText}
                    onChange={(event) => setImportText(event.target.value)}
                    placeholder="What is 1 + 1? | 2 | 1 | 3 | 4"
                    className="min-h-[120px] w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500"
                  />
                </CardContent>
              </Card>

              {drafts.map((card, index) => (
                <Card
                  key={card.id}
                  className="border-white/10 bg-white/[0.05] py-0 backdrop-blur-xl"
                >
                  <CardContent className="space-y-3 px-4 py-5 sm:px-6">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-slate-400">
                        {index + 1}
                      </p>
                      <Button
                        variant="outline"
                        className="h-7 border-red-400/35 bg-red-500/10 px-2 text-red-200 hover:bg-red-500/20"
                        onClick={() => removeDraft(card.id)}
                        disabled={drafts.length === 1}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <p className="text-[10px] font-semibold tracking-[0.2em] text-slate-400 uppercase">
                          Question
                        </p>
                        <Input
                          value={card.question}
                          onChange={(event) =>
                            updateDraft(card.id, {
                              question: event.target.value,
                            })
                          }
                          placeholder="Enter question (What is 1+1)"
                          className="mt-2 border-white/15 bg-white/5 text-white placeholder:text-slate-500"
                        />
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold tracking-[0.2em] text-slate-400 uppercase">
                          Answer
                        </p>
                        <Input
                          value={card.answer}
                          onChange={(event) =>
                            updateDraft(card.id, { answer: event.target.value })
                          }
                          placeholder="Enter answer (2) "
                          className="mt-2 border-white/15 bg-white/5 text-white placeholder:text-slate-500"
                        />
                      </div>
                    </div>
                    <Input
                      value={card.hint}
                      onChange={(event) =>
                        updateDraft(card.id, { hint: event.target.value })
                      }
                      placeholder="Hint (optional)"
                      className="border-white/15 bg-white/5 text-white placeholder:text-slate-500"
                    />
                    <textarea
                      value={card.choicesText}
                      onChange={(event) =>
                        updateDraft(card.id, {
                          choicesText: event.target.value,
                        })
                      }
                      placeholder="Multiple choices (optional, one per line)"
                      className="min-h-[96px] w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500"
                    />
                  </CardContent>
                </Card>
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
