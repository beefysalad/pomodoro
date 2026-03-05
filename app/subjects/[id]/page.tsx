'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  GripVertical,
  Plus,
  Sparkles,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import { AppHeader } from '@/components/app-header'
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
  const params = useParams<{ id: string }>()
  const subjectId = params.id
  const { data: subject, isLoading } = useSubjectTopics(subjectId)
  const createTopic = useCreateTopic()
  const updateTopic = useUpdateTopic()
  const deleteTopic = useDeleteTopic()

  const [newTopicName, setNewTopicName] = useState('')
  const [draggingTopicId, setDraggingTopicId] = useState('')
  const [isAddTopicOpen, setIsAddTopicOpen] = useState(false)

  const onDragStartTopic = (
    event: React.DragEvent<HTMLDivElement>,
    topicId: string
  ) => {
    setDraggingTopicId(topicId)

    // Use a custom ghost image to avoid browser snapshots that can include nearby UI.
    const source = event.currentTarget
    const ghost = source.cloneNode(true) as HTMLDivElement
    ghost.style.position = 'fixed'
    ghost.style.top = '-1000px'
    ghost.style.left = '-1000px'
    ghost.style.width = `${source.offsetWidth}px`
    ghost.style.pointerEvents = 'none'
    ghost.style.opacity = '0.92'
    ghost.style.transform = 'scale(0.98)'
    ghost.style.boxShadow = '0 16px 40px rgba(0,0,0,0.45)'
    ghost.style.zIndex = '9999'
    document.body.appendChild(ghost)

    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/topic-id', topicId)
    event.dataTransfer.setDragImage(ghost, source.offsetWidth / 2, 24)

    requestAnimationFrame(() => {
      if (ghost.parentNode) ghost.parentNode.removeChild(ghost)
    })
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
    const confirmed = window.confirm(
      `Delete topic "${topicName}" and its sessions? This cannot be undone.`
    )
    if (!confirmed) return

    try {
      await deleteTopic.mutateAsync({
        subjectId,
        topicId,
      })
      toast.success(`Deleted topic: ${topicName}`)
    } catch {
      toast.error('Could not delete topic.')
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
      toast.success(`Moved to ${TOPIC_STATUS_LABEL[status]}`)
    } catch {
      toast.error('Could not move topic.')
    }
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
              {isLoading ? 'Loading subject...' : subject?.name ?? 'Subject'}
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              Drag topics across stages as you study: Backlog, To Study, In Progress, Done.
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
                  Add a topic to this subject so you can move it across your study workflow.
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
          <StatCard label="Tracked time" value={formatDuration(topicStats.totalSeconds)} />
          <Card className="border-white/10 bg-white/[0.05] py-0 backdrop-blur-xl">
            <CardContent className="px-4 py-4 sm:px-5">
              <p className="text-xs text-slate-400">Completion</p>
              <p className="mt-1 text-2xl font-extrabold text-white">{completionPct}%</p>
              <Progress value={Math.max(0, completionPct)} className="mt-2 h-2 bg-white/10" />
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 xl:grid-cols-4">
          {TOPIC_STATUSES.map((status) => (
            <div
              key={status}
              onDragOver={(event) => event.preventDefault()}
              onDrop={async () => {
                if (!draggingTopicId) return
                await moveTopicToStatus(draggingTopicId, status)
                setDraggingTopicId('')
              }}
              className="min-h-[320px] rounded-2xl border border-white/10 bg-white/[0.04] p-3"
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
                    ? Math.max(8, Math.round((topic.totalTime / topicStats.strongest.totalTime) * 100))
                    : 8

                  return (
                    <div
                      key={topic.id}
                      draggable
                      onDragStart={(event) => onDragStartTopic(event, topic.id)}
                      onDragEnd={() => setDraggingTopicId('')}
                      className={`rounded-xl border border-white/10 bg-[#0d1627]/80 p-3 transition ${
                        draggingTopicId === topic.id ? 'opacity-45' : 'opacity-100'
                      }`}
                    >
                      <div className="mb-1.5 flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-white">{topic.name}</p>
                        <div className="flex items-center gap-1">
                          <GripVertical className="h-4 w-4 text-slate-500" />
                          <Button
                            variant="outline"
                            className="h-7 border-red-400/35 bg-red-500/10 px-2 text-red-200 hover:bg-red-500/20"
                            onClick={() => onDeleteTopic(topic.id, topic.name)}
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
                            onClick={() => moveTopicToStatus(topic.id, 'IN_PROGRESS')}
                          >
                            Start
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
                  <p className="text-lg font-extrabold text-white">{topicStats.strongest.name}</p>
                  <p className="text-sm text-slate-300">
                    Most studied topic with {formatDuration(topicStats.strongest.totalTime)} and{' '}
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
                <Sparkles className="h-4 w-4" />
                Workflow tip
              </p>
              <p className="text-sm text-slate-200">
                Move topics to In Progress when you start a timer, then to Done after strong sessions to keep momentum visible.
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
