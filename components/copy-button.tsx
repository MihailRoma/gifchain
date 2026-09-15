'use client'

import { useEffect, useRef, useState } from 'react'

export function CopyButton({ value, label = 'copy' }: { value: string; label?: string }) {
  const [done, setDone] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current)
    },
    [],
  )

  async function copy() {
    try {
      await navigator.clipboard.writeText(value)
    } catch {
      return
    }
    setDone(true)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setDone(false), 1200)
  }

  return (
    <button type="button" className="btn" onClick={copy} title={`Copy ${value}`}>
      {done ? 'copied' : label}
    </button>
  )
}
