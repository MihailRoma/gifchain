import type { Metadata } from 'next'
import Link from 'next/link'
import { Btn, Chip, Panel, PanelNote, Stat, Table } from '@/components/kit'
import { BlocksTable, EventsTable } from '@/components/tables'
import { CHAIN } from '@/lib/chain/constants'
import { SEQUENCERS, latestBlocks, latestEvents, networkStats } from '@/lib/chain/data'
import { dec, num, shortAge } from '@/lib/chain/format'
import { hexFrom, rngFor } from '@/lib/chain/rng'

export const metadata: Metadata = {
  title: 'Explorer',
  description: 'The GIFCHAIN block explorer: blocks, transactions, sequencers and object roots.',
}

export default function ExplorerPage() {
  const stats = networkStats()
  const blocks = latestBlocks(14)
  const events = latestEvents(16)
  const pending = latestEvents(6, 16)

  const seqRows = SEQUENCERS.map((name, i) => {
    const r = rngFor(`seq:${name}`)
    const produced = blocks.filter((b) => b.sequencer === name).length
    return {
      name,
      produced,
      region: name.split('.')[1].toUpperCase(),
      uptime: (99 + r() * 0.99).toFixed(2),
      version: `gifd/1.${8 + (i % 3)}.${Math.floor(r() * 9)}`,
      peers: 24 + Math.floor(r() * 40),
      height: CHAIN.headHeight - Math.floor(r() * 2),
    }
  })

  return (
    <div className="flex flex-col gap-2">
      <Panel
        tone="lime"
        title="explorer"
        right={
          <span className="flex gap-1">
            <Btn href="/blocks">blocks</Btn>
            <Btn href="/txs">transactions</Btn>
            <Btn href="/objects">objects</Btn>
          </span>
        }
      >
        <div className="grid grid-cols-2 md:grid-cols-5">
          <Stat label="head" value={num(stats.height)} sub={`${stats.avgBlockTime}s block time`} href="/blocks" />
          <Stat label="finality" value="2 blocks" sub="~8s to irreversible" />
          <Stat label="object root" value="committed" sub="every block, no exceptions" />
          <Stat label="gas price" value={`${stats.gasPrice} ngif`} sub="p50 of last 100 blocks" />
          <Stat label="status" value={stats.status} sub="8 / 8 sequencers online" />
        </div>
      </Panel>

      <div className="grid gap-2 lg:grid-cols-2">
        <Panel title="latest blocks" right={<Btn href="/blocks">all blocks</Btn>}>
          <BlocksTable blocks={blocks} compact />
        </Panel>
        <Panel title="latest transactions" right={<Btn href="/txs">all transactions</Btn>}>
          <EventsTable events={events} showBlock={false} showHash={false} />
        </Panel>
      </div>

      <div className="grid gap-2 lg:grid-cols-[1fr_360px]">
        <Panel title="sequencer set" tone="dark">
          <Table>
            <thead>
              <tr>
                <th>sequencer</th>
                <th>region</th>
                <th>height</th>
                <th>blocks (last 14)</th>
                <th>peers</th>
                <th>uptime 30d</th>
                <th>client</th>
                <th>status</th>
              </tr>
            </thead>
            <tbody>
              {seqRows.map((s) => (
                <tr key={s.name}>
                  <td className="font-mono">{s.name}</td>
                  <td className="text-muted-foreground">{s.region}</td>
                  <td className="num">{num(s.height)}</td>
                  <td className="num">{s.produced}</td>
                  <td className="num">{s.peers}</td>
                  <td className="num">{s.uptime}%</td>
                  <td className="font-mono text-muted-foreground">{s.version}</td>
                  <td>
                    <Chip kind="OK">signing</Chip>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
          <PanelNote>
            Sequencers take turns in a fixed order inside an epoch of 4096 blocks. A missed slot
            produces an empty block rather than stalling the chain, which is why some blocks carry
            no object operations at all.
          </PanelNote>
        </Panel>

        <div className="flex flex-col gap-2">
          <Panel title="mempool">
            <Table>
              <thead>
                <tr>
                  <th>tx</th>
                  <th>type</th>
                  <th>fee</th>
                  <th>waiting</th>
                </tr>
              </thead>
              <tbody>
                {pending.map((e) => (
                  <tr key={e.hash}>
                    <td>
                      <Link href={`/tx/${e.hash}`} className="font-mono">
                        {e.hash.slice(0, 14)}
                        {'\u2026'}
                      </Link>
                    </td>
                    <td>
                      <Chip kind={e.type} />
                    </td>
                    <td className="num">{dec(e.fee, 4)}</td>
                    <td className="text-muted-foreground">{shortAge(e.ts)}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
            <PanelNote>
              Transactions leave the mempool in fee order. Object writes larger than 16 KB pay a
              surcharge and are scheduled into the next block with spare object-root budget.
            </PanelNote>
          </Panel>

          <Panel title="chain identifiers">
            <table className="tbl">
              <tbody>
                <tr>
                  <th scope="row" className="w-[120px] bg-surface-2">
                    chain id
                  </th>
                  <td className="font-mono">{CHAIN.chainId}</td>
                </tr>
                <tr>
                  <th scope="row" className="bg-surface-2">
                    network
                  </th>
                  <td className="font-mono">{CHAIN.networkId}</td>
                </tr>
                <tr>
                  <th scope="row" className="bg-surface-2">
                    genesis hash
                  </th>
                  <td className="break-all font-mono text-[10px]">0x{hexFrom('genesis', 64)}</td>
                </tr>
                <tr>
                  <th scope="row" className="bg-surface-2">
                    object root
                  </th>
                  <td className="break-all font-mono text-[10px]">0x{hexFrom(`root:${CHAIN.headHeight}`, 64)}</td>
                </tr>
              </tbody>
            </table>
          </Panel>
        </div>
      </div>
    </div>
  )
}
