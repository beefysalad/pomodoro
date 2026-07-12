'use client'

import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import type { DraftCard } from '@/components/subjects-flashcards/draft-card'

interface DraftCardEditorProps {
  card: DraftCard
  index: number
  onUpdate: (id: string, patch: Partial<DraftCard>) => void
  onRemove: (id: string) => void
  canRemove: boolean
}

export function DraftCardEditor({
  card,
  index,
  onUpdate,
  onRemove,
  canRemove,
}: DraftCardEditorProps) {
  return (
    <Card className="py-0 backdrop-blur-xl">
      <CardContent className="space-y-3 px-4 py-5 sm:px-6">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-slate-400">{index + 1}</p>
          <Button
            variant="outline"
            className="h-7 border-red-400/35 bg-red-500/10 px-2 text-red-200 hover:bg-red-500/20"
            onClick={() => onRemove(card.id)}
            disabled={!canRemove}
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
                onUpdate(card.id, { question: event.target.value })
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
                onUpdate(card.id, { answer: event.target.value })
              }
              placeholder="Enter answer (2) "
              className="mt-2 border-white/15 bg-white/5 text-white placeholder:text-slate-500"
            />
          </div>
        </div>
        <Input
          value={card.hint}
          onChange={(event) => onUpdate(card.id, { hint: event.target.value })}
          placeholder="Hint (optional)"
          className="border-white/15 bg-white/5 text-white placeholder:text-slate-500"
        />
        <textarea
          value={card.choicesText}
          onChange={(event) =>
            onUpdate(card.id, { choicesText: event.target.value })
          }
          placeholder="Multiple choices (optional, one per line)"
          className="min-h-[96px] w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500"
        />
      </CardContent>
    </Card>
  )
}
