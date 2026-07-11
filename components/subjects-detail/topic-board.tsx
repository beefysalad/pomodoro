'use client'

import { useMemo, useState } from 'react'
import { GripVertical, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { formatDuration } from '@/lib/format'
import {
  TOPIC_STATUSES,
  TOPIC_STATUS_LABEL,
  type TopicStatus,
} from '@/lib/topic-status'
import type { Topic } from '@/lib/api/topics'

export function TopicBoard({
  byStatus,
  strongest,
  moveTopicToStatus,
  onStartPomodoro,
  onRequestDeleteTopic,
  deleteTopicPending,
}: {
  byStatus: Record<TopicStatus, Topic[]>
  strongest: Topic | undefined
  moveTopicToStatus: (
    topicId: string,
    status: TopicStatus
  ) => Promise<void> | void
  onStartPomodoro: (topicId: string, status: TopicStatus) => void
  onRequestDeleteTopic: (topic: { id: string; name: string }) => void
  deleteTopicPending: boolean
}) {
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

  return (
    <>
      <section className="grid gap-4 xl:grid-cols-4" id="tutorial-kanban">
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
                {byStatus[status].length}
              </Badge>
            </div>

            <div className="space-y-2">
              {byStatus[status].map((topic) => {
                const relative = strongest?.totalTime
                  ? Math.max(
                      8,
                      Math.round(
                        (topic.totalTime / strongest.totalTime) * 100
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
                            onRequestDeleteTopic({
                              id: topic.id,
                              name: topic.name,
                            })
                          }
                          disabled={deleteTopicPending}
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

              {byStatus[status].length === 0 && (
                <div className="rounded-xl border border-dashed border-white/15 bg-white/[0.02] px-3 py-6 text-center text-xs text-slate-500">
                  Drop topics here
                </div>
              )}
            </div>
          </div>
        ))}
      </section>

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
    </>
  )
}
