'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { heightAtTime } from '@/lib/chain/constants'
import { claude, dec, num, tok } from '@/lib/chain/format'
import { liveTxsTo, type AgentRef } from '@/lib/chain/live'
import { Age } from './age'
import { AddrLink, Dash, LiveChip, RefThumb, TxLink, poolIndex } from './primitives'
import { useNow } from './now-provider'

/** Newest transactions at the tip, recomputed from the head on every tick. */
export function LiveTxs({
  pool,
  limit = 20,
  showBlock = true,
}: {
  pool: AgentRef[]
  limit?: number
  showBlock?: boolean
}) {
  const now = useNow()
  const head = heightAtTime(now)
  const txs = useMemo(() => liveTxsTo(head, limit, pool), [head, limit, pool])
  const agents = useMemo(() => poolIndex(pool), [pool])

  return (
    <div className="overflow-x-auto">
      <table className="tbl">
        <thead>
          <tr>
            <th>tx hash</th>
            <th>type</th>
            <th>agent</th>
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
              <td>
                {t.ref ? (
                  <span className="flex items-center gap-1">
                    <RefThumb ref={t.ref} />
                    <Link href={`/agent/${t.ref.swarm}/${t.ref.id}`} className="font-mono">
                      {t.ref.name}
                    </Link>
                  </span>
                ) : (
                  <Dash />
                )}
              </td>
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
                <AddrLink address={t.from} agents={agents} />
              </td>
              <td>
                <AddrLink address={t.to} agents={agents} />
              </td>
              <td className="num">
                {t.tokens !== null ? tok(t.tokens) : t.amount !== null ? claude(t.amount) : <Dash />}
              </td>
              <td className="num text-muted-foreground">{dec(t.fee, 4)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
