import type { Metadata } from 'next'
import Link from 'next/link'
import { Bars, Chip, Panel, PanelNote, Stat, Table } from '@/components/kit'
import { ObjectGrid } from '@/components/tables'
import { collections, objects as allObjects } from '@/lib/chain/data'
import { dec, num, shortAge } from '@/lib/chain/format'
import { hexFrom, int, rngFor } from '@/lib/chain/rng'

export const metadata: Metadata = {
  title: 'Bridge',
  description: 'Move objects between GIFCHAIN and mirrored networks through the lock-and-mirror bridge.',
}

const LANES = [
  { name: 'ethereum', standard: 'ERC-721 mirror', finality: '12 min', fee: 0.42, status: 'live' },
  { name: 'base', standard: 'ERC-721 mirror', finality: '3 min', fee: 0.08, status: 'live' },
  { name: 'solana', standard: 'compressed NFT', finality: '40 s', fee: 0.05, status: 'live' },
  { name: 'arbitrum', standard: 'ERC-721 mirror', finality: '5 min', fee: 0.11, status: 'live' },
  { name: 'bitcoin', standard: 'inscription proof', finality: '60 min', fee: 1.8, status: 'paused' },
] as const

export default function BridgePage() {
  const r = rngFor('bridge')
  const locked = collections.map((c) => ({
    c,
    n: int(rngFor(`bridge:${c.slug}`), 4, Math.max(6, Math.round(c.supply * 0.14))),
  }))
  const totalLocked = locked.reduce((a, x) => a + x.n, 0)
  const maxLocked = Math.max(...locked.map((x) => x.n))

  const mirrored = allObjects.filter((o) => !o.burned).filter((_, i) => i % 37 === 0).slice(0, 18)

  const transfers = Array.from({ length: 10 }, (_, i) => {
    const rr = rngFor(`xfer:${i}`)
    const lane = LANES[int(rr, 0, LANES.length - 1)]
    return {
      hash: `0x${hexFrom(`xfer:${i}`, 40)}`,
      lane: lane.name,
      dir: rr() > 0.5 ? 'out' : 'in',
      objects: int(rr, 1, 6),
      ts: Date.now() - int(rr, 90, 52_000) * 1000,
      state: rr() > 0.18 ? 'settled' : 'proving',
    }
  })

  return (
    <div className="flex flex-col gap-2">
      <Panel tone="lime" title="object bridge">
        <div className="grid grid-cols-2 md:grid-cols-4">
          <Stat label="objects locked" value={num(totalLocked)} sub="held by the bridge module" />
          <Stat label="lanes" value={`${LANES.filter((l) => l.status === 'live').length} live`} sub={`${LANES.length} configured`} />
          <Stat label="bridged 24h" value={num(Math.round(180 + r() * 400))} sub="objects in both directions" />
          <Stat label="fastest lane" value="solana" sub="40s to mirrored finality" />
        </div>
        <PanelNote>
          Bridging never copies frames. The object stays in the GIFCHAIN object trie, locked by the
          bridge module, and the destination chain receives a mirror token that points back at the
          original leaf. Burn the mirror and the lock releases.
        </PanelNote>
      </Panel>

      <div className="grid gap-2 lg:grid-cols-[1fr_360px]">
        <Panel title="lanes">
          <Table>
            <thead>
              <tr>
                <th>destination</th>
                <th>representation</th>
                <th>mirror finality</th>
                <th>fee</th>
                <th>status</th>
              </tr>
            </thead>
            <tbody>
              {LANES.map((l) => (
                <tr key={l.name}>
                  <td className="font-mono">{l.name}</td>
                  <td className="text-muted-foreground">{l.standard}</td>
                  <td className="num">{l.finality}</td>
                  <td className="num">{dec(l.fee)} GIF</td>
                  <td>
                    <Chip kind={l.status === 'live' ? 'OK' : 'FAILED'}>{l.status}</Chip>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
          <PanelNote>
            The bitcoin lane is paused while the inscription proof format is reworked. Objects
            already mirrored there can still be returned, they just cannot leave again.
          </PanelNote>
        </Panel>

        <Panel title="locked by collection">
          <Bars
            rows={locked.map(({ c, n }) => ({
              label: (
                <Link href={`/collections/${c.slug}`} className="font-mono">
                  {c.symbol}
                </Link>
              ),
              value: n,
              max: maxLocked,
              right: `${n} locked`,
            }))}
          />
        </Panel>
      </div>

      <div className="grid gap-2 lg:grid-cols-2">
        <Panel title="recent bridge transfers">
          <Table>
            <thead>
              <tr>
                <th>transfer</th>
                <th>lane</th>
                <th>direction</th>
                <th>objects</th>
                <th>age</th>
                <th>state</th>
              </tr>
            </thead>
            <tbody>
              {transfers.map((t) => (
                <tr key={t.hash}>
                  <td className="font-mono">{t.hash.slice(0, 16)}{'\u2026'}</td>
                  <td className="font-mono">{t.lane}</td>
                  <td>
                    <Chip kind={t.dir === 'out' ? 'TRANSFER' : 'MINT'}>
                      {t.dir === 'out' ? 'gifchain \u2192 lane' : 'lane \u2192 gifchain'}
                    </Chip>
                  </td>
                  <td className="num">{t.objects}</td>
                  <td className="text-muted-foreground">{shortAge(t.ts)}</td>
                  <td>
                    <Chip kind={t.state === 'settled' ? 'OK' : 'LIST'}>{t.state}</Chip>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Panel>

        <Panel title="objects currently mirrored out">
          <ObjectGrid objects={mirrored} size={64} showLabels={false} />
          <PanelNote>
            While an object is mirrored, transfers on GIFCHAIN are rejected by the bridge module.
            The ownership leaf still exists and still resolves, it is simply frozen.
          </PanelNote>
        </Panel>
      </div>
    </div>
  )
}
