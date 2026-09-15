'use client'

import { useState } from 'react'

export function CopyButton({ value, label = 'copy' }: { value: string; label?: string }) {
  const [done, setDone] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(value)
    } catch {
      return
    }
    setDone(true)
    setTimeout(() => setDone(false), 1200)
  }

  return (
    <button type="button" className="btn" onClick={copy} title={`Copy ${value}`}>
      {done ? 'copied' : label}
    </button>
  )
}
