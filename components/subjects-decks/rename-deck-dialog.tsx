import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface RenameDeckDialogProps {
  editingDeck: { id: string; name: string } | null
  onClose: () => void
  onNameChange: (name: string) => void
  onSave: () => void
}

export function RenameDeckDialog({
  editingDeck,
  onClose,
  onNameChange,
  onSave,
}: RenameDeckDialogProps) {
  return (
    <Dialog open={!!editingDeck} onOpenChange={(open) => !open && onClose()}>
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
            onChange={(e) => onNameChange(e.target.value)}
            className="border-white/10 bg-white/5 text-white"
            onKeyDown={(e) => e.key === 'Enter' && onSave()}
          />
        </div>
        <DialogFooter>
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-slate-400 hover:bg-white/5 hover:text-white"
          >
            Cancel
          </Button>
          <Button
            onClick={onSave}
            className="bg-cyan-600 text-white hover:bg-cyan-500"
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
