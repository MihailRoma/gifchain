'use client'

import Link from 'next/link'
import { Glyph } from '@/components/glyph'
import { BURN_ADDRESS, MEMORY_MODULE, SPAWN_MODULE } from '@/lib/chain/constants'
import { trunc } from '@/lib/chain/format'
import type { AgentRef, LiveTxKind } from '@/lib/chain/live'

/**
 * Client-safe copies of the kit primitives. `components/kit.tsx` imports the
 * generated agent graph, so anything that ships to the browser re-implements
 * the handful of pieces it needs against the same CSS classes.
 */

const KIND_TONE: Record<LiveTxKind | 'FAILED' | 'OK', string> = {
  SPAWN: 'bg-clay text-clay-foreground border-clay',
  PROMPT: 'bg-surface text-link border-link',
  COMPLETION: 'bg-foreground text-background border-foreground',
  MEMORY: 'bg-surface-2',
  TRANSFER: 'bg-surface text-muted-foreground',
  HALT: 'bg-ink text-muted-foreground',
  FAILED: 'bg-surface text-destructive border-destructive',
  OK: 'bg-clay text-clay-foreground border-clay',
}

const SYSTEM_NAMES: Record<string, string> = {
  [BURN_ADDRESS]: 'null',
  [SPAWN_MODULE]: 'spawn module',
  [MEMORY_MODULE]: 'memory module',
}

export function LiveChip({ kind }: { kind: LiveTxKind | 'FAILED' | 'OK' }) {
  return <span className={`chip ${KIND_TONE[kind]}`}>{kind}</span>
}

export function TxLink({ hash, chars = 8 }: { hash: string; chars?: number }) {
  return (
    <Link href={`/tx/${hash}`} className="font-mono">
      {trunc(hash, chars, 6)}
    </Link>
  )
}

/**
 * Addresses at the tip. Agents are named through the pool the server handed
 * over; system modules by a fixed table; everything else as truncated hex.
 */
export function AddrLink({
  address,
  chars = 6,
  agents,
}: {
  address: string
  chars?: number
  agents?: ReadonlyMap<string, AgentRef>
}) {
  if (address === BURN_ADDRESS) return <span className="font-mono text-muted-foreground">null</span>
  const system = SYSTEM_NAMES[address]
  if (system) {
    return (
      <Link href={`/wallet/${address}`} className="font-mono text-muted-foreground">
        {system}
      </Link>
    )
  }
  const agent = agents?.get(address)
  if (agent) {
    return (
      <Link href={`/agent/${agent.swarm}/${agent.id}`} className="font-mono">
        {agent.name}
      </Link>
    )
  }
  return (
    <Link href={`/wallet/${address}`} className="font-mono">
      {trunc(address, chars, 4)}
    </Link>
  )
}

export function RefThumb({ ref: r, size = 18 }: { ref: AgentRef; size?: number }) {
  return (
    <Link
      href={`/agent/${r.swarm}/${r.id}`}
      className="inline-block shrink-0 no-underline hover:bg-transparent"
      title={r.name}
    >
      <Glyph seed={r.address} tier={r.tier} size={size} title={r.name} />
    </Link>
  )
}

export function Dash() {
  return <span className="text-muted-foreground">{'\u2014'}</span>
}

/** Index a pool by address once per render tree. */
export function poolIndex(pool: readonly AgentRef[]): Map<string, AgentRef> {
  return new Map(pool.map((a) => [a.address, a]))
}
