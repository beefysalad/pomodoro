'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useState } from 'react'
import { ArrowLeft, BookOpen, Plus, Search } from 'lucide-react'
import {
  useCreateFlashcardDeck,
  useDeleteFlashcardDeck,
  useFlashcardDecks,
  useUpdateFlashcardDeck,
} from '@/hooks/use-flashcard-decks'
import { useSubjectTopics } from '@/hooks/use-topics'
import { AppHeader } from '@/components/app-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { ConfirmActionDialog } from '@/components/confirm-action-dialog'
import { DeckCard } from '@/components/subjects-decks/deck-card'
import { CreateDeckDialog } from '@/components/subjects-decks/create-deck-dialog'
import { RenameDeckDialog } from '@/components/subjects-decks/rename-deck-dialog'

export default function SubjectDecksPage() {
  const params = useParams<{ id: string }>()
  const subjectId = params.id
  const { data: subject } = useSubjectTopics(subjectId)
  const { data: decks = [], isLoading: decksLoading } =
    useFlashcardDecks(subjectId)
  const createDeck = useCreateFlashcardDeck(subjectId)
  const updateDeck = useUpdateFlashcardDeck(subjectId)
  const deleteDeck = useDeleteFlashcardDeck(subjectId)

  const [searchQuery, setSearchQuery] = useState('')
  const [newDeckName, setNewDeckName] = useState('')
  const [isAddDeckOpen, setIsAddDeckOpen] = useState(false)
  const [editingDeck, setEditingDeck] = useState<{
    id: string
    name: string
  } | null>(null)
  const [deletingDeckId, setDeletingDeckId] = useState<string | null>(null)

  const filteredDecks = decks.filter((deck) =>
    deck.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleCreateDeck = async () => {
    if (!newDeckName.trim()) return
    try {
      await createDeck.mutateAsync({ name: newDeckName })
      setNewDeckName('')
      setIsAddDeckOpen(false)
      toast.success('Deck created successfully')
    } catch {
      toast.error('Failed to create deck')
    }
  }

  const handleUpdateDeck = async () => {
    if (!editingDeck || !editingDeck.name.trim()) return
    try {
      await updateDeck.mutateAsync({
        deckId: editingDeck.id,
        payload: { name: editingDeck.name },
      })
      setEditingDeck(null)
      toast.success('Deck renamed successfully')
    } catch {
      toast.error('Failed to rename deck')
    }
  }

  const handleDeleteDeck = async () => {
    if (!deletingDeckId) return
    try {
      await deleteDeck.mutateAsync(deletingDeckId)
      setDeletingDeckId(null)
      toast.success('Deck deleted successfully')
    } catch {
      toast.error('Failed to delete deck')
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#070b16] text-slate-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-[-100px] right-[-100px] h-[320px] w-[320px] rounded-full bg-cyan-500/10 blur-[110px]" />
        <div className="absolute bottom-[-80px] left-[-90px] h-[320px] w-[320px] rounded-full bg-violet-600/12 blur-[110px]" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-10">
        <AppHeader />

        <section>
          <Link
            href={`/subjects/${subjectId}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 transition hover:text-slate-200"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to {subject?.name ?? 'subject'}
          </Link>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
                Flashcard Decks
              </h1>
              <p className="mt-2 text-sm text-slate-400">
                All card sets for{' '}
                <span className="font-semibold text-cyan-400">
                  {subject?.name}
                </span>
              </p>
            </div>
            <Button
              className="bg-violet-600 text-white hover:bg-violet-500"
              onClick={() => setIsAddDeckOpen(true)}
            >
              <Plus className="h-4 w-4" />
              New deck
            </Button>
          </div>
        </section>

        <section className="mt-2 space-y-6">
          <div className="relative max-w-md">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <Input
              placeholder="Search decks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-white/10 bg-white/5 pl-10 text-white placeholder:text-slate-500 focus:border-cyan-500/50"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {decksLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton
                    key={i}
                    className="h-32 w-full rounded-2xl bg-white/5"
                  />
                ))
              : filteredDecks.map((deck) => (
                  <DeckCard
                    key={deck.id}
                    deck={deck}
                    subjectId={subjectId}
                    onRequestRename={setEditingDeck}
                    onRequestDelete={setDeletingDeckId}
                  />
                ))}
          </div>

          {!decksLoading && filteredDecks.length === 0 && (
            <div className="bg-glass-empty flex flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 py-20 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 text-slate-500">
                <BookOpen className="h-8 w-8" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-white">
                No decks found
              </h3>
              <p className="mt-1 text-sm text-slate-400">
                {searchQuery
                  ? 'Try a different search term'
                  : 'Start by creating your first card deck'}
              </p>
              {!searchQuery && (
                <Button
                  className="mt-6 bg-violet-600 text-white hover:bg-violet-500"
                  onClick={() => setIsAddDeckOpen(true)}
                >
                  <Plus className="h-4 w-4" />
                  Create your first deck
                </Button>
              )}
            </div>
          )}
        </section>
      </div>

      {/* Dialogs */}
      <CreateDeckDialog
        open={isAddDeckOpen}
        onOpenChange={setIsAddDeckOpen}
        name={newDeckName}
        onNameChange={setNewDeckName}
        onCreate={handleCreateDeck}
      />

      <RenameDeckDialog
        editingDeck={editingDeck}
        onClose={() => setEditingDeck(null)}
        onNameChange={(name) =>
          setEditingDeck((prev) => (prev ? { ...prev, name } : null))
        }
        onSave={handleUpdateDeck}
      />

      <ConfirmActionDialog
        open={!!deletingDeckId}
        onOpenChange={(open) => !open && setDeletingDeckId(null)}
        onConfirm={handleDeleteDeck}
        title="Delete Deck?"
        description="This will permanently remove the deck and all flashcards inside it. This action cannot be undone."
        confirmLabel="Delete Deck"
        pending={deleteDeck.isPending}
      />
    </div>
  )
}
