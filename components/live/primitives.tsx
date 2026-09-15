'use client'

import Link from 'next/link'
import { Sprite } from '@/components/sprite'
import { BURN_ADDRESS } from '@/lib/chain/constants'
import { trunc } from '@/lib/chain/format'
import type { LiveTxKind, SpriteRef } from '@/lib/chain/live'

/**
 * Client-safe copies of the kit primitives. `components/kit.tsx` imports the
 * generated object graph, so anything that ships to the browser re-implements
 * the handful of pieces it needs against the same CSS classes.
 */

const KIND_TONE: Record<LiveTxKind | 'FAILED' | 'OK', string> = {
  MINT: 'bg-lime',
  SALE: 'bg-white text-link border-link',
  TRANSFER: 'bg-white',
  BURN: 'bg-foreground text-white',
  LIST: 'bg-surface-2',
  BID: 'bg-surface-2 text-muted-foreground',
  FAILED: 'bg-white text-[#a81111] border-[#a81111]',
  OK: 'bg-lime',
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

export function AddrLink({ address, chars = 6 }: { address: string; chars?: number }) {
  if (address === BURN_ADDRESS) {
    return <span className="font-mono text-muted-foreground">null</span>
  }
  return (
    <Link href={`/wallet/${address}`} className="font-mono">
      {trunc(address, chars, 4)}
    </Link>
  )
}

export function RefThumb({ ref: r, size = 18 }: { ref: SpriteRef; size?: number }) {
  return (
    <Link
      href={`/object/${r.slug}/${r.tokenId}`}
      className="inline-block shrink-0 no-underline hover:bg-transparent"
      title={r.name}
    >
      <Sprite sheet={r.sheet} cell={r.cell} filter={r.filter} size={size} title={r.name} />
    </Link>
  )
}

export function Dash() {
  return <span className="text-muted-foreground">{'\u2014'}</span>
}
