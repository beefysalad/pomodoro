'use client'

import Link from 'next/link'
import { useMemo, useState, useRef, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  GripVertical,
  Plus,
  Trash2,
  BookOpen,
  Edit2,
  MoreVertical,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import {
  useCreateTopic,
  useDeleteTopic,
  useSubjectTopics,
  useUpdateTopic,
} from '@/hooks/use-topics'
import {
  useDeleteFlashcard,
  useFlashcards,
  useUpdateFlashcard,
  useFlashcardStats,
} from '@/hooks/use-flashcards'
import {
  useFlashcardDecks,
  useUpdateFlashcardDeck,
  useDeleteFlashcardDeck,
} from '@/hooks/use-flashcard-decks'
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

function shuffle<T>(items: T[]) {
  const list = [...items]
  for (let i = list.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[list[i], list[j]] = [list[j], list[i]]
  }
  return list
}

const getNow = () => Date.now()

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
  const searchParams = useSearchParams()
  const viewMode =
    (searchParams.get('view') as 'kanban' | 'flashcards') || 'kanban'
  const flashcardDeckId = searchParams.get('deckId') || ''

  const setViewMode = (view: 'kanban' | 'flashcards') => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('view', view)
    router.push(`?${params.toString()}`, { scroll: false })
  }

  const setFlashcardDeckId = (deckId: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (deckId) {
      params.set('deckId', deckId)
    } else {
      params.delete('deckId')
    }
    router.push(`?${params.toString()}`, { scroll: false })
  }
  const [studyIndex, setStudyIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [isStudyOpen, setIsStudyOpen] = useState(false)
  const [isQuizOpen, setIsQuizOpen] = useState(false)
  const [testActive, setTestActive] = useState(false)
  const [testItems, setTestItems] = useState<
    Array<{ id: string; question: string; answer: string; choices: string[] }>
  >([])
  const [testIndex, setTestIndex] = useState(0)
  const [testScore, setTestScore] = useState(0)
  const [quizTimeLeft, setQuizTimeLeft] = useState(20)
  const [quizSecondsPerQuestion, setQuizSecondsPerQuestion] = useState(20)
  const quizDeadlineRef = useRef<number | null>(null)
  const testIndexRef = useRef(0)
  const testItemsRef = useRef(testItems)
  const [draggingTopicId, setDraggingTopicId] = useState('')
  const [activeDropStatus, setActiveDropStatus] = useState<TopicStatus | null>(
    null
  )
  const [editingDeck, setEditingDeck] = useState<{
    id: string
    name: string
  } | null>(null)
  const [deletingDeckId, setDeletingDeckId] = useState<string | null>(null)

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

  useEffect(() => {
    testIndexRef.current = testIndex
  }, [testIndex])

  useEffect(() => {
    testItemsRef.current = testItems
  }, [testItems])

  const { data: decks = [] } = useFlashcardDecks(subjectId)
  const updateDeck = useUpdateFlashcardDeck(subjectId)
  const deleteDeck = useDeleteFlashcardDeck(subjectId)

  const resolvedFlashcardDeckId = flashcardDeckId || decks[0]?.id || ''

  const { data: flashcards = [] } = useFlashcards(resolvedFlashcardDeckId)
  const updateFlashcard = useUpdateFlashcard(resolvedFlashcardDeckId)
  const deleteFlashcard = useDeleteFlashcard(resolvedFlashcardDeckId)
  const flashcardStats = useFlashcardStats(flashcards)
  const activeStudyCard = flashcards[studyIndex]

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

  const onReviewFlashcard = async (cardId: string, status: string) => {
    try {
      await updateFlashcard.mutateAsync({
        cardId,
        payload: {
          status,
          lastReviewedAt: new Date().toISOString(),
        },
      })
      setShowAnswer(false)
      setStudyIndex((prev) =>
        Math.min(prev + 1, Math.max(0, flashcards.length - 1))
      )
    } catch {
      setPageMessage('Could not update flashcard.')
    }
  }

  const onUpdateDeck = async () => {
    if (!editingDeck || !editingDeck.name.trim()) return
    try {
      await updateDeck.mutateAsync({
        deckId: editingDeck.id,
        payload: { name: editingDeck.name },
      })
      setEditingDeck(null)
      toast.success('Deck renamed')
    } catch {
      toast.error('Could not rename deck')
    }
  }

  const onDeleteDeck = async () => {
    if (!deletingDeckId) return
    try {
      await deleteDeck.mutateAsync(deletingDeckId)
      if (resolvedFlashcardDeckId === deletingDeckId) {
        setFlashcardDeckId('')
      }
      setDeletingDeckId(null)
      toast.success('Deck deleted')
    } catch {
      toast.error('Could not delete deck')
    }
  }

  const onStartTest = (count: number) => {
    const base = shuffle(
      flashcards.map((card) => ({
        id: card.id,
        question: card.question,
        answer: card.answer,
        choices: card.choices ?? [],
      }))
    )
    const items = base.slice(0, Math.min(count, base.length)).map((card) => {
      if (card.choices.length >= 2) {
        const baseChoices = Array.from(new Set([card.answer, ...card.choices]))
        const choices = shuffle(baseChoices).slice(0, 4)
        return { ...card, choices }
      }

      const otherAnswers = shuffle(
        flashcards
          .filter((item) => item.id !== card.id)
          .map((item) => item.answer)
      ).slice(0, 3)
      const choices = shuffle([card.answer, ...otherAnswers]).slice(0, 4)
      return { ...card, choices }
    })
    setTestItems(items)
    setTestIndex(0)
    setTestScore(0)
    setTestActive(true)
    setIsQuizOpen(true)
    setQuizTimeLeft(quizSecondsPerQuestion)
    quizDeadlineRef.current = getNow() + quizSecondsPerQuestion * 1000
  }

  const onSelectTestChoice = (choice: string) => {
    if (!testActive) return
    const current = testItems[testIndex]
    if (!current) return
    if (choice.trim().toLowerCase() === current.answer.trim().toLowerCase()) {
      setTestScore((prev) => prev + 1)
    }
    const nextIndex = testIndex + 1
    if (nextIndex >= testItems.length) {
      setTestActive(false)
      return
    }
    setTestIndex(nextIndex)
    setQuizTimeLeft(quizSecondsPerQuestion)
    quizDeadlineRef.current = getNow() + quizSecondsPerQuestion * 1000
  }

  useEffect(() => {
    if (!isQuizOpen || !testActive) return

    const tick = () => {
      if (!quizDeadlineRef.current) {
        quizDeadlineRef.current = getNow() + quizSecondsPerQuestion * 1000
      }
      const next = Math.max(
        0,
        Math.ceil((quizDeadlineRef.current - getNow()) / 1000)
      )
      setQuizTimeLeft((prev) => (prev === next ? prev : next))

      if (next === 0) {
        setTestIndex((prev) => {
          const total = testItemsRef.current.length
          const nextIndex = prev + 1
          if (nextIndex >= total) {
            setTestActive(false)
            return prev
          }
          quizDeadlineRef.current = getNow() + quizSecondsPerQuestion * 1000
          setQuizTimeLeft(quizSecondsPerQuestion)
          return nextIndex
        })
      }
    }

    tick()
    const interval = window.setInterval(tick, 500)
    const onFocus = () => tick()
    document.addEventListener('visibilitychange', onFocus)
    window.addEventListener('focus', onFocus)

    return () => {
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', onFocus)
      window.removeEventListener('focus', onFocus)
    }
  }, [isQuizOpen, testActive, quizSecondsPerQuestion, testItemsRef])

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

          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'kanban' ? 'default' : 'outline'}
              className="h-9 px-4 text-sm font-semibold"
              onClick={() => setViewMode('kanban')}
            >
              Kanban
            </Button>
            <Button
              variant={viewMode === 'flashcards' ? 'default' : 'outline'}
              className="h-9 px-4 text-sm font-semibold"
              onClick={() => setViewMode('flashcards')}
            >
              Flashcards
            </Button>
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

        {viewMode === 'kanban' && (
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
                        <Progress
                          value={relative}
                          className="h-2 bg-white/10"
                        />

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
                              onClick={() =>
                                moveTopicToStatus(topic.id, 'DONE')
                              }
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
        )}

        {viewMode === 'flashcards' && (
          <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <Card className="border-white/10 bg-white/[0.05] py-0 backdrop-blur-xl">
              <CardContent className="space-y-5 px-4 py-5 sm:px-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold tracking-[0.16em] text-cyan-300 uppercase">
                        Select Deck
                      </p>
                      <h2 className="text-lg font-bold text-white">
                        Study cards
                      </h2>
                    </div>
                    {decks.length > 3 && (
                      <Link href={`/subjects/${subjectId}/decks`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-slate-400 transition-colors hover:text-cyan-300"
                        >
                          View all decks
                        </Button>
                      </Link>
                    )}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {decks.slice(0, 3).map((deck) => (
                      <div
                        key={deck.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => {
                          setFlashcardDeckId(deck.id)
                          setStudyIndex(0)
                          setShowAnswer(false)
                          setTestActive(false)
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            setFlashcardDeckId(deck.id)
                            setStudyIndex(0)
                            setShowAnswer(false)
                            setTestActive(false)
                          }
                        }}
                        className={`group relative flex cursor-pointer flex-col items-start rounded-2xl border p-4 text-left transition-all duration-300 focus:ring-2 focus:ring-cyan-500/50 focus:outline-none ${
                          resolvedFlashcardDeckId === deck.id
                            ? 'border-cyan-500/50 bg-cyan-500/10 shadow-[0_0_15px_rgba(34,211,238,0.1)]'
                            : 'border-white/10 bg-white/[0.03] hover:border-white/25 hover:bg-white/[0.06]'
                        }`}
                      >
                        <div
                          className={`mb-3 rounded-xl p-2 transition-colors ${
                            resolvedFlashcardDeckId === deck.id
                              ? 'bg-cyan-500/20 text-cyan-400'
                              : 'bg-white/5 text-slate-400 group-hover:bg-white/10 group-hover:text-slate-300'
                          }`}
                        >
                          <BookOpen className="h-4 w-4" />
                        </div>
                        <span className="line-clamp-1 text-sm font-bold text-white transition-colors group-hover:text-cyan-300">
                          {deck.name}
                        </span>
                        <p className="mt-1 text-[10px] tracking-widest text-slate-500 uppercase">
                          {resolvedFlashcardDeckId === deck.id
                            ? 'Active Deck'
                            : 'Click to select'}
                        </p>
                        <div className="absolute top-3 right-3 flex items-center gap-1">
                          {resolvedFlashcardDeckId === deck.id && (
                            <CheckCircle2 className="animate-in zoom-in-50 h-4 w-4 text-cyan-400 duration-300" />
                          )}

                          <div onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-slate-500 hover:bg-white/10 hover:text-white"
                                >
                                  <MoreVertical className="h-3.5 w-3.5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="end"
                                className="w-40 border-white/10 bg-[#0f172a] text-slate-200"
                              >
                                <DropdownMenuItem
                                  onClick={() =>
                                    setEditingDeck({
                                      id: deck.id,
                                      name: deck.name,
                                    })
                                  }
                                  className="focus:bg-white/10 focus:text-white"
                                >
                                  <Edit2 className="mr-2 h-3.5 w-3.5" />
                                  Rename
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => setDeletingDeckId(deck.id)}
                                  className="text-red-400 focus:bg-red-400/10 focus:text-red-400"
                                >
                                  <Trash2 className="mr-2 h-3.5 w-3.5" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>
                    ))}
                    {decks.length === 0 && (
                      <div className="col-span-full rounded-xl border border-dashed border-white/15 bg-white/[0.02] p-6 text-center">
                        <p className="text-xs tracking-widest text-slate-500 uppercase">
                          No decks created yet
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {!flashcards.length ? (
                  <div className="rounded-xl border border-dashed border-white/15 bg-white/[0.02] px-4 py-8 text-center text-sm text-slate-400">
                    No flashcards yet. Add your first card in the deck editor.
                  </div>
                ) : (
                  <div className="rounded-2xl border border-white/10 bg-[#0d1627]/80 p-5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className="bg-white/10 text-slate-300">
                          {flashcardStats.total} cards
                        </Badge>
                        <Badge className="bg-emerald-500/15 text-emerald-200">
                          Mastered {flashcardStats.byStatus.MASTERED ?? 0}
                        </Badge>
                        <Badge className="bg-amber-500/15 text-amber-200">
                          Review {flashcardStats.byStatus.REVIEW ?? 0}
                        </Badge>
                      </div>
                      <Button
                        className="bg-violet-600 text-white hover:bg-violet-500"
                        onClick={() => {
                          setStudyIndex(0)
                          setShowAnswer(false)
                          setIsStudyOpen(true)
                        }}
                      >
                        Start study
                      </Button>
                    </div>
                    <p className="mt-4 text-sm text-slate-300">
                      Tap start to pop a card, flip it, and rate your recall.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="border-white/10 bg-white/[0.05] py-0 backdrop-blur-xl">
                <CardContent className="space-y-4 px-4 py-5 sm:px-6">
                  <div>
                    <p className="text-xs font-semibold tracking-[0.16em] text-slate-400 uppercase">
                      Create cards
                    </p>
                    <h3 className="text-base font-bold text-white">
                      Build a full flashcard set
                    </h3>
                    <p className="mt-2 text-sm text-slate-400">
                      Use the full editor to add multiple cards Quizlet-style.
                    </p>
                  </div>
                  <Link
                    href={`/subjects/${subjectId}/flashcards`}
                    className="inline-flex"
                  >
                    <Button className="bg-violet-600 text-white hover:bg-violet-500">
                      Open full editor
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="border-white/10 bg-white/[0.05] py-0 backdrop-blur-xl">
                <CardContent className="space-y-4 px-4 py-5 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold tracking-[0.16em] text-slate-400 uppercase">
                        Test mode
                      </p>
                      <h3 className="text-base font-bold text-white">
                        Quick quiz
                      </h3>
                    </div>
                    <Badge className="bg-white/10 text-slate-300">
                      {flashcardStats.total} cards
                    </Badge>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                    <span>Timer per question</span>
                    <div className="flex items-center gap-2">
                      {[10, 20, 30, 45].map((value) => (
                        <button
                          key={`quiz-timer-${value}`}
                          onClick={() => setQuizSecondsPerQuestion(value)}
                          className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                            quizSecondsPerQuestion === value
                              ? 'bg-cyan-500/20 text-cyan-100'
                              : 'bg-white/5 text-slate-300 hover:bg-white/10'
                          }`}
                        >
                          {value}s
                        </button>
                      ))}
                    </div>
                  </div>

                  {flashcards.length < 2 ? (
                    <p className="text-sm text-slate-400">
                      Add at least two cards to start a quiz.
                    </p>
                  ) : testActive ? (
                    <p className="text-sm text-slate-400">
                      Quiz running in a pop card. Finish there to see results.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      <Button
                        onClick={() => onStartTest(5)}
                        className="bg-cyan-600 text-white hover:bg-cyan-500"
                        disabled={!flashcards.length}
                      >
                        Start quick test
                      </Button>
                      <Button
                        onClick={() => onStartTest(10)}
                        variant="outline"
                        className="border-white/15 bg-white/5 text-slate-200 hover:bg-white/10"
                        disabled={!flashcards.length}
                      >
                        Full test
                      </Button>
                      {testItems.length > 0 && !testActive && (
                        <Badge className="bg-emerald-500/20 text-emerald-200">
                          Last score {testScore}/{testItems.length}
                        </Badge>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-white/10 bg-white/[0.05] py-0 backdrop-blur-xl">
                <CardContent className="space-y-3 px-4 py-5 sm:px-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-white">
                      Card list
                    </h3>
                    <Badge className="bg-white/10 text-slate-300">
                      {flashcards.length}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    {flashcards.map((card) => (
                      <div
                        key={card.id}
                        className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-white">
                              {card.question}
                            </p>
                            <p className="text-xs text-slate-400">
                              {card.answer}
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            className="h-7 border-red-400/35 bg-red-500/10 px-2 text-red-200 hover:bg-red-500/20"
                            onClick={() => deleteFlashcard.mutateAsync(card.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {flashcards.length === 0 && (
                      <p className="text-sm text-slate-400">No cards yet.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>
        )}

        {(isStudyOpen || isQuizOpen) && (
          <div className="fixed inset-0 z-[80] overflow-y-auto bg-[#050813]">
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute top-[-140px] right-[-120px] h-[360px] w-[360px] rounded-full bg-violet-600/20 blur-[140px]" />
              <div className="absolute bottom-[-160px] left-[-140px] h-[360px] w-[360px] rounded-full bg-cyan-500/14 blur-[140px]" />
            </div>

            <div className="relative mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold tracking-[0.2em] text-cyan-300 uppercase">
                    {isStudyOpen ? 'Study' : 'Quiz'}
                  </p>
                  <h2 className="mt-2 text-2xl font-bold text-white">
                    {isStudyOpen ? 'Flashcard study' : 'Quick quiz'}
                  </h2>
                </div>
                <Button
                  variant="outline"
                  className="border-white/15 bg-white/5 text-slate-200 hover:bg-white/10"
                  onClick={() => {
                    setIsStudyOpen(false)
                    setIsQuizOpen(false)
                    setTestActive(false)
                  }}
                >
                  Close
                </Button>
              </div>

              {isStudyOpen && (
                <div className="rounded-2xl border border-white/10 bg-[#0d1627]/80 p-6">
                  {!flashcards.length ? (
                    <div className="rounded-xl border border-dashed border-white/15 bg-white/[0.02] px-4 py-10 text-center text-sm text-slate-400">
                      No flashcards available for this topic yet.
                    </div>
                  ) : (
                    <div className="space-y-5">
                      <div className="flex items-center justify-between">
                        <Badge className="bg-white/10 text-slate-300">
                          {studyIndex + 1} / {flashcards.length}
                        </Badge>
                        <Badge className="bg-violet-500/20 text-violet-100">
                          {activeStudyCard?.status ?? 'NEW'}
                        </Badge>
                      </div>
                      <Progress
                        value={Math.max(
                          1,
                          ((studyIndex + 1) / flashcards.length) * 100
                        )}
                        className="h-2 bg-white/10"
                      />

                      <div className="rounded-2xl border border-white/10 bg-[#121b30]/85 p-8">
                        <p className="text-xs font-semibold tracking-[0.2em] text-slate-400 uppercase">
                          Term
                        </p>
                        <p className="mt-4 text-3xl font-semibold text-white">
                          {activeStudyCard?.question ?? 'No card selected'}
                        </p>

                        {showAnswer && (
                          <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.04] p-5">
                            <p className="text-xs text-slate-400">Definition</p>
                            <p className="mt-2 text-base text-slate-100">
                              {activeStudyCard?.answer}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          variant="outline"
                          className="h-9 border-white/15 bg-white/5 text-slate-200 hover:bg-white/10"
                          onClick={() => setShowAnswer((prev) => !prev)}
                          disabled={!activeStudyCard}
                        >
                          {showAnswer ? 'Hide answer' : 'Show answer'}
                        </Button>
                        <Button
                          variant="outline"
                          className="h-9 border-white/15 bg-white/5 text-slate-200 hover:bg-white/10"
                          onClick={() => {
                            setStudyIndex((prev) =>
                              Math.min(
                                prev + 1,
                                Math.max(0, flashcards.length - 1)
                              )
                            )
                            setShowAnswer(false)
                          }}
                          disabled={!activeStudyCard}
                        >
                          Next
                        </Button>
                        {showAnswer && activeStudyCard && (
                          <>
                            <Button
                              size="sm"
                              className="bg-rose-500/80 text-white hover:bg-rose-500"
                              onClick={() =>
                                onReviewFlashcard(activeStudyCard.id, 'REVIEW')
                              }
                            >
                              Again
                            </Button>
                            <Button
                              size="sm"
                              className="bg-cyan-500/80 text-white hover:bg-cyan-500"
                              onClick={() =>
                                onReviewFlashcard(
                                  activeStudyCard.id,
                                  'LEARNING'
                                )
                              }
                            >
                              Good
                            </Button>
                            <Button
                              size="sm"
                              className="bg-emerald-500/80 text-white hover:bg-emerald-500"
                              onClick={() =>
                                onReviewFlashcard(
                                  activeStudyCard.id,
                                  'MASTERED'
                                )
                              }
                            >
                              Easy
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {isQuizOpen && (
                <div className="rounded-2xl border border-white/10 bg-[#0d1627]/80 p-6">
                  {flashcards.length < 2 ? (
                    <p className="text-sm text-slate-400">
                      Add at least two cards to start a quiz.
                    </p>
                  ) : testActive ? (
                    <div className="space-y-5">
                      <div className="flex items-center justify-between">
                        <Badge className="bg-white/10 text-slate-300">
                          {testIndex + 1} / {testItems.length}
                        </Badge>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-slate-700/40 text-slate-200">
                            {quizTimeLeft}s
                          </Badge>
                          <Badge className="bg-emerald-500/15 text-emerald-200">
                            Score {testScore}
                          </Badge>
                        </div>
                      </div>
                      <Progress
                        value={Math.max(
                          1,
                          ((testIndex + 1) / testItems.length) * 100
                        )}
                        className="h-2 bg-white/10"
                      />

                      <div className="rounded-2xl border border-white/10 bg-[#121b30]/85 p-8">
                        <p className="text-xs font-semibold tracking-[0.2em] text-slate-400 uppercase">
                          Term
                        </p>
                        <p className="mt-4 text-2xl font-semibold text-white">
                          {testItems[testIndex]?.question}
                        </p>
                        <p className="mt-6 text-xs tracking-[0.18em] text-slate-400 uppercase">
                          Choose an answer
                        </p>
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          {(testItems[testIndex]?.choices ?? []).map(
                            (choice, idx) => (
                              <button
                                key={`${choice}-${idx}`}
                                onClick={() => onSelectTestChoice(choice)}
                                className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-left text-sm font-semibold text-slate-100 transition hover:border-cyan-300/50 hover:bg-cyan-500/10"
                              >
                                <span className="mr-2 text-xs text-slate-400">
                                  {idx + 1}
                                </span>
                                {choice}
                              </button>
                            )
                          )}
                        </div>
                        <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
                          <span>Not sure?</span>
                          <button
                            className="text-cyan-300 hover:text-cyan-200"
                            onClick={() => onSelectTestChoice('')}
                          >
                            Skip
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          className="border-white/15 bg-white/5 text-slate-200 hover:bg-white/10"
                          onClick={() => setTestActive(false)}
                        >
                          End test
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                      <p className="text-sm text-slate-300">
                        Last score: {testScore}/{testItems.length}
                      </p>
                      <div className="mt-4 space-y-2">
                        {testItems.map((item, index) => (
                          <div
                            key={item.id}
                            className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2"
                          >
                            <p className="text-xs text-slate-400">
                              {index + 1}. {item.question}
                            </p>
                            <p className="mt-1 text-sm text-emerald-200">
                              {item.answer}
                            </p>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        <Button
                          onClick={() => onStartTest(5)}
                          className="bg-cyan-600 text-white hover:bg-cyan-500"
                        >
                          Restart quick test
                        </Button>
                        <Button
                          variant="outline"
                          className="border-white/15 bg-white/5 text-slate-200 hover:bg-white/10"
                          onClick={() => setIsQuizOpen(false)}
                        >
                          Close
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

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

      <Dialog
        open={!!editingDeck}
        onOpenChange={(open) => !open && setEditingDeck(null)}
      >
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
              onChange={(e) =>
                setEditingDeck((prev) =>
                  prev ? { ...prev, name: e.target.value } : null
                )
              }
              className="border-white/10 bg-white/5 text-white"
              onKeyDown={(e) => e.key === 'Enter' && onUpdateDeck()}
            />
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setEditingDeck(null)}
              className="text-slate-400 hover:bg-white/5 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={onUpdateDeck}
              className="bg-cyan-600 text-white hover:bg-cyan-500"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmActionDialog
        open={!!deletingDeckId}
        onOpenChange={(open) => !open && setDeletingDeckId(null)}
        onConfirm={onDeleteDeck}
        title="Delete Deck?"
        description="This will permanently remove the deck and all flashcards inside it. This action cannot be undone."
        confirmLabel="Delete Deck"
        pending={deleteDeck.isPending}
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
