'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface BulkImportCardProps {
  importOpen: boolean
  onToggleImportOpen: () => void
  importText: string
  onImportTextChange: (text: string) => void
  onImportFromText: () => void
}

export function BulkImportCard({
  importOpen,
  onToggleImportOpen,
  importText,
  onImportTextChange,
  onImportFromText,
}: BulkImportCardProps) {
  return (
    <Card className="border-white/10 bg-white/[0.05] py-0 backdrop-blur-xl">
      <CardContent className="space-y-3 px-4 py-5 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs font-semibold tracking-[0.16em] text-slate-400 uppercase">
              Optional
            </p>
            <h3 className="text-base font-bold text-white">
              Bulk import (paste Q/A)
            </h3>
            <p className="text-xs text-slate-400">
              If you already have cards, paste them here. Otherwise, skip and
              add manually below.
            </p>
          </div>
          <Button
            variant="outline"
            className="border-white/15 bg-white/5 text-slate-200 hover:bg-white/10"
            onClick={onToggleImportOpen}
          >
            {importOpen ? 'Hide' : 'Show'} import
          </Button>
        </div>

        {importOpen && (
          <div className="space-y-2">
            <p className="text-[11px] text-slate-500">
              Format:{' '}
              <span className="text-slate-300">
                Term | Answer | choice1 | choice2 | choice3
              </span>
            </p>
            <textarea
              value={importText}
              onChange={(event) => onImportTextChange(event.target.value)}
              placeholder="What is 1 + 1? | 2 | 1 | 3 | 4"
              className="min-h-[120px] w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500"
            />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-slate-400">
                Tip: paste many lines. Each line becomes one card.
              </div>
              <Button
                variant="outline"
                className="border-white/15 bg-white/5 text-slate-200 hover:bg-white/10"
                onClick={onImportFromText}
                disabled={!importText.trim()}
              >
                Import now
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
