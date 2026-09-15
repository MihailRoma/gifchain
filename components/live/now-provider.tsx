'use client'

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { heightAtTime } from '@/lib/chain/constants'

/**
 * One clock for the whole tree.
 *
 * Seeded from a server timestamp so the first client render byte-matches the
 * server HTML, then it starts ticking on mount. Every age, height and countdown
 * reads from this single context, so the page updates in one synchronised
 * repaint per second instead of N independent timers.
 */
const NowContext = createContext<number>(0)

export function NowProvider({ initial, children }: { initial: number; children: ReactNode }) {
  const [now, setNow] = useState(initial)
  const timer = useRef<number | null>(null)

  useEffect(() => {
    // Correct straight away: `initial` may be minutes stale on a prerendered
    // page, and it is always at least a network round-trip behind.
    setNow(Date.now())

    const tick = () => {
      const t = Date.now()
      setNow(t)
      // Re-align to the next whole second so all ages flip together rather
      // than drifting apart by a few ms on every pass.
      timer.current = window.setTimeout(tick, 1_000 - (t % 1_000))
    }
    timer.current = window.setTimeout(tick, 1_000 - (Date.now() % 1_000))

    // Background tabs throttle timers hard, so resync the moment we return.
    const onVisible = () => {
      if (document.visibilityState === 'visible') setNow(Date.now())
    }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      if (timer.current !== null) clearTimeout(timer.current)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])

  return <NowContext.Provider value={now}>{children}</NowContext.Provider>
}

/** Current wall-clock ms, updated once a second. */
export function useNow(): number {
  return useContext(NowContext)
}

/** Head height right now, derived from the shared clock. */
export function useLiveHeight(): number {
  return heightAtTime(useNow())
}
