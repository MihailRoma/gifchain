'use client'

import { useMemo } from 'react'
import { blockIntervalMs, blockTimeAt, heightAtTime } from '@/lib/chain/constants'
import { dec, num, secondsUntil, tok } from '@/lib/chain/format'
import { liveTipStats, type AgentRef } from '@/lib/chain/live'
import { useNow } from './now-provider'

/** Head height on its own, for the header strip. */
export function LiveHeight({ className }: { className?: string }) {
  const head = heightAtTime(useNow())
  return (
    <span className={`num ${className ?? ''}`} suppressHydrationWarning>
      {num(head)}
    </span>
  )
}

/**
 * Seal progress for the block currently being built. Driven by a CSS animation
 * rather than the 1s clock so the bar stays smooth, and re-keyed on the head so
 * it restarts exactly when a block lands.
 */
function SealBar({ head }: { head: number }) {
  const duration = blockIntervalMs(head + 1)
  return (
    <span className="mt-1 block h-[3px] w-full bg-hair" aria-hidden="true">
      <span
        key={head}
        className="seal-bar block h-full bg-clay"
        style={{ animationDuration: `${duration}ms` }}
      />
    </span>
  )
}

/**
 * The network strip at the top of the explorer: head height, the countdown to
 * the next seal, and rolling throughput measured off the tip.
 */
export function LiveTip({ pool }: { pool: AgentRef[] }) {
  const now = useNow()
  const head = heightAtTime(now)
  const stats = useMemo(() => liveTipStats(head, pool, 120), [head, pool])
  const nextAt = blockTimeAt(head + 1)

  const cells = [
    {
      label: 'head block',
      value: num(head),
      sub: `sealed ${Math.max(0, Math.round((now - blockTimeAt(head)) / 1000))}s ago`,
    },
    {
      label: 'next seal',
      value: secondsUntil(nextAt, now),
      sub: `target ${(blockIntervalMs(head + 1) / 1000).toFixed(1)}s`,
      bar: true,
    },
    {
      label: 'avg block time',
      value: `${stats.avgBlockTime.toFixed(2)}s`,
      sub: 'last 120 blocks',
    },
    { label: 'throughput', value: `${stats.tps.toFixed(2)} tps`, sub: `${num(stats.txs)} tx / 120` },
    {
      label: 'token rate',
      value: `${tok(Math.round(stats.tokensPerSec))}/s`,
      sub: `${tok(stats.tokens)} / 120`,
    },
    {
      label: 'base fee',
      value: `${stats.baseFee.toFixed(2)} ncl`,
      sub: `${(stats.fullness * 100).toFixed(1)}% full \u00b7 ${dec(stats.fees, 3)} CLAUDE paid`,
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
      {cells.map((c) => (
        <div key={c.label} className="border-r border-hair px-2 py-[6px] last:border-r-0">
          <div className="font-mono text-[9px] uppercase tracking-[0.07em] text-muted-foreground">
            {c.label}
          </div>
          <div className="num text-[15px] leading-tight" suppressHydrationWarning>
            {c.value}
          </div>
          <div className="font-mono text-[10px] text-muted-foreground" suppressHydrationWarning>
            {c.sub}
          </div>
          {c.bar ? <SealBar head={head} /> : null}
        </div>
      ))}
    </div>
  )
}
