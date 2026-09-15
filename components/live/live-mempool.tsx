'use client'

import { useMemo } from 'react'
import { blockTimeAt, heightAtTime } from '@/lib/chain/constants'
import { dec, secondsUntil } from '@/lib/chain/format'
import { liveBlockAt, type SpriteRef } from '@/lib/chain/live'
import { Dash, LiveChip, TxLink } from './primitives'
import { useNow } from './now-provider'

/**
 * The mempool is not a separate structure here — it is the block the network is
 * currently assembling. Reading `head + 1` gives exactly the set of pending
 * transactions, and they disappear from this table at the moment they are
 * sealed into the tip, which is what makes the two panels agree.
 */
export function LiveMempool({ pool, limit = 8 }: { pool: SpriteRef[]; limit?: number }) {
  const now = useNow()
  const head = heightAtTime(now)
  const pending = useMemo(() => liveBlockAt(head + 1, pool).txs.slice(0, limit), [head, pool, limit])
  const sealsAt = blockTimeAt(head + 1)

  return (
    <div className="overflow-x-auto">
      <table className="tbl">
        <thead>
          <tr>
            <th>pending tx</th>
            <th>type</th>
            <th>fee</th>
            <th>seals in</th>
          </tr>
        </thead>
        <tbody>
          {pending.map((t) => (
            <tr key={t.hash} className="row-in">
              <td>
                <TxLink hash={t.hash} chars={12} />
              </td>
              <td>
                <LiveChip kind={t.kind} />
              </td>
              <td className="num">{dec(t.fee, 4)}</td>
              <td className="num text-muted-foreground" suppressHydrationWarning>
                {secondsUntil(sealsAt, now)}
              </td>
            </tr>
          ))}
          {pending.length === 0 ? (
            <tr>
              <td colSpan={4} className="text-muted-foreground">
                mempool empty {'\u2014'} next block will be empty <Dash />
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  )
}
