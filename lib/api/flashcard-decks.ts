import api from '../axios'

export type FlashcardDeck = {
  id: string
  subjectId: string
  name: string
  createdAt: string
  updatedAt: string
}

export const getFlashcardDecks = async (
  subjectId: string
): Promise<FlashcardDeck[]> => {
  const { data } = await api.get<{ decks: FlashcardDeck[] }>(
    `/subjects/${subjectId}/decks`
  )
  return data.decks
}

export const createFlashcardDeck = async (
  subjectId: string,
  payload: { name: string }
): Promise<FlashcardDeck> => {
  const { data } = await api.post<{ deck: FlashcardDeck }>(
    `/subjects/${subjectId}/decks`,
    payload
  )
  return data.deck
}

export const updateFlashcardDeck = async (
  subjectId: string,
  deckId: string,
  payload: { name: string }
): Promise<FlashcardDeck> => {
  const { data } = await api.patch<{ deck: FlashcardDeck }>(
    `/subjects/${subjectId}/decks/${deckId}`,
    payload
  )
  return data.deck
}

export const deleteFlashcardDeck = async (
  subjectId: string,
  deckId: string
): Promise<void> => {
  await api.delete(`/subjects/${subjectId}/decks/${deckId}`)
}
