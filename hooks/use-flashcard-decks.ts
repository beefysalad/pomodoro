import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createFlashcardDeck,
  deleteFlashcardDeck,
  getFlashcardDecks,
  updateFlashcardDeck,
} from '@/lib/api/flashcard-decks'

export const flashcardDecksKey = (subjectId: string) =>
  ['flashcard-decks', subjectId] as const

export function useFlashcardDecks(subjectId: string) {
  return useQuery({
    queryKey: flashcardDecksKey(subjectId),
    queryFn: () => getFlashcardDecks(subjectId),
    enabled: !!subjectId,
  })
}

export function useCreateFlashcardDeck(subjectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: { name: string }) =>
      createFlashcardDeck(subjectId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: flashcardDecksKey(subjectId) })
    },
  })
}

export function useUpdateFlashcardDeck(subjectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      deckId,
      payload,
    }: {
      deckId: string
      payload: { name: string }
    }) => updateFlashcardDeck(subjectId, deckId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: flashcardDecksKey(subjectId) })
    },
  })
}

export function useDeleteFlashcardDeck(subjectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (deckId: string) => deleteFlashcardDeck(subjectId, deckId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: flashcardDecksKey(subjectId) })
    },
  })
}
