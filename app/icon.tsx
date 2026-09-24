import { ImageResponse } from 'next/og'
import { seedFrom } from '@/lib/chain/rng'

export const size = { width: 64, height: 64 }
export const contentType = 'image/png'

/** The chain's own glyph, at favicon size. Mirrors `components/glyph.tsx`. */
export default function Icon() {
  let h = seedFrom('claudechain-mainnet-1')
  const half: number[] = []
  for (let i = 0; i < 15; i++) {
    h = (Math.imul(h, 1664525) + 1013904223) >>> 0
    const v = h >>> 24
    half.push(v < 118 ? 0 : v < 228 ? 1 : 2)
  }
  const cells: number[] = []
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 5; col++) cells.push(half[row * 3 + (col < 3 ? col : 4 - col)])
  }
  return new ImageResponse(
    <div
      style={{
        width: 64,
        height: 64,
        display: 'flex',
        flexWrap: 'wrap',
        padding: 7,
        background: '#0e0c0b',
        border: '3px solid #d97757',
      }}
    >
      {cells.map((on, i) => (
        <div
          key={i}
          style={{
            width: 8,
            height: 8,
            margin: 1,
            background: on === 2 ? '#d97757' : on === 1 ? '#f1eae0' : 'transparent',
          }}
        />
      ))}
    </div>,
    { ...size },
  )
}
