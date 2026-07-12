import type { TutorialRect } from '@/components/tutorial-spotlight'

const CARD_MAX_WIDTH = 380
const CARD_HEIGHT_ESTIMATE = 220
const CARD_MARGIN = 16

export interface CardPlacement {
  top: number
  left: number
  width: number
}

export function getCardPlacement(rect: TutorialRect | null): CardPlacement {
  if (typeof window === 'undefined') {
    return { top: 0, left: 0, width: CARD_MAX_WIDTH }
  }

  const vw = window.innerWidth
  const vh = window.innerHeight
  const width = Math.min(CARD_MAX_WIDTH, vw - CARD_MARGIN * 2)

  let top: number
  let left: number

  if (!rect) {
    top = vh - CARD_HEIGHT_ESTIMATE - CARD_MARGIN
    left = (vw - width) / 2
  } else {
    const roomBelow = vh - rect.bottom
    const roomAbove = rect.top
    const roomRight = vw - rect.right
    const roomLeft = rect.left

    if (roomBelow > CARD_HEIGHT_ESTIMATE + CARD_MARGIN) {
      top = rect.bottom + CARD_MARGIN
      left = rect.left + rect.width / 2 - width / 2
    } else if (roomAbove > CARD_HEIGHT_ESTIMATE + CARD_MARGIN) {
      top = rect.top - CARD_HEIGHT_ESTIMATE - CARD_MARGIN
      left = rect.left + rect.width / 2 - width / 2
    } else if (roomRight > width + CARD_MARGIN) {
      top = rect.top + rect.height / 2 - CARD_HEIGHT_ESTIMATE / 2
      left = rect.right + CARD_MARGIN
    } else if (roomLeft > width + CARD_MARGIN) {
      top = rect.top + rect.height / 2 - CARD_HEIGHT_ESTIMATE / 2
      left = rect.left - width - CARD_MARGIN
    } else {
      top = vh - CARD_HEIGHT_ESTIMATE - CARD_MARGIN
      left = (vw - width) / 2
    }
  }

  left = Math.min(Math.max(left, CARD_MARGIN), vw - width - CARD_MARGIN)
  top = Math.min(
    Math.max(top, CARD_MARGIN),
    vh - CARD_HEIGHT_ESTIMATE - CARD_MARGIN
  )

  return { top, left, width }
}
