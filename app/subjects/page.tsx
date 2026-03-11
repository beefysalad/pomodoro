'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQueries } from '@tanstack/react-query'
import {
  ArrowRight,
  BookMarked,
  Clock3,
  Flame,
  Plus,
  Target,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import { AppHeader } from '@/components/app-header'
import { ConfirmActionDialog } from '@/components/confirm-action-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useTimer } from '@/app/providers/timer-provider'
import {
  useCreateSubject,
  useDeleteSubject,
  useSubjects,
} from '@/hooks/use-subjects'
import { getTopics } from '@/lib/api/topics'

function formatDuration(totalSeconds: number) {
  const totalMinutes = Math.floor(totalSeconds / 60)
  if (totalMinutes < 60) return `${totalMinutes}m`
  const hours = Math.floor(totalMinutes / 60)
  const mins = totalMinutes % 60
  return `${hours}h ${mins}m`
}

export default function SubjectsPage() {
  const router = useRouter()
  const timer = useTimer()
  const { data: subjects = [], isLoading } = useSubjects()
  const createSubject = useCreateSubject()
  const deleteSubject = useDeleteSubject()
  const [newSubjectName, setNewSubjectName] = useState('')
  const [isCreateSubjectOpen, setIsCreateSubjectOpen] = useState(false)
  const [deleteSubjectState, setDeleteSubjectState] = useState<{
    id: string
    name: string
  } | null>(null)
  const [pageMessage, setPageMessage] = useState('')

  const topicQueries = useQueries({
    queries: subjects.map((subject) => ({
      queryKey: ['subject', subject.id],
      queryFn: () => getTopics(subject.id),
      enabled: !!subject.id,
    })),
  })

  const enrichedSubjects = useMemo(
    () =>
      subjects.map((subject, index) => {
        const topics = topicQueries[index]?.data?.topics ?? []
        return {
          ...subject,
          topicCount: topics.length,
          totalSeconds: topics.reduce((sum, topic) => sum + topic.totalTime, 0),
          totalSessions: topics.reduce(
            (sum, topic) => sum + topic._count.sessions,
            0
          ),
          doneTopics: topics.filter((topic) => topic.status === 'DONE').length,
          inProgressTopics: topics.filter(
            (topic) => topic.status === 'IN_PROGRESS'
          ).length,
        }
      }),
    [subjects, topicQueries]
  )

  const onCreateSubject = async () => {
    const name = newSubjectName.trim()
    if (!name) return

    try {
      await createSubject.mutateAsync({ name })
      setNewSubjectName('')
      setIsCreateSubjectOpen(false)
      toast.success(`Subject created: ${name}`)
    } catch {
      toast.error('Could not create subject.')
    }
  }

  const onDeleteSubject = async (id: string, name: string) => {
    try {
      await deleteSubject.mutateAsync(id)
      setDeleteSubjectState(null)
      setPageMessage(`Deleted subject: ${name}`)
    } catch {
      setPageMessage('Could not delete subject.')
    }
  }

  const onStartPomodoro = (subjectId: string) => {
    timer.setActiveSubjectId(subjectId)
    timer.setSelectedTopicId('')
    timer.setPhase('focus')
    timer.setRunning(false)
    timer.setFinished(false)
    timer.setHasStarted(false)
    timer.setMoveDonePromptOpen(false)
    timer.setPendingReview(false)
    router.push('/dashboard')
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#070b16] text-slate-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-[-120px] right-[-120px] h-[340px] w-[340px] rounded-full bg-cyan-500/10 blur-[120px]" />
        <div className="absolute bottom-[-100px] left-[-100px] h-[340px] w-[340px] rounded-full bg-violet-600/12 blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-10">
        <AppHeader />

        <section className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.18em] text-cyan-300 uppercase">
              Subjects
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">
              Organize your study universe
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              Each subject contains focused topics. Track momentum and drill
              into details per subject.
            </p>
          </div>

          <Dialog
            open={isCreateSubjectOpen}
            onOpenChange={setIsCreateSubjectOpen}
          >
            <DialogTrigger asChild>
              <Button className="bg-violet-600 text-white hover:bg-violet-500">
                <Plus className="h-4 w-4" />
                Create subject
              </Button>
            </DialogTrigger>
            <DialogContent className="border-white/15 bg-[#0d1627] text-slate-100">
              <DialogHeader>
                <DialogTitle>Create new subject</DialogTitle>
                <DialogDescription>
                  Add a subject to start organizing topics and timer sessions.
                </DialogDescription>
              </DialogHeader>
              <Input
                value={newSubjectName}
                onChange={(event) => setNewSubjectName(event.target.value)}
                placeholder="e.g. Mathematics"
                className="border-white/15 bg-white/5 text-white placeholder:text-slate-500"
                onKeyDown={(event) => {
                  if (event.key === 'Enter') void onCreateSubject()
                }}
              />
              <DialogFooter>
                <Button
                  onClick={onCreateSubject}
                  disabled={!newSubjectName.trim() || createSubject.isPending}
                  className="bg-violet-600 text-white hover:bg-violet-500"
                >
                  <Plus className="h-4 w-4" />
                  Add subject
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </section>

        <section
          className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
          id="tutorial-subject-list"
        >
          {!!pageMessage && (
            <div className="col-span-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-slate-300">
              {pageMessage}
            </div>
          )}
          {isLoading ? (
            <p className="text-sm text-slate-400">Loading subjects...</p>
          ) : !enrichedSubjects.length ? (
            <Card className="col-span-full border-white/10 bg-white/[0.05] py-0 backdrop-blur-xl">
              <CardContent className="px-4 py-6 text-sm text-slate-400">
                No subjects yet. Add one to get started.
              </CardContent>
            </Card>
          ) : (
            enrichedSubjects.map((subject, index) => (
              <Card
                key={subject.id}
                className="h-full border-white/10 bg-white/[0.05] py-0 transition hover:border-violet-400/40 hover:bg-white/[0.08]"
              >
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

                  <h3 className="text-lg font-bold text-white">
                    {subject.name}
                  </h3>

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
                      <span>
                        {subject.topicCount
                          ? Math.round(
                              (subject.doneTopics / subject.topicCount) * 100
                            )
                          : 0}
                        %
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-violet-500"
                        style={{
                          width: `${subject.topicCount ? Math.round((subject.doneTopics / subject.topicCount) * 100) : 0}%`,
                        }}
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
                        id={index === 0 ? 'tutorial-subject-first' : undefined}
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
                      onClick={() =>
                        setDeleteSubjectState({
                          id: subject.id,
                          name: subject.name,
                        })
                      }
                      disabled={deleteSubject.isPending}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </section>
      </div>

      <ConfirmActionDialog
        open={!!deleteSubjectState}
        title="Delete subject?"
        description={
          deleteSubjectState
            ? `Delete "${deleteSubjectState.name}" and all its topics/sessions? This cannot be undone.`
            : ''
        }
        confirmLabel="Delete subject"
        pending={deleteSubject.isPending}
        onOpenChange={(open) => {
          if (!open) setDeleteSubjectState(null)
        }}
        onConfirm={() => {
          if (!deleteSubjectState) return
          void onDeleteSubject(deleteSubjectState.id, deleteSubjectState.name)
        }}
      />
    </div>
  )
}
