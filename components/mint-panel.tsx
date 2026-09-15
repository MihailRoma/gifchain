'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Sprite } from '@/components/kit'

export interface MintTarget {
  slug: string
  name: string
  symbol: string
  sheet: string
  filter: string | null
  price: number
  minted: number
  supply: number
}

type Phase = 'idle' | 'signing' | 'pending' | 'done'

const STEPS: Array<[Phase, string]> = [
  ['signing', 'signing mint intent with local key'],
  ['pending', 'broadcast to seq-03.nrt, waiting for inclusion'],
  ['done', 'object root committed, mint final'],
]

function hex(n: number) {
  let s = ''
  for (let i = 0; i < n; i++) s += '0123456789abcdef'[Math.floor(Math.random() * 16)]
  return s
}

export function MintPanel({ targets }: { targets: MintTarget[] }) {
  const [slug, setSlug] = useState(targets[0].slug)
  const [qty, setQty] = useState(1)
  const [phase, setPhase] = useState<Phase>('idle')
  const [log, setLog] = useState<string[]>([])
  const [cells, setCells] = useState<number[]>([])
  const [hash, setHash] = useState('')
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  const target = targets.find((t) => t.slug === slug) ?? targets[0]
  const remaining = target.supply - target.minted
  const total = Math.round(target.price * qty * 100) / 100

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  function reset() {
    timers.current.forEach(clearTimeout)
    timers.current = []
    setPhase('idle')
    setLog([])
    setCells([])
    setHash('')
  }

  function mint() {
    reset()
    const h = `0x${hex(64)}`
    setHash(h)
    setCells(Array.from({ length: qty }, () => Math.floor(Math.random() * 16)))
    STEPS.forEach(([p, text], i) => {
      timers.current.push(
        setTimeout(() => {
          setPhase(p)
          setLog((prev) => [...prev, text])
        }, 420 + i * 900),
      )
    })
  }

  return (
    <div className="flex flex-col">
      <div className="flex flex-wrap items-center gap-1 border-b border-line bg-surface-2 px-2 py-1">
        {targets.map((t) => (
          <button
            key={t.slug}
            type="button"
            className="btn"
            data-on={t.slug === slug ? 'true' : undefined}
            onClick={() => {
              setSlug(t.slug)
              reset()
            }}
          >
            {t.symbol.toLowerCase()}
          </button>
        ))}
      </div>

      <div className="grid gap-2 p-2 md:grid-cols-[120px_1fr]">
        <Sprite sheet={target.sheet} cell={0} filter={target.filter} size={120} title={target.name} />
        <div className="flex flex-col gap-2">
          <div>
            <Link href={`/collections/${target.slug}`} className="font-mono text-[12px]">
              {target.name}
            </Link>
            <p className="mt-1 font-mono text-[10px] text-muted-foreground">
              {target.minted} / {target.supply} minted {'\u00b7'} {remaining} left {'\u00b7'}{' '}
              {target.price} GIF each
            </p>
            <span className="mt-1 block h-[10px] w-full border border-hair bg-surface-2">
              <span
                className="block h-full bg-ink"
                style={{ width: `${Math.round((target.minted / target.supply) * 100)}%` }}
              />
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1">
            <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-muted-foreground">
              quantity
            </span>
            {[1, 2, 4, 8].map((n) => (
              <button
                key={n}
                type="button"
                className="btn"
                data-on={qty === n ? 'true' : undefined}
                onClick={() => {
                  setQty(n)
                  reset()
                }}
              >
                {n}
              </button>
            ))}
            <span className="ml-auto font-mono text-[11px]">
              total <span className="text-foreground">{total} GIF</span>
            </span>
          </div>

          <div className="flex gap-1">
            <button type="button" className="btn" onClick={mint} disabled={phase !== 'idle' && phase !== 'done'}>
              {phase === 'idle' ? 'mint' : phase === 'done' ? 'mint again' : 'minting\u2026'}
            </button>
            <button type="button" className="btn" onClick={reset} disabled={phase === 'idle'}>
              reset
            </button>
          </div>
        </div>
      </div>

      {phase !== 'idle' ? (
        <div className="border-t border-line">
          <div className="flex flex-wrap items-center gap-2 border-b border-hair px-2 py-1 font-mono text-[10px]">
            <span className="text-muted-foreground">tx</span>
            <span className="break-all">{hash}</span>
            <span className={`chip ${phase === 'done' ? 'chip-ok' : 'chip-list'}`}>
              {phase === 'done' ? 'confirmed' : 'pending'}
            </span>
          </div>
          <ol className="px-2 py-1 font-mono text-[10px] leading-[1.7] text-muted-foreground">
            {log.map((l, i) => (
              <li key={i}>
                <span className="text-foreground">{'>'}</span> {l}
              </li>
            ))}
          </ol>
          {phase === 'done' ? (
            <div className="flex flex-wrap items-center gap-1 border-t border-hair p-2">
              {cells.map((c, i) => (
                <Sprite key={i} sheet={target.sheet} cell={c} filter={target.filter} size={56} />
              ))}
              <p className="w-full font-mono text-[10px] text-muted-foreground">
                Simulated only. Nothing was signed, nothing was spent, and these objects do not
                enter the indexed supply.
              </p>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
