import { seedFrom } from '@/lib/chain/rng'

/**
 * An agent's glyph: a 5x5 mirror-symmetric grid derived from its address.
 * Nothing is stored or fetched — the same address always draws the same mark,
 * on the server and in the browser. Two ink levels: foreground for the body,
 * clay for the few cells the hash singles out.
 */
export function Glyph({
  seed,
  size,
  tier,
  halted = false,
  fluid = false,
  className = '',
  title,
}: {
  seed: string
  size?: number
  tier?: 'opus' | 'sonnet' | 'haiku'
  halted?: boolean
  fluid?: boolean
  className?: string
  title?: string
}) {
  let h = seedFrom(seed.toLowerCase())
  const cells: number[] = []
  // 15 unique cells (3 columns x 5 rows) mirrored to 25.
  const half: number[] = []
  for (let i = 0; i < 15; i++) {
    h = (Math.imul(h, 1664525) + 1013904223) >>> 0
    const v = h >>> 24
    half.push(v < 118 ? 0 : v < 228 ? 1 : 2)
  }
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 5; col++) {
      const src = col < 3 ? col : 4 - col
      cells.push(half[row * 3 + src])
    }
  }
  return (
    <span
      className={`glyph ${className}`}
      style={fluid ? undefined : { width: size ?? 32, height: size ?? 32 }}
      data-tier={tier}
      data-halted={halted ? 'true' : undefined}
      title={title}
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
      aria-label={title}
    >
      {cells.map((on, i) => (
        <i key={i} data-on={on || undefined} />
      ))}
    </span>
  )
}
