'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { heightAtTime } from '@/lib/chain/constants'
import { dec, num } from '@/lib/chain/format'
import { liveTxsTo, type SpriteRef } from '@/lib/chain/live'
import { Age } from './age'
import { AddrLink, Dash, LiveChip, RefThumb, TxLink } from './primitives'
import { useNow } from './now-provider'

/** Newest transactions at the tip, recomputed from the head on every tick. */
export function LiveTxs({
  pool,
  limit = 20,
  showBlock = true,
}: {
  pool: SpriteRef[]
  limit?: number
  showBlock?: boolean
}) {
  const now = useNow()
  const head = heightAtTime(now)
  const txs = useMemo(() => liveTxsTo(head, limit, pool), [head, limit, pool])

  return (
    <div className="overflow-x-auto">
      <table className="tbl">
        <thead>
          <tr>
            <th>tx hash</th>
            <th>type</th>
            <th>object</th>
            {showBlock && <th>block</th>}
            <th>age</th>
            <th>from</th>
            <th>to</th>
            <th>value</th>
            <th>fee</th>
          </tr>
        </thead>
        <tbody>
          {txs.map((t) => (
            <tr key={t.hash} className="row-in">
              <td>
                <TxLink hash={t.hash} />
              </td>
              <td>
                <LiveChip kind={t.status === 'failed' ? 'FAILED' : t.kind} />
              </td>
              <td>{t.ref ? <RefThumb ref={t.ref} /> : <Dash />}</td>
              {showBlock && (
                <td>
                  <Link href={`/block/${t.height}`} className="font-mono">
                    {num(t.height)}
                  </Link>
                </td>
              )}
              <td className="num text-muted-foreground">
                <Age ts={t.ts} />
              </td>
              <td>
                <AddrLink address={t.from} />
              </td>
              <td>
                <AddrLink address={t.to} />
              </td>
              <td className="num">{t.price === null ? <Dash /> : `${dec(t.price)} GIF`}</td>
              <td className="num text-muted-foreground">{dec(t.fee, 4)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
