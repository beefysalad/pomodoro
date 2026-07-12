import Link from 'next/link'
import { BookOpen, Edit2, MoreVertical, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { FlashcardDeck } from '@/lib/api/flashcard-decks'

interface DeckCardProps {
  deck: FlashcardDeck
  subjectId: string
  onRequestRename: (deck: { id: string; name: string }) => void
  onRequestDelete: (deckId: string) => void
}

export function DeckCard({
  deck,
  subjectId,
  onRequestRename,
  onRequestDelete,
}: DeckCardProps) {
  return (
    <div className="group relative">
      <Link href={`/subjects/${subjectId}?view=flashcards&deckId=${deck.id}`}>
        <Card className="relative h-full overflow-hidden transition-all hover:border-cyan-500/40 hover:bg-white/[0.08] hover:shadow-[0_0_20px_rgba(34,211,238,0.15)]">
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
              Last studied: {new Date(deck.updatedAt).toLocaleDateString()}
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
              onClick={() => onRequestRename({ id: deck.id, name: deck.name })}
              className="focus:bg-white/10 focus:text-white"
            >
              <Edit2 className="mr-2 h-4 w-4" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onRequestDelete(deck.id)}
              className="text-red-400 focus:bg-red-400/10 focus:text-red-400"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
