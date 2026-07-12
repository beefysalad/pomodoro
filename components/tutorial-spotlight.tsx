'use client'

import { useEffect, useLayoutEffect, useState } from 'react'

export interface TutorialRect {
  top: number
  left: number
  right: number
  bottom: number
  width: number
  height: number
}

const SPOTLIGHT_PADDING = 8

// Falls back to useEffect on the server so this hook never triggers Next.js's
// "useLayoutEffect does nothing on the server" warning, even if a future
// caller mounts TutorialGuide somewhere that isn't gated behind client-only
// data the way tutorial-auto-start.tsx does today.
const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect

export function useTutorialTargetRect(targetId: string): TutorialRect | null {
  const [rect, setRect] = useState<TutorialRect | null>(null)

  useIsomorphicLayoutEffect(() => {
    let frame: number | null = null
    let observer: ResizeObserver | null = null
    let mutationObserver: MutationObserver | null = null

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

    const observeTarget = (el: HTMLElement) => {
      observer = new ResizeObserver(scheduleMeasure)
      observer.observe(el)
    }

    measure()

    const el = document.getElementById(targetId)
    if (el) {
      observeTarget(el)
    } else {
      // Target isn't in the DOM yet (e.g. still loading) — watch for it to
      // appear so the spotlight doesn't stay stuck hidden once it mounts.
      mutationObserver = new MutationObserver(() => {
        const lateEl = document.getElementById(targetId)
        if (!lateEl) return
        measure()
        observeTarget(lateEl)
        mutationObserver?.disconnect()
        mutationObserver = null
      })
      mutationObserver.observe(document.body, {
        childList: true,
        subtree: true,
      })
    }

    window.addEventListener('resize', scheduleMeasure)
    window.addEventListener('scroll', scheduleMeasure, true)

    return () => {
      if (observer) observer.disconnect()
      if (mutationObserver) mutationObserver.disconnect()
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

// transition-opacity only (not transition-all): these strips reposition on
// every scroll/resize tick, and animating top/left/width/height there made
// the spotlight visibly lag behind the actual scroll position. Opacity still
// animates so the spotlight fades in cleanly on mount / step change.
const STRIP_CLASS =
  'fixed bg-slate-950/55 backdrop-blur-md transition-opacity duration-200'

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
