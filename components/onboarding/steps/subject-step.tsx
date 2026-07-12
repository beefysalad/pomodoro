'use client'

import { CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { InlineFeedback } from '@/components/onboarding/inline-feedback'

interface SubjectStepProps {
  subjects: Array<{ id: string; name: string }>
  hasSubject: boolean
  newSubjectName: string
  onChangeName: (value: string) => void
  onSubmit: () => void
  isPending: boolean
  showFeedback: boolean
}

export function SubjectStep({
  subjects,
  hasSubject,
  newSubjectName,
  onChangeName,
  onSubmit,
  isPending,
  showFeedback,
}: SubjectStepProps) {
  return (
    <div className="space-y-8">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-violet-500/30 bg-violet-600/20 text-2xl">
        📚
      </div>
      <div className="space-y-2">
        <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
          Create your first subject
        </h2>
        <p className="mx-auto max-w-2xl text-sm text-slate-400">
          Subjects are your big buckets. Think Math, Biology, or System Design.
        </p>
      </div>

      <div className="mx-auto w-full max-w-xl space-y-6">
        <div className="bg-glass-soft flex items-center gap-3 rounded-2xl border border-white/10 p-3">
          <Input
            id="subject-name"
            value={newSubjectName}
            onChange={(e) => onChangeName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
            placeholder="e.g. Mathematics"
            className="h-14 border-white/10 bg-white/5 text-white placeholder:text-slate-600 focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20"
          />
          <Button
            onClick={onSubmit}
            disabled={!newSubjectName.trim() || isPending}
            className="h-14 rounded-xl bg-violet-600 px-6 font-semibold text-white hover:bg-violet-500"
          >
            Add subject
          </Button>
        </div>

        <div className="flex min-h-8 flex-wrap items-center justify-center gap-2">
          <InlineFeedback show={showFeedback} label="Subject created" />
          {hasSubject &&
            subjects.map((s) => (
              <span
                key={s.id}
                className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300"
              >
                <CheckCircle2 className="h-3 w-3" />
                {s.name}
              </span>
            ))}
        </div>
      </div>
    </div>
  )
}
