import Link from 'next/link'
import {
  ArrowRight,
  BookMarked,
  Clock3,
  Flame,
  Target,
  Trash2,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { formatDuration } from '@/lib/format'
import type { Subject } from '@/lib/api/subjects'

export interface EnrichedSubject extends Subject {
  topicCount: number
  totalSeconds: number
  totalSessions: number
  doneTopics: number
  inProgressTopics: number
}

interface SubjectCardProps {
  subject: EnrichedSubject
  isFirst: boolean
  isDeletePending: boolean
  onStartPomodoro: (subjectId: string) => void
  onRequestDelete: (id: string, name: string) => void
}

export function SubjectCard({
  subject,
  isFirst,
  isDeletePending,
  onStartPomodoro,
  onRequestDelete,
}: SubjectCardProps) {
  const completionPercent = subject.topicCount
    ? Math.round((subject.doneTopics / subject.topicCount) * 100)
    : 0

  return (
    <Card className="h-full py-0 transition hover:border-violet-400/40 hover:bg-white/[0.08]">
      <CardContent className="space-y-3 px-4 py-5 sm:px-5">
        <div className="flex items-center justify-between gap-2">
          <span
            className="inline-flex h-3 w-3 rounded-full"
            style={{ backgroundColor: subject.color }}
          />
          <Badge className="bg-violet-500/20 text-violet-200">
            {subject.topicCount} topics
          </Badge>
        </div>

        <h3 className="text-lg font-bold text-white">{subject.name}</h3>

        <div className="space-y-1.5 text-sm text-slate-300">
          <p className="inline-flex items-center gap-2">
            <Clock3 className="h-3.5 w-3.5" />
            {formatDuration(subject.totalSeconds)} tracked
          </p>
          <p className="inline-flex items-center gap-2">
            <BookMarked className="h-3.5 w-3.5" />
            {subject.totalSessions} sessions
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Completion</span>
            <span>{completionPercent}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-violet-500"
              style={{ width: `${completionPercent}%` }}
            />
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-1 text-emerald-200">
              <Target className="h-3 w-3" />
              {subject.doneTopics} done
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-500/10 px-2 py-1 text-amber-200">
              <Flame className="h-3 w-3" />
              {subject.inProgressTopics} active
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            asChild
            className="h-9 flex-1 bg-cyan-600 text-white hover:bg-cyan-500"
          >
            <Link
              href={`/subjects/${subject.id}`}
              id={isFirst ? 'tutorial-subject-first' : undefined}
            >
              Open subject <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
          <Button
            variant="outline"
            className="h-9 border-emerald-400/35 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20"
            onClick={() => onStartPomodoro(subject.id)}
            disabled={subject.topicCount === 0}
          >
            Start
          </Button>
          <Button
            variant="outline"
            className="h-9 border-red-400/35 bg-red-500/10 text-red-200 hover:bg-red-500/20"
            onClick={() => onRequestDelete(subject.id, subject.name)}
            disabled={isDeletePending}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
