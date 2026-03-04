'use client'

import { useEffect, useState } from 'react'

const XpBar = ({ value, delay = 0 }: { value: number; delay?: number }) => {
  const [w, setW] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => setW(value), 600 + delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return (
    <div className="bg-surface-hi border-border h-1 w-full overflow-hidden rounded-full border">
      <div
        className="from-violet to-violet-mid h-full rounded-full bg-gradient-to-r shadow-[0_0_10px_var(--color-violet-glow)]"
        style={{
          width: `${w}%`,
          transition: 'width 1.2s cubic-bezier(0.16,1,0.3,1)',
        }}
      />
    </div>
  )
}

export default XpBar
