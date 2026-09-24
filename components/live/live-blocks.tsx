'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { heightAtTime } from '@/lib/chain/constants'
import { dec, num, tok } from '@/lib/chain/format'
import { liveBlocksTo, type AgentRef } from '@/lib/chain/live'
import { Age } from './age'
import { Dash, RefThumb } from './primitives'
import { useNow } from './now-provider'

/**
 * The blocks table at the chain tip.
 *
 * Blocks are a pure function of height, so there is no accumulating state: each
 * tick recomputes the window from the current head. New heights mount as new
 * rows, and the `key` change is what drives the arrival flash.
 */
export function LiveBlocks({
  pool,
  limit = 20,
  compact = false,
}: {
  pool: AgentRef[]
  limit?: number
  compact?: boolean
}) {
  const now = useNow()
  const head = heightAtTime(now)
  const blocks = useMemo(() => liveBlocksTo(head, limit, pool), [head, limit, pool])

  return (
    <div className="overflow-x-auto">
      <table className="tbl">
        <thead>
          <tr>
            <th>block</th>
            <th>age</th>
            <th>txs</th>
            <th>infer</th>
            <th>memory</th>
            <th>spawns</th>
            <th>tokens</th>
            {!compact && <th>gas used</th>}
            {!compact && <th>size</th>}
            <th>fees</th>
            <th>sealer</th>
            <th>agents</th>
          </tr>
        </thead>
        <tbody>
          {blocks.map((b) => (
            <tr key={b.height} className="row-in">
              <td>
                <Link href={`/block/${b.height}`} className="font-mono">
                  {num(b.height)}
                </Link>
              </td>
              <td className="num text-muted-foreground">
                <Age ts={b.ts} />
              </td>
              <td className="num">{b.txCount}</td>
              <td className="num">{b.inferences}</td>
              <td className="num">{b.memoryWrites}</td>
              <td className="num">{b.spawns}</td>
              <td className="num">{b.tokens ? tok(b.tokens) : <Dash />}</td>
              {!compact && <td className="num">{num(b.gasUsed)}</td>}
              {!compact && <td className="num">{num(b.size)} B</td>}
              <td className="num">{dec(b.fees, 4)}</td>
              <td className="text-muted-foreground">{b.sequencer}</td>
              <td>
                <span className="flex items-center gap-[2px]">
                  {b.txs
                    .filter((t) => t.ref)
                    .slice(0, 6)
                    .map((t) => <RefThumb key={t.hash} ref={t.ref!} />)}
                  {b.txs.every((t) => !t.ref) ? <Dash /> : null}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
