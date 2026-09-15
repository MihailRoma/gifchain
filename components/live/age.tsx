'use client'

import { age, shortAge, utc } from '@/lib/chain/format'
import { useNow } from './now-provider'

/**
 * A timestamp that counts up on its own. Renders against the shared clock, so
 * it matches the server on first paint and then ticks every second.
 */
export function Age({
  ts,
  long = false,
  title = true,
  className,
}: {
  ts: number
  long?: boolean
  title?: boolean
  className?: string
}) {
  const now = useNow()
  return (
    <time
      dateTime={new Date(ts).toISOString()}
      title={title ? utc(ts) : undefined}
      className={className}
      // The text is time-derived, so the server string and the first client
      // string can straddle a second boundary. The value is cosmetic and
      // self-corrects on the next tick.
      suppressHydrationWarning
    >
      {long ? age(ts, now) : shortAge(ts, now)}
    </time>
  )
}
