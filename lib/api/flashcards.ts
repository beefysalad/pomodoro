import api from '../axios'

export type Flashcard = {
  id: string
  deckId: string
  question: string
  answer: string
  hint?: string | null
  choices?: string[]
  status: string
  lastReviewedAt?: string | null
  createdAt: string
  updatedAt: string
}

export const getFlashcards = async (deckId: string): Promise<Flashcard[]> => {
  const { data } = await api.get<{ cards: Flashcard[] }>(
    `/decks/${deckId}/flashcards`
  )
  return data.cards
}

export const createFlashcard = async (deckId: string, payload: {
  question: string
  answer: string
  hint?: string | null
  choices?: string[]
}): Promise<Flashcard> => {
  const { data } = await api.post<{ card: Flashcard }>(
    `/decks/${deckId}/flashcards`,
    payload
  )
  return data.card
}

export const updateFlashcard = async (
  deckId: string,
  cardId: string,
  payload: Partial<{
    question: string
    answer: string
    hint: string | null
    status: string
    lastReviewedAt: string | null
  }>
): Promise<Flashcard> => {
  const { data } = await api.patch<{ card: Flashcard }>(
    `/decks/${deckId}/flashcards/${cardId}`,
    payload
  )
  return data.card
}

export const deleteFlashcard = async (
  deckId: string,
  cardId: string
): Promise<void> => {
  await api.delete(`/decks/${deckId}/flashcards/${cardId}`)
}
