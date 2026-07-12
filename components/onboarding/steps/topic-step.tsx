'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { InlineFeedback } from '@/components/onboarding/inline-feedback'

interface TopicStepProps {
  subjects: Array<{ id: string; name: string }>
  resolvedSubjectId: string
  onChangeSubject: (id: string) => void
  newTopicName: string
  onChangeName: (value: string) => void
  onSubmit: () => void
  isPending: boolean
  showFeedback: boolean
}

export function TopicStep({
  subjects,
  resolvedSubjectId,
  onChangeSubject,
  newTopicName,
  onChangeName,
  onSubmit,
  isPending,
  showFeedback,
}: TopicStepProps) {
  return (
    <div className="space-y-8">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-500/30 bg-cyan-600/20 text-2xl">
        🎯
      </div>
      <div className="space-y-2">
        <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
          Add your first topic
        </h2>
        <p className="mx-auto max-w-2xl text-sm text-slate-400">
          Keep topics small and concrete so each session feels like a win.
        </p>
      </div>

      <div className="mx-auto w-full max-w-xl space-y-5">
        <div className="bg-glass-soft rounded-2xl border border-white/10 p-4">
          <Label className="block text-xs tracking-widest text-slate-500 uppercase">
            Subject
          </Label>
          <select
            value={resolvedSubjectId}
            onChange={(e) => onChangeSubject(e.target.value)}
            className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white transition-all outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20"
            disabled={!subjects.length}
          >
            {!subjects.length ? (
              <option value="">No subjects yet</option>
            ) : (
              subjects.map((subject) => (
                <option
                  key={subject.id}
                  value={subject.id}
                  className="bg-slate-900 text-white"
                >
                  {subject.name}
                </option>
              ))
            )}
          </select>
        </div>

        <div className="bg-glass-soft flex items-center gap-3 rounded-2xl border border-white/10 p-3">
          <Input
            id="topic-name"
            value={newTopicName}
            onChange={(e) => onChangeName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
            placeholder="e.g. Derivatives basics"
            className="h-14 border-white/10 bg-white/5 text-white placeholder:text-slate-600 focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/20"
          />
          <Button
            onClick={onSubmit}
            disabled={!newTopicName.trim() || !resolvedSubjectId || isPending}
            className="h-14 rounded-xl bg-cyan-600 px-6 font-semibold text-white hover:bg-cyan-500"
          >
            Add topic
          </Button>
        </div>

        <div className="flex min-h-8 items-center justify-center">
          <InlineFeedback show={showFeedback} label="Topic created" />
        </div>
      </div>
    </div>
  )
}
