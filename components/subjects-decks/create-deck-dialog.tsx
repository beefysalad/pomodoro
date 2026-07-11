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

interface CreateDeckDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  name: string
  onNameChange: (name: string) => void
  onCreate: () => void
}

export function CreateDeckDialog({
  open,
  onOpenChange,
  name,
  onNameChange,
  onCreate,
}: CreateDeckDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="e.g. Chapter 1: Introduction"
            className="border-white/10 bg-white/5 text-white"
            onKeyDown={(e) => e.key === 'Enter' && onCreate()}
          />
        </div>
        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="text-slate-400 hover:bg-white/5 hover:text-white"
          >
            Cancel
          </Button>
          <Button
            onClick={onCreate}
            className="bg-violet-600 text-white hover:bg-violet-500"
          >
            Create Deck
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
