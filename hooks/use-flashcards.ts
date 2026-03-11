import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createFlashcard,
  deleteFlashcard,
  getFlashcards,
  updateFlashcard,
  type Flashcard,
} from '@/lib/api/flashcards'

export const flashcardQueryKey = (deckId: string) =>
  ['flashcards', deckId] as const

export function useFlashcards(deckId: string) {
  return useQuery({
    queryKey: flashcardQueryKey(deckId),
    queryFn: () => getFlashcards(deckId),
    enabled: !!deckId,
  })
}

export function useCreateFlashcard(deckId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: {
      question: string
      answer: string
      hint?: string | null
      choices?: string[]
    }) => createFlashcard(deckId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: flashcardQueryKey(deckId) })
    },
  })
}

export function useUpdateFlashcard(deckId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      cardId,
      payload,
    }: {
      cardId: string
      payload: Partial<{
        question: string
        answer: string
        hint: string | null
        status: string
        lastReviewedAt: string | null
      }>
    }) => updateFlashcard(deckId, cardId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: flashcardQueryKey(deckId) })
    },
  })
}

export function useDeleteFlashcard(deckId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (cardId: string) => deleteFlashcard(deckId, cardId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: flashcardQueryKey(deckId) })
    },
  })
}

export function useFlashcardStats(cards: Flashcard[]) {
  const total = cards.length
  const byStatus = cards.reduce(
    (acc, card) => {
      acc[card.status] = (acc[card.status] ?? 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  return {
    total,
    byStatus,
  }
}
