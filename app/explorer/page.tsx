import type { Metadata } from 'next'
import { Btn, Chip, Panel, PanelNote, Table } from '@/components/kit'
import { LiveBlocks } from '@/components/live/live-blocks'
import { LiveMempool } from '@/components/live/live-mempool'
import { LiveTip } from '@/components/live/live-tip'
import { LiveTxs } from '@/components/live/live-txs'
import { CHAIN } from '@/lib/chain/constants'
import { SEQUENCERS, liveHead, networkStats, spritePool } from '@/lib/chain/data'
import { num } from '@/lib/chain/format'
import { hexFrom, rngFor } from '@/lib/chain/rng'

export const metadata: Metadata = {
  // The explorer home is the root of its own domain, so it opts out of the
  // layout's "%s · GIFSCAN" template rather than repeating the brand twice.
  title: { absolute: 'GIFSCAN \u00b7 GIFCHAIN block explorer' },
  description:
    'Live GIFCHAIN block explorer. Blocks, transactions, accounts, contracts and on-chain objects, updated as the chain seals.',
}

export default function ExplorerHome() {
  const stats = networkStats()
  const head = liveHead()
  const pool = spritePool()

  const seqRows = SEQUENCERS.map((name, i) => {
    const r = rngFor(`seq:${name}`)
    return {
      name,
      region: name.split('.')[1].toUpperCase(),
      uptime: (99 + r() * 0.99).toFixed(2),
      version: `gifd/1.${8 + (i % 3)}.${Math.floor(r() * 9)}`,
      peers: 24 + Math.floor(r() * 40),
      height: head - Math.floor(r() * 2),
      stake: 120_000 + Math.floor(r() * 380_000),
    }
  })

  return (
    <div className="flex flex-col gap-2">
      <Panel tone="lime" title="network">
        <LiveTip pool={pool} />
      </Panel>

      <div className="grid gap-2 lg:grid-cols-2">
        <Panel title="latest blocks" right={<Btn href="/blocks">all blocks</Btn>}>
          <LiveBlocks pool={pool} limit={12} compact />
        </Panel>
        <Panel title="latest transactions" right={<Btn href="/txs">all transactions</Btn>}>
          <LiveTxs pool={pool} limit={12} showBlock={false} />
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
                <th>stake</th>
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
                  <td className="num">{num(s.stake)}</td>
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
            produces an empty block rather than stalling the chain, which is why some heights carry
            no object operations at all.
          </PanelNote>
        </Panel>

        <div className="flex flex-col gap-2">
          <Panel title="mempool">
            <LiveMempool pool={pool} limit={8} />
            <PanelNote>
              Pending transactions are the contents of the block being assembled right now. They
              leave this table at the instant that block seals.
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
                    epoch
                  </th>
                  <td className="num">
                    {num(Math.floor(head / 4096))} {'\u00b7'} slot{' '}
                    {num(head % 4096)} / 4096
                  </td>
                </tr>
                <tr>
                  <th scope="row" className="bg-surface-2">
                    gas price
                  </th>
                  <td className="num">{stats.gasPrice} ngif</td>
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
                  <td className="break-all font-mono text-[10px]">
                    0x{hexFrom(`objectroot:${head}`, 64)}
                  </td>
                </tr>
              </tbody>
            </table>
          </Panel>
        </div>
      </div>
    </div>
  )
}
