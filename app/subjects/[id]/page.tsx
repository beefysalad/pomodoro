'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
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
import { TOPIC_STATUSES, type TopicStatus } from '@/lib/topic-status'
import { formatDuration } from '@/lib/format'
import { StatCard } from '@/components/subjects-detail/stat-card'
import { TopicBoard } from '@/components/subjects-detail/topic-board'
import { FlashcardStudyModal } from '@/components/subjects-detail/flashcard-study-modal'
import { FlashcardQuizModal } from '@/components/subjects-detail/flashcard-quiz-modal'
import { useFlashcardQuiz } from '@/hooks/use-flashcard-quiz'

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
  const [editingDeck, setEditingDeck] = useState<{
    id: string
    name: string
  } | null>(null)
  const [deletingDeckId, setDeletingDeckId] = useState<string | null>(null)

  const [isAddTopicOpen, setIsAddTopicOpen] = useState(false)
  const [deleteTopicState, setDeleteTopicState] = useState<{
    id: string
    name: string
  } | null>(null)
  const [pageMessage, setPageMessage] = useState('')

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

  const { data: decks = [] } = useFlashcardDecks(subjectId)
  const updateDeck = useUpdateFlashcardDeck(subjectId)
  const deleteDeck = useDeleteFlashcardDeck(subjectId)

  const resolvedFlashcardDeckId = flashcardDeckId || decks[0]?.id || ''

  const { data: flashcards = [] } = useFlashcards(resolvedFlashcardDeckId)
  const updateFlashcard = useUpdateFlashcard(resolvedFlashcardDeckId)
  const deleteFlashcard = useDeleteFlashcard(resolvedFlashcardDeckId)
  const flashcardStats = useFlashcardStats(flashcards)

  const {
    studyIndex,
    setStudyIndex,
    showAnswer,
    setShowAnswer,
    isStudyOpen,
    setIsStudyOpen,
    isQuizOpen,
    setIsQuizOpen,
    testActive,
    setTestActive,
    testItems,
    testIndex,
    testScore,
    testResponses,
    quizTimeLeft,
    quizSecondsPerQuestion,
    setQuizSecondsPerQuestion,
    activeStudyCard,
    normalizeAnswer,
    onStartTest,
    onSelectTestChoice,
  } = useFlashcardQuiz(flashcards)

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
              id="tutorial-view-kanban"
              variant={viewMode === 'kanban' ? 'default' : 'outline'}
              className="h-9 px-4 text-sm font-semibold"
              onClick={() => setViewMode('kanban')}
            >
              Kanban
            </Button>
            <Button
              id="tutorial-view-flashcards"
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
          <Card className="py-0 backdrop-blur-xl">
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
          <div className="bg-glass-soft rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-300">
            {pageMessage}
          </div>
        )}

        {viewMode === 'kanban' && (
          <TopicBoard
            byStatus={topicStats.byStatus}
            strongest={topicStats.strongest}
            moveTopicToStatus={moveTopicToStatus}
            onStartPomodoro={onStartPomodoro}
            onRequestDeleteTopic={setDeleteTopicState}
            deleteTopicPending={deleteTopic.isPending}
          />
        )}

        {viewMode === 'flashcards' && (
          <section
            className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]"
            id="tutorial-flashcards"
          >
            <Card className="py-0 backdrop-blur-xl">
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

                  <div
                    id="tutorial-flashcards-decks"
                    className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
                  >
                    {decks.slice(0, 3).map((deck, index) => (
                      <div
                        key={deck.id}
                        id={
                          index === 0
                            ? 'tutorial-flashcards-deck-first'
                            : undefined
                        }
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
                            : 'bg-glass-subtle border-white/10 hover:border-white/25 hover:bg-white/[0.06]'
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
                      <div className="bg-glass-empty col-span-full rounded-xl border border-dashed border-white/15 p-6 text-center">
                        <p className="text-xs tracking-widest text-slate-500 uppercase">
                          No decks created yet
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {!flashcards.length ? (
                  <div className="bg-glass-empty rounded-xl border border-dashed border-white/15 px-4 py-8 text-center text-sm text-slate-400">
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
                        id="tutorial-flashcards-start"
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
              <Card className="py-0 backdrop-blur-xl">
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

              <Card className="py-0 backdrop-blur-xl">
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
                        <Button
                          key={`quiz-timer-${value}`}
                          variant="ghost"
                          size="sm"
                          onClick={() => setQuizSecondsPerQuestion(value)}
                          className={`h-auto rounded-full px-3 py-1 text-xs font-semibold hover:text-inherit ${
                            quizSecondsPerQuestion === value
                              ? 'bg-cyan-500/20 text-cyan-100 hover:bg-cyan-500/20 dark:hover:bg-cyan-500/20'
                              : 'bg-white/5 text-slate-300 hover:bg-white/10 dark:hover:bg-white/10'
                          }`}
                        >
                          {value}s
                        </Button>
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
                        onClick={() => onStartTest(flashcards.length)}
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

              <Card className="py-0 backdrop-blur-xl">
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
                        className="bg-glass-soft rounded-lg border border-white/10 px-3 py-2"
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
                <FlashcardStudyModal
                  flashcards={flashcards}
                  studyIndex={studyIndex}
                  setStudyIndex={setStudyIndex}
                  activeStudyCard={activeStudyCard}
                  showAnswer={showAnswer}
                  setShowAnswer={setShowAnswer}
                  onReviewFlashcard={onReviewFlashcard}
                />
              )}

              {isQuizOpen && (
                <FlashcardQuizModal
                  flashcards={flashcards}
                  testActive={testActive}
                  setTestActive={setTestActive}
                  testItems={testItems}
                  testIndex={testIndex}
                  testScore={testScore}
                  testResponses={testResponses}
                  quizTimeLeft={quizTimeLeft}
                  normalizeAnswer={normalizeAnswer}
                  onSelectTestChoice={onSelectTestChoice}
                  onStartTest={onStartTest}
                  setIsQuizOpen={setIsQuizOpen}
                />
              )}
            </div>
          </div>
        )}

        <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <Card className="py-0 backdrop-blur-xl">
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

          <Card className="bg-gradient-to-br from-cyan-500/15 to-violet-500/10 py-0 backdrop-blur-xl">
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
          <Card className="py-0 transition hover:border-violet-400/40 hover:bg-white/[0.08]">
            <CardContent className="flex items-center justify-between px-4 py-4 text-sm font-semibold text-white">
              Jump to focus timer
              <Clock3 className="h-4 w-4" />
            </CardContent>
          </Card>
        </Link>
      </div>

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
