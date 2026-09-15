import type { Metadata } from 'next'
import Link from 'next/link'
import { BarChart, Bars, Panel, PanelNote, Stat, Table } from '@/components/kit'
import { CHAIN } from '@/lib/chain/constants'
import { collectionStats, collections, dailySeries, liveHead, networkStats, topWallets } from '@/lib/chain/data'
import { dec, num } from '@/lib/chain/format'

export const metadata: Metadata = {
  title: 'Network stats',
  description: 'Thirty days of GIFCHAIN throughput, object creation, settled volume and fees.',
}

export default function StatsPage() {
  const series = dailySeries()
  const stats = networkStats()
  const labels = series.map((d) => d.day)

  const sum = (k: keyof (typeof series)[number]) =>
    series.reduce((a, d) => a + (d[k] as number), 0)

  const cols = collections
    .map((c) => ({ c, s: collectionStats(c.slug) }))
    .sort((a, b) => b.s.volumeTotal - a.s.volumeTotal)
  const maxVol = Math.max(...cols.map((x) => x.s.volumeTotal))
  const top = topWallets(10)
  const maxHeld = top[0].count

  return (
    <div className="flex flex-col gap-2">
      <div className="panel">
        <div className="grid grid-cols-2 md:grid-cols-6">
          <Stat label="mints (30d)" value={num(sum('mints'))} sub={`${num(Math.round(sum('mints') / 30))} / day`} />
          <Stat label="transfers (30d)" value={num(sum('transfers'))} sub="object layer only" />
          <Stat label="sales (30d)" value={num(sum('sales'))} sub="market module" />
          <Stat label="volume (30d)" value={`${num(sum('volume'))}`} sub="GIF settled" />
          <Stat label="fees (30d)" value={`${num(sum('fees'))}`} sub="GIF burned to the treasury" />
          <Stat label="block time" value={`${stats.avgBlockTime}s`} sub="30d average" />
        </div>
      </div>

      <div className="grid gap-2 lg:grid-cols-2">
        <Panel title="objects minted / day">
          <BarChart data={series.map((d) => d.mints)} labels={labels} height={130} color="var(--blue)" unit=" mints" />
        </Panel>
        <Panel title="object transfers / day">
          <BarChart data={series.map((d) => d.transfers)} labels={labels} height={130} unit=" transfers" />
        </Panel>
        <Panel title="settled volume / day (GIF)">
          <BarChart data={series.map((d) => d.volume)} labels={labels} height={130} unit=" GIF" />
        </Panel>
        <Panel title="active wallets / day">
          <BarChart data={series.map((d) => d.wallets)} labels={labels} height={130} color="var(--blue)" unit=" wallets" />
        </Panel>
        <Panel title="fees paid / day (GIF)">
          <BarChart data={series.map((d) => d.fees)} labels={labels} height={130} unit=" GIF" />
        </Panel>
        <Panel title="average block time / day (s)">
          <BarChart data={series.map((d) => d.blockTime)} labels={labels} height={130} unit="s" />
          <PanelNote>
            Block time drifts with sequencer rotation. The protocol targets 4.00s and corrects over
            an epoch rather than per block.
          </PanelNote>
        </Panel>
      </div>

      <div className="grid gap-2 lg:grid-cols-2">
        <Panel title="lifetime volume by collection">
          <Bars
            rows={cols.map(({ c, s }) => ({
              label: (
                <Link href={`/collections/${c.slug}`} className="font-mono">
                  {c.name}
                </Link>
              ),
              value: s.volumeTotal,
              max: maxVol,
              right: `${num(Math.round(s.volumeTotal))} GIF`,
            }))}
          />
        </Panel>
        <Panel title="largest holders">
          <Bars
            rows={top.map((w) => ({
              label: (
                <Link href={`/wallet/${w.wallet.address}`} className="font-mono">
                  {w.wallet.handle ?? `${w.wallet.address.slice(0, 10)}\u2026`}
                </Link>
              ),
              value: w.count,
              max: maxHeld,
              right: `${w.count} objects`,
            }))}
          />
        </Panel>
      </div>

      <Panel title="daily detail">
        <Table>
          <thead>
            <tr>
              <th>day (UTC)</th>
              <th>mints</th>
              <th>transfers</th>
              <th>sales</th>
              <th>volume (GIF)</th>
              <th>fees (GIF)</th>
              <th>active wallets</th>
              <th>avg block time</th>
            </tr>
          </thead>
          <tbody>
            {[...series].reverse().map((d) => (
              <tr key={d.day}>
                <td className="font-mono">{d.day}</td>
                <td className="num">{num(d.mints)}</td>
                <td className="num">{num(d.transfers)}</td>
                <td className="num">{num(d.sales)}</td>
                <td className="num">{num(d.volume)}</td>
                <td className="num">{num(d.fees)}</td>
                <td className="num">{num(d.wallets)}</td>
                <td className="num">{dec(d.blockTime, 2)}s</td>
              </tr>
            ))}
          </tbody>
        </Table>
        <PanelNote>
          Days are bucketed by UTC midnight against the snapshot anchor at height{' '}
          {num(liveHead())}. Volume counts only sales settled by the native market module;
          objects moved by private agreement show up as transfers with no price.
        </PanelNote>
      </Panel>
    </div>
  )
}
