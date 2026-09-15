export function trunc(value: string, head = 10, tail = 8): string {
  if (value.length <= head + tail + 1) return value
  return `${value.slice(0, head)}\u2026${value.slice(-tail)}`
}

export function num(value: number): string {
  return value.toLocaleString('en-US')
}

export function dec(value: number, places = 2): string {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: places,
    maximumFractionDigits: places,
  })
}

export function gif(value: number, places = 2): string {
  return `${dec(value, places)} GIF`
}

export function usd(value: number): string {
  return `$${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
}

export function pct(value: number): string {
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toFixed(1)}%`
}

export function bytes(value: number): string {
  if (value < 1024) return `${value} B`
  return `${(value / 1024).toFixed(2)} KB`
}

/**
 * Ages are measured against real wall-clock time. `now` is passed in rather
 * than read from `Date.now()` internally so a server render and the hydrating
 * client agree on the first paint; after mount the `<Age>` component feeds in a
 * ticking clock. The default keeps one-off server callers correct.
 */
export function age(ts: number, now: number = Date.now()): string {
  const diff = Math.max(0, Math.round((now - ts) / 1000))
  if (diff < 60) return `${diff}s ago`
  const m = Math.floor(diff / 60)
  if (m < 60) return `${m}m ${diff % 60}s ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ${m % 60}m ago`
  const d = Math.floor(h / 24)
  if (d < 60) return `${d}d ${h % 24}h ago`
  return `${Math.floor(d / 30)}mo ago`
}

/**
 * Compact age for table cells. Keeps second precision inside the first hour so
 * a live list visibly counts up instead of collapsing to a flat "1m".
 */
export function shortAge(ts: number, now: number = Date.now()): string {
  const diff = Math.max(0, Math.round((now - ts) / 1000))
  if (diff < 60) return `${diff}s`
  const m = Math.floor(diff / 60)
  if (m < 60) return `${m}m ${diff % 60}s`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ${m % 60}m`
  const d = Math.floor(h / 24)
  if (d < 365) return `${d}d ${h % 24}h`
  return `${Math.floor(d / 365)}y`
}

/** One-decimal countdown used for "next block in" readouts. */
export function secondsUntil(ts: number, now: number): string {
  return `${Math.max(0, (ts - now) / 1000).toFixed(1)}s`
}

export function utc(ts: number): string {
  const d = new Date(ts)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(
    d.getUTCHours(),
  )}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())} UTC`
}

export function utcDate(ts: number): string {
  const d = new Date(ts)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
}
