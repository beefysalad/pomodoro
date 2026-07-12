'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQueries } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { AppHeader } from '@/components/app-header'
import { ConfirmActionDialog } from '@/components/confirm-action-dialog'
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
import { SubjectCard } from '@/components/subjects/subject-card'
import { useTimer } from '@/app/providers/timer-provider'
import {
  useCreateSubject,
  useDeleteSubject,
  useSubjects,
} from '@/hooks/use-subjects'
import { getTopics } from '@/lib/api/topics'

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
            <div className="bg-glass-soft col-span-full rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-300">
              {pageMessage}
            </div>
          )}
          {isLoading ? (
            <p className="text-sm text-slate-400">Loading subjects...</p>
          ) : !enrichedSubjects.length ? (
            <Card className="col-span-full py-0 backdrop-blur-xl">
              <CardContent className="px-4 py-6 text-sm text-slate-400">
                No subjects yet. Add one to get started.
              </CardContent>
            </Card>
          ) : (
            enrichedSubjects.map((subject, index) => (
              <SubjectCard
                key={subject.id}
                subject={subject}
                isFirst={index === 0}
                isDeletePending={deleteSubject.isPending}
                onStartPomodoro={onStartPomodoro}
                onRequestDelete={(id, name) =>
                  setDeleteSubjectState({ id, name })
                }
              />
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
