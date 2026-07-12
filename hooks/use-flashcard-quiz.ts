import { useEffect, useRef, useState } from 'react'
import { shuffle } from '@/lib/shuffle'
import type { Flashcard } from '@/lib/api/flashcards'

const getNow = () => Date.now()

export function useFlashcardQuiz(flashcards: Flashcard[]) {
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
  const [testResponses, setTestResponses] = useState<Record<string, string>>(
    {}
  )
  const [quizTimeLeft, setQuizTimeLeft] = useState(20)
  const [quizSecondsPerQuestion, setQuizSecondsPerQuestion] = useState(20)
  const quizDeadlineRef = useRef<number | null>(null)
  const testIndexRef = useRef(0)
  const testItemsRef = useRef(testItems)

  useEffect(() => {
    testIndexRef.current = testIndex
  }, [testIndex])

  useEffect(() => {
    testItemsRef.current = testItems
  }, [testItems])

  const activeStudyCard = flashcards[studyIndex]

  const normalizeAnswer = (value: string) => value.trim().toLowerCase()

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
    setTestResponses({})
    setTestActive(true)
    setIsQuizOpen(true)
    setQuizTimeLeft(quizSecondsPerQuestion)
    quizDeadlineRef.current = getNow() + quizSecondsPerQuestion * 1000
  }

  const onSelectTestChoice = (choice: string) => {
    if (!testActive) return
    const current = testItems[testIndex]
    if (!current) return
    setTestResponses((prev) => ({ ...prev, [current.id]: choice }))
    if (normalizeAnswer(choice) === normalizeAnswer(current.answer)) {
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
        const timedOutItem = testItemsRef.current[testIndexRef.current]
        if (timedOutItem) {
          setTestResponses((prev) =>
            prev[timedOutItem.id] === undefined
              ? { ...prev, [timedOutItem.id]: '' }
              : prev
          )
        }
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

  return {
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
  }
}
