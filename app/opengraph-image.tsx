import { ImageResponse } from 'next/og'
import { CHAIN } from '@/lib/chain/constants'
import { seedFrom } from '@/lib/chain/rng'

export const alt = 'CLAUDECHAIN — the blockchain that thinks'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const BG = '#171412'
const INK = '#0e0c0b'
const FG = '#f1eae0'
const CLAY = '#d97757'
const MUTED = '#9d8f83'
const LINE = '#5e5148'

/** Same glyph algorithm as `components/glyph.tsx`, drawn with inline styles. */
function glyphCells(seed: string): number[] {
  let h = seedFrom(seed)
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
  return cells
}

function Glyph({ seed, px }: { seed: string; px: number }) {
  const cells = glyphCells(seed)
  const cell = px / 6.2
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        width: px,
        height: px,
        padding: cell * 0.6,
        background: INK,
        border: `2px solid ${CLAY}`,
      }}
    >
      {cells.map((on, i) => (
        <div
          key={i}
          style={{
            width: cell * 0.8,
            height: cell * 0.8,
            margin: cell * 0.1,
            background: on === 2 ? CLAY : on === 1 ? FG : 'transparent',
          }}
        />
      ))}
    </div>
  )
}

export default function OpenGraphImage() {
  const rows = [
    ['consensus', 'proof of thought'],
    ['unit of state', 'the agent'],
    ['block time', `${CHAIN.blockTimeSec}s`],
    ['gas token', CHAIN.ticker],
  ]
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: BG,
        color: FG,
        fontFamily: 'monospace',
        padding: 56,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 22,
          color: MUTED,
          borderBottom: `2px solid ${LINE}`,
          paddingBottom: 18,
        }}
      >
        <span style={{ color: CLAY }}>{CHAIN.networkId}</span>
        <span>chain id {CHAIN.chainId}</span>
        <span>all sealers live</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 44, marginTop: 56 }}>
        <Glyph seed="claudechain-mainnet-1" px={196} />
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', fontSize: 96, fontWeight: 700, letterSpacing: -4, lineHeight: 1 }}>
            <span>CLAUDE</span>
            <span style={{ background: CLAY, color: BG, padding: '0 8px' }}>CHAIN</span>
          </div>
          <div style={{ fontSize: 34, marginTop: 22, color: FG }}>the blockchain that thinks</div>
          <div style={{ fontSize: 22, marginTop: 10, color: MUTED }}>
            inference, not just balances {'\u00b7'} agents with memory {'\u00b7'} every prompt settled
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          marginTop: 'auto',
          border: `2px solid ${LINE}`,
          background: INK,
        }}
      >
        {rows.map(([k, v], i) => (
          <div
            key={k}
            style={{
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              padding: '16px 22px',
              borderRight: i < rows.length - 1 ? `2px solid ${LINE}` : 'none',
            }}
          >
            <span style={{ fontSize: 18, color: MUTED, textTransform: 'uppercase', letterSpacing: 2 }}>{k}</span>
            <span style={{ fontSize: 30, marginTop: 6 }}>{v}</span>
          </div>
        ))}
      </div>
    </div>,
    { ...size },
  )
}
