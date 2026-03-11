import api from '../axios'

export type Quote = {
  text: string
  author: string
}

export const getQuote = async (): Promise<Quote> => {
  const { data } = await api.get<Quote>('/quote')
  return data
}
