'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  GripVertical,
  Plus,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import { AppHeader } from '@/components/app-header'
import { useTimer } from '@/app/providers/timer-provider'
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
import { Progress } from '@/components/ui/progress'
import {
  useCreateTopic,
  useDeleteTopic,
  useSubjectTopics,
  useUpdateTopic,
} from '@/hooks/use-topics'
import {
  TOPIC_STATUSES,
  TOPIC_STATUS_LABEL,
  type TopicStatus,
} from '@/lib/topic-status'

function formatDuration(totalSeconds: number) {
  const totalMinutes = Math.floor(totalSeconds / 60)
  if (totalMinutes < 60) return `${totalMinutes}m`
  const hours = Math.floor(totalMinutes / 60)
  const mins = totalMinutes % 60
  return `${hours}h ${mins}m`
}

export default function SubjectDetailPage() {
  const router = useRouter()
  const timer = useTimer()
  const params = useParams<{ id: string }>()
  const subjectId = params.id
  const { data: subject, isLoading } = useSubjectTopics(subjectId)
  const createTopic = useCreateTopic()
  const updateTopic = useUpdateTopic()
  const deleteTopic = useDeleteTopic()

  const [newTopicName, setNewTopicName] = useState('')
  const [draggingTopicId, setDraggingTopicId] = useState('')
  const [activeDropStatus, setActiveDropStatus] = useState<TopicStatus | null>(
    null
  )
  const [dragPreview, setDragPreview] = useState<{
    id: string
    name: string
    totalTime: number
    sessions: number
    x: number
    y: number
  } | null>(null)
  const [isAddTopicOpen, setIsAddTopicOpen] = useState(false)
  const [deleteTopicState, setDeleteTopicState] = useState<{
    id: string
    name: string
  } | null>(null)
  const [pageMessage, setPageMessage] = useState('')
  const transparentDragImage = useMemo(() => {
    if (typeof window === 'undefined') return null
    const image = new window.Image()
    image.src =
      'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=='
    return image
  }, [])

  const onDragStartTopic = (
    event: React.DragEvent<HTMLDivElement>,
    topic: {
      id: string
      name: string
      totalTime: number
      _count: { sessions: number }
    }
  ) => {
    setDraggingTopicId(topic.id)
    setDragPreview({
      id: topic.id,
      name: topic.name,
      totalTime: topic.totalTime,
      sessions: topic._count.sessions,
      x: event.clientX,
      y: event.clientY,
    })

    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/topic-id', topic.id)
    if (transparentDragImage) {
      event.dataTransfer.setDragImage(transparentDragImage, 0, 0)
    }
  }

  const onDragTopic = (event: React.DragEvent<HTMLDivElement>) => {
    if (!draggingTopicId || event.clientX <= 0 || event.clientY <= 0) return
    setDragPreview((prev) =>
      prev
        ? {
            ...prev,
            x: event.clientX,
            y: event.clientY,
          }
        : prev
    )
  }

  const clearDragState = () => {
    setDraggingTopicId('')
    setActiveDropStatus(null)
    setDragPreview(null)
  }

  const topicStats = useMemo(() => {
    const topics = subject?.topics ?? []
    const totalSeconds = topics.reduce((sum, topic) => sum + topic.totalTime, 0)
    const totalSessions = topics.reduce(
      (sum, topic) => sum + topic._count.sessions,
      0
    )
    const strongest = [...topics].sort((a, b) => b.totalTime - a.totalTime)[0]

    const byStatus = TOPIC_STATUSES.reduce(
      (acc, status) => {
        acc[status] = topics
          .filter((topic) => topic.status === status)
          .sort((a, b) => a.position - b.position)
        return acc
      },
      {} as Record<TopicStatus, typeof topics>
    )

    return {
      topics,
      totalSeconds,
      totalSessions,
      strongest,
      byStatus,
    }
  }, [subject])

  const onCreateTopic = async () => {
    const name = newTopicName.trim()
    if (!name) return

    try {
      await createTopic.mutateAsync({
        subjectId,
        payload: { name },
      })
      setNewTopicName('')
      setIsAddTopicOpen(false)
      toast.success(`Topic created: ${name}`)
    } catch {
      toast.error('Could not create topic.')
    }
  }

  const onDeleteTopic = async (topicId: string, topicName: string) => {
    try {
      await deleteTopic.mutateAsync({
        subjectId,
        topicId,
      })
      setDeleteTopicState(null)
      setPageMessage(`Deleted topic: ${topicName}`)
    } catch {
      setPageMessage('Could not delete topic.')
    }
  }

  const moveTopicToStatus = async (topicId: string, status: TopicStatus) => {
    const topic = topicStats.topics.find((item) => item.id === topicId)
    if (!topic || topic.status === status) return

    try {
      await updateTopic.mutateAsync({
        subjectId,
        topicId,
        payload: {
          status,
          position: topicStats.byStatus[status].length,
        },
      })
    } catch {
      setPageMessage('Could not move topic.')
    }
  }

  const onStartPomodoro = async (
    topicId: string,
    currentStatus: TopicStatus
  ) => {
    if (currentStatus !== 'IN_PROGRESS') {
      await moveTopicToStatus(topicId, 'IN_PROGRESS')
    }
    timer.setActiveSubjectId(subjectId)
    timer.setSelectedTopicId(topicId)
    timer.setPhase('focus')
    timer.setRunning(false)
    timer.setFinished(false)
    timer.setHasStarted(false)
    timer.setMoveDonePromptOpen(false)
    timer.setPendingReview(false)
    router.push('/dashboard')
  }

  const completedTopics = topicStats.byStatus.DONE.length
  const completionPct = topicStats.topics.length
    ? Math.round((completedTopics / topicStats.topics.length) * 100)
    : 0

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#070b16] text-slate-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-[-100px] right-[-100px] h-[320px] w-[320px] rounded-full bg-cyan-500/10 blur-[110px]" />
        <div className="absolute bottom-[-80px] left-[-90px] h-[320px] w-[320px] rounded-full bg-violet-600/12 blur-[110px]" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-10">
        <AppHeader />

        <section className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Link
              href="/subjects"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 transition hover:text-slate-200"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to subjects
            </Link>

            <h1 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">
              {isLoading ? 'Loading subject...' : (subject?.name ?? 'Subject')}
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              Drag topics across stages as you study: Backlog, To Study, In
              Progress, Done.
            </p>
          </div>

          <Dialog open={isAddTopicOpen} onOpenChange={setIsAddTopicOpen}>
            <DialogTrigger asChild>
              <Button className="bg-cyan-600 text-white hover:bg-cyan-500">
                <Plus className="h-4 w-4" />
                Add topic
              </Button>
            </DialogTrigger>
            <DialogContent className="border-white/15 bg-[#0d1627] text-slate-100">
              <DialogHeader>
                <DialogTitle>Add topic</DialogTitle>
                <DialogDescription>
                  Add a topic to this subject so you can move it across your
                  study workflow.
                </DialogDescription>
              </DialogHeader>
              <Input
                value={newTopicName}
                onChange={(event) => setNewTopicName(event.target.value)}
                placeholder="e.g. Calculus derivatives"
                className="border-white/15 bg-white/5 text-white placeholder:text-slate-500"
                onKeyDown={(event) => {
                  if (event.key === 'Enter') void onCreateTopic()
                }}
              />
              <DialogFooter>
                <Button
                  onClick={onCreateTopic}
                  disabled={!newTopicName.trim() || createTopic.isPending}
                  className="bg-cyan-600 text-white hover:bg-cyan-500"
                >
                  <Plus className="h-4 w-4" />
                  Add topic
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </section>

        <section className="grid gap-4 sm:grid-cols-4">
          <StatCard label="Topics" value={String(topicStats.topics.length)} />
          <StatCard label="Sessions" value={String(topicStats.totalSessions)} />
          <StatCard
            label="Tracked time"
            value={formatDuration(topicStats.totalSeconds)}
          />
          <Card className="border-white/10 bg-white/[0.05] py-0 backdrop-blur-xl">
            <CardContent className="px-4 py-4 sm:px-5">
              <p className="text-xs text-slate-400">Completion</p>
              <p className="mt-1 text-2xl font-extrabold text-white">
                {completionPct}%
              </p>
              <Progress
                value={Math.max(0, completionPct)}
                className="mt-2 h-2 bg-white/10"
              />
            </CardContent>
          </Card>
        </section>

        {!!pageMessage && (
          <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-slate-300">
            {pageMessage}
          </div>
        )}

        <section className="grid gap-4 xl:grid-cols-4">
          {TOPIC_STATUSES.map((status) => (
            <div
              key={status}
              onDragEnter={(event) => {
                event.preventDefault()
                if (!draggingTopicId) return
                setActiveDropStatus(status)
              }}
              onDragOver={(event) => {
                event.preventDefault()
                event.dataTransfer.dropEffect = 'move'
                if (!draggingTopicId) return
                if (activeDropStatus !== status) setActiveDropStatus(status)
              }}
              onDrop={async (event) => {
                event.preventDefault()
                if (!draggingTopicId) return
                await moveTopicToStatus(draggingTopicId, status)
                clearDragState()
              }}
              className={`min-h-[320px] rounded-2xl border bg-white/[0.04] p-3 transition ${
                activeDropStatus === status
                  ? 'border-cyan-300/50 shadow-[0_0_0_1px_rgba(34,211,238,0.35)]'
                  : 'border-white/10'
              }`}
            >
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-white">
                  {TOPIC_STATUS_LABEL[status]}
                </h2>
                <Badge className="bg-white/10 text-slate-300">
                  {topicStats.byStatus[status].length}
                </Badge>
              </div>

              <div className="space-y-2">
                {topicStats.byStatus[status].map((topic) => {
                  const relative = topicStats.strongest?.totalTime
                    ? Math.max(
                        8,
                        Math.round(
                          (topic.totalTime / topicStats.strongest.totalTime) *
                            100
                        )
                      )
                    : 8

                  return (
                    <div
                      key={topic.id}
                      draggable
                      onDragStart={(event) => onDragStartTopic(event, topic)}
                      onDrag={onDragTopic}
                      onDragEnd={clearDragState}
                      className={`rounded-xl border border-white/10 bg-[#0d1627]/80 p-3 transition ${
                        draggingTopicId === topic.id
                          ? 'opacity-20'
                          : 'opacity-100'
                      }`}
                    >
                      <div className="mb-1.5 flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-white">
                          {topic.name}
                        </p>
                        <div className="flex items-center gap-1">
                          <GripVertical className="h-4 w-4 text-slate-500" />
                          <Button
                            variant="outline"
                            className="h-7 border-red-400/35 bg-red-500/10 px-2 text-red-200 hover:bg-red-500/20"
                            onClick={() =>
                              setDeleteTopicState({
                                id: topic.id,
                                name: topic.name,
                              })
                            }
                            disabled={deleteTopic.isPending}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>

                      <div className="mb-1 flex items-center justify-between text-xs text-slate-400">
                        <span>{formatDuration(topic.totalTime)}</span>
                        <span>{topic._count.sessions} sessions</span>
                      </div>
                      <Progress value={relative} className="h-2 bg-white/10" />

                      <div className="mt-2 flex items-center gap-1">
                        {status !== 'IN_PROGRESS' && (
                          <Button
                            size="xs"
                            variant="ghost"
                            className="h-6 bg-white/6 text-[11px] text-slate-300 hover:bg-white/12"
                            onClick={() => onStartPomodoro(topic.id, status)}
                          >
                            Start timer
                          </Button>
                        )}
                        {status === 'IN_PROGRESS' && (
                          <Button
                            size="xs"
                            variant="ghost"
                            className="h-6 bg-cyan-500/15 text-[11px] text-cyan-200 hover:bg-cyan-500/25"
                            onClick={() => onStartPomodoro(topic.id, status)}
                          >
                            Open timer
                          </Button>
                        )}
                        {status !== 'DONE' && (
                          <Button
                            size="xs"
                            variant="ghost"
                            className="h-6 bg-emerald-500/12 text-[11px] text-emerald-200 hover:bg-emerald-500/20"
                            onClick={() => moveTopicToStatus(topic.id, 'DONE')}
                          >
                            Done
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}

                {topicStats.byStatus[status].length === 0 && (
                  <div className="rounded-xl border border-dashed border-white/15 bg-white/[0.02] px-3 py-6 text-center text-xs text-slate-500">
                    Drop topics here
                  </div>
                )}
              </div>
            </div>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <Card className="border-white/10 bg-white/[0.05] py-0 backdrop-blur-xl">
            <CardContent className="space-y-2 px-4 py-5 sm:px-5">
              <h2 className="text-base font-bold text-white">Highlight</h2>
              {topicStats.strongest ? (
                <>
                  <p className="text-lg font-extrabold text-white">
                    {topicStats.strongest.name}
                  </p>
                  <p className="text-sm text-slate-300">
                    Most studied topic with{' '}
                    {formatDuration(topicStats.strongest.totalTime)} and{' '}
                    {topicStats.strongest._count.sessions} sessions.
                  </p>
                </>
              ) : (
                <p className="text-sm text-slate-400">No highlight yet.</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-gradient-to-br from-cyan-500/15 to-violet-500/10 py-0 backdrop-blur-xl">
            <CardContent className="space-y-2 px-4 py-5 sm:px-5">
              <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-cyan-100">
                Workflow tip
              </p>
              <p className="text-sm text-slate-200">
                Move topics to In Progress when you start a timer, then to Done
                after strong sessions to keep momentum visible.
              </p>
              <p className="inline-flex items-center gap-1 text-xs text-emerald-200">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Done topics increase your completion percentage.
              </p>
            </CardContent>
          </Card>
        </section>

        <Link href="/dashboard" className="block">
          <Card className="border-white/10 bg-white/[0.05] py-0 transition hover:border-violet-400/40 hover:bg-white/[0.08]">
            <CardContent className="flex items-center justify-between px-4 py-4 text-sm font-semibold text-white">
              Jump to focus timer
              <Clock3 className="h-4 w-4" />
            </CardContent>
          </Card>
        </Link>
      </div>

      {dragPreview && (
        <div
          className="pointer-events-none fixed z-[120] w-[min(320px,calc(100vw-2rem))] rounded-xl border border-cyan-300/45 bg-[#0d1627]/95 p-3 shadow-[0_18px_40px_rgba(0,0,0,0.45)]"
          style={{
            left: dragPreview.x + 16,
            top: dragPreview.y + 16,
            transform: 'translateZ(0)',
          }}
        >
          <div className="mb-1.5 flex items-start justify-between gap-2">
            <p className="text-sm font-semibold text-white">
              {dragPreview.name}
            </p>
            <GripVertical className="h-4 w-4 text-cyan-200/90" />
          </div>
          <div className="text-xs text-slate-300">
            {formatDuration(dragPreview.totalTime)} · {dragPreview.sessions}{' '}
            sessions
          </div>
        </div>
      )}

      <ConfirmActionDialog
        open={!!deleteTopicState}
        title="Delete topic?"
        description={
          deleteTopicState
            ? `Delete topic "${deleteTopicState.name}" and its sessions? This cannot be undone.`
            : ''
        }
        confirmLabel="Delete topic"
        pending={deleteTopic.isPending}
        onOpenChange={(open) => {
          if (!open) setDeleteTopicState(null)
        }}
        onConfirm={() => {
          if (!deleteTopicState) return
          void onDeleteTopic(deleteTopicState.id, deleteTopicState.name)
        }}
      />
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="border-white/10 bg-white/[0.05] py-0 backdrop-blur-xl">
      <CardContent className="px-4 py-4 sm:px-5">
        <p className="text-xs text-slate-400">{label}</p>
        <p className="mt-1 text-2xl font-extrabold text-white">{value}</p>
      </CardContent>
    </Card>
  )
}
