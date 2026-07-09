'use client'

import { useLayoutEffect, useState } from 'react'

export interface TutorialRect {
  top: number
  left: number
  right: number
  bottom: number
  width: number
  height: number
}

const SPOTLIGHT_PADDING = 8

export function useTutorialTargetRect(targetId: string): TutorialRect | null {
  const [rect, setRect] = useState<TutorialRect | null>(null)

  useLayoutEffect(() => {
    let frame: number | null = null

    const measure = () => {
      const el = document.getElementById(targetId)
      if (!el) {
        setRect(null)
        return
      }
      const box = el.getBoundingClientRect()
      setRect({
        top: box.top - SPOTLIGHT_PADDING,
        left: box.left - SPOTLIGHT_PADDING,
        right: box.right + SPOTLIGHT_PADDING,
        bottom: box.bottom + SPOTLIGHT_PADDING,
        width: box.width + SPOTLIGHT_PADDING * 2,
        height: box.height + SPOTLIGHT_PADDING * 2,
      })
    }

    const scheduleMeasure = () => {
      if (frame !== null) return
      frame = requestAnimationFrame(() => {
        frame = null
        measure()
      })
    }

    measure()
    window.addEventListener('resize', scheduleMeasure)
    window.addEventListener('scroll', scheduleMeasure, true)

    return () => {
      window.removeEventListener('resize', scheduleMeasure)
      window.removeEventListener('scroll', scheduleMeasure, true)
      if (frame !== null) cancelAnimationFrame(frame)
    }
  }, [targetId])

  return rect
}

interface TutorialSpotlightProps {
  rect: TutorialRect | null
}

const STRIP_CLASS =
  'fixed bg-slate-950/55 backdrop-blur-md transition-all duration-300'

export function TutorialSpotlight({ rect }: TutorialSpotlightProps) {
  if (!rect || typeof window === 'undefined') return null

  const vw = window.innerWidth
  const vh = window.innerHeight

  return (
    <div className="pointer-events-none fixed inset-0 z-[100]">
      {/* Top strip */}
      <div
        className={STRIP_CLASS}
        style={{ top: 0, left: 0, width: vw, height: Math.max(0, rect.top) }}
      />
      {/* Bottom strip */}
      <div
        className={STRIP_CLASS}
        style={{
          top: rect.bottom,
          left: 0,
          width: vw,
          height: Math.max(0, vh - rect.bottom),
        }}
      />
      {/* Left strip */}
      <div
        className={STRIP_CLASS}
        style={{
          top: rect.top,
          left: 0,
          width: Math.max(0, rect.left),
          height: rect.height,
        }}
      />
      {/* Right strip */}
      <div
        className={STRIP_CLASS}
        style={{
          top: rect.top,
          left: rect.right,
          width: Math.max(0, vw - rect.right),
          height: rect.height,
        }}
      />
      {/* Glow ring around the spotlit element */}
      <div
        className="absolute rounded-2xl border-2 border-violet-400/70 shadow-[0_0_24px_var(--color-violet-glow)]"
        style={{
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        }}
      />
    </div>
  )
}
