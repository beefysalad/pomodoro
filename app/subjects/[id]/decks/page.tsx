'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useState } from 'react'
import {
  ArrowLeft,
  BookOpen,
  Edit2,
  MoreVertical,
  Plus,
  Search,
  Trash2,
} from 'lucide-react'
import {
  useCreateFlashcardDeck,
  useDeleteFlashcardDeck,
  useFlashcardDecks,
  useUpdateFlashcardDeck,
} from '@/hooks/use-flashcard-decks'
import { useSubjectTopics } from '@/hooks/use-topics'
import { AppHeader } from '@/components/app-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { ConfirmActionDialog } from '@/components/confirm-action-dialog'

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
                  <div key={deck.id} className="group relative">
                    <Link
                      href={`/subjects/${subjectId}?view=flashcards&deckId=${deck.id}`}
                    >
                      <Card className="relative h-full overflow-hidden border-white/10 bg-white/[0.05] transition-all hover:border-cyan-500/40 hover:bg-white/[0.08] hover:shadow-[0_0_20px_rgba(34,211,238,0.15)]">
                        <CardContent className="p-5">
                          <div className="flex items-start justify-between">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600/20 text-violet-400 ring-1 ring-violet-500/30">
                              <BookOpen className="h-5 w-5" />
                            </div>
                            <Badge
                              variant="outline"
                              className="border-white/10 text-[10px] tracking-wider text-slate-500 uppercase"
                            >
                              Deck
                            </Badge>
                          </div>
                          <h3 className="mt-4 font-bold text-white transition-colors group-hover:text-cyan-300">
                            {deck.name}
                          </h3>
                          <p className="mt-1 text-xs text-slate-500">
                            Last studied:{' '}
                            {new Date(deck.updatedAt).toLocaleDateString()}
                          </p>
                        </CardContent>
                        <div className="absolute bottom-0 left-0 h-1 w-0 bg-gradient-to-r from-violet-500 to-cyan-400 transition-all group-hover:w-full" />
                      </Card>
                    </Link>

                    <div className="absolute top-2 right-2 opacity-0 transition-opacity group-hover:opacity-100">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-400 hover:bg-white/10 hover:text-white"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="w-40 border-white/10 bg-[#0f172a] text-slate-200"
                        >
                          <DropdownMenuItem
                            onClick={() =>
                              setEditingDeck({ id: deck.id, name: deck.name })
                            }
                            className="focus:bg-white/10 focus:text-white"
                          >
                            <Edit2 className="mr-2 h-4 w-4" />
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setDeletingDeckId(deck.id)}
                            className="text-red-400 focus:bg-red-400/10 focus:text-red-400"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
          </div>

          {!decksLoading && filteredDecks.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 bg-white/[0.02] py-20 text-center">
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
      <Dialog open={isAddDeckOpen} onOpenChange={setIsAddDeckOpen}>
        <DialogContent className="border-white/10 bg-[#0f172a] text-slate-200">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white">
              New Flashcard Deck
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Create a new set of cards for this subject.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={newDeckName}
              onChange={(e) => setNewDeckName(e.target.value)}
              placeholder="e.g. Chapter 1: Introduction"
              className="border-white/10 bg-white/5 text-white"
              onKeyDown={(e) => e.key === 'Enter' && handleCreateDeck()}
            />
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setIsAddDeckOpen(false)}
              className="text-slate-400 hover:bg-white/5 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateDeck}
              className="bg-violet-600 text-white hover:bg-violet-500"
            >
              Create Deck
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!editingDeck}
        onOpenChange={(open) => !open && setEditingDeck(null)}
      >
        <DialogContent className="border-white/10 bg-[#0f172a] text-slate-200">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white">
              Rename Deck
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Enter a new name for this card deck.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={editingDeck?.name ?? ''}
              onChange={(e) =>
                setEditingDeck((prev) =>
                  prev ? { ...prev, name: e.target.value } : null
                )
              }
              className="border-white/10 bg-white/5 text-white"
              onKeyDown={(e) => e.key === 'Enter' && handleUpdateDeck()}
            />
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setEditingDeck(null)}
              className="text-slate-400 hover:bg-white/5 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateDeck}
              className="bg-cyan-600 text-white hover:bg-cyan-500"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
