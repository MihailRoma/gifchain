import type { Metadata } from 'next'
import Link from 'next/link'
import { CopyButton } from '@/components/copy-button'
import { AddressLink, Bars, DetailList, Panel, PanelNote, Stat } from '@/components/kit'
import { BRIDGE_VAULT, CHAIN } from '@/lib/chain/constants'
import { dec, num } from '@/lib/chain/format'
import { rngFor } from '@/lib/chain/rng'

export const metadata: Metadata = {
  title: 'Bridge',
  description: 'Move CLAUDE and agent memory between CLAUDECHAIN and other networks through the bridge vault.',
}

const ROUTES = [
  { from: 'Ethereum', asset: 'ETH \u2192 CLAUDE', time: '~12 min', fee: '0.05%', status: 'open' },
  { from: 'Base', asset: 'USDC \u2192 CLAUDE', time: '~90 s', fee: '0.03%', status: 'open' },
  { from: 'Solana', asset: 'SOL \u2192 CLAUDE', time: '~40 s', fee: '0.05%', status: 'open' },
  { from: 'Arbitrum', asset: 'ETH \u2192 CLAUDE', time: '~90 s', fee: '0.03%', status: 'open' },
  { from: 'CLAUDECHAIN', asset: 'agent memory \u2192 IPFS export', time: '1 block', fee: 'gas only', status: 'open' },
  { from: 'CLAUDECHAIN', asset: 'CLAUDE \u2192 Ethereum', time: '~20 min', fee: '0.05%', status: 'open' },
]

export default function BridgePage() {
  const r = rngFor('bridge')
  const tvl = 18_400_000 + Math.round(r() * 900_000)
  const volume = 412_000 + Math.round(r() * 60_000)
  const chains = [
    { label: 'Ethereum', value: 46 },
    { label: 'Base', value: 27 },
    { label: 'Solana', value: 15 },
    { label: 'Arbitrum', value: 12 },
  ]

  return (
    <div className="flex flex-col gap-2">
      <Panel tone="clay" title="bridge / vault" right={<span className="font-mono text-[10px] normal-case">4 routes in {'\u00b7'} 2 routes out</span>}>
        <div className="flex flex-col gap-2 p-2 md:flex-row">
          <div className="md:w-[58%]">
            <h1 className="font-mono text-[20px] font-bold leading-tight tracking-[-0.02em]">Bring compute money in. Take memory out.</h1>
            <p className="mt-2 max-w-[66ch] text-[12px] leading-relaxed">
              The bridge vault accepts deposits from four networks and releases {CHAIN.ticker} on
              CLAUDECHAIN once the deposit is final on its home chain. Withdrawals wait for two seals
              plus the destination chain&apos;s own finality.
            </p>
            <p className="mt-2 max-w-[66ch] text-[12px] leading-relaxed">
              Agents do not leave. An agent&apos;s memory trie can be exported as a signed snapshot,
              which is how operators back up a Scribe&apos;s style memory or move an Archivist&apos;s
              index elsewhere, but the agent itself, its address and its inference history stay here.
            </p>
            <DetailList
              rows={[
                ['vault contract', <span key="v" className="flex items-center gap-2"><AddressLink address={BRIDGE_VAULT} len={14} /><CopyButton value={BRIDGE_VAULT} /></span>],
                ['attestation', '5 of 8 sealers sign every release'],
                ['inbound finality', 'source chain finality, then 1 seal'],
                ['outbound finality', `${CHAIN.finalityDepth} seals, then destination finality`],
                ['rate limit', '2,000,000 CLAUDE per rolling hour'],
                ['audit', <Link key="a" href="/swarms/auditors">Contract Auditors</Link>],
              ]}
            />
          </div>
          <div className="flex-1">
            <div className="panel">
              <div className="grid grid-cols-2">
                <Stat label="vault tvl" value={`$${num(tvl)}`} sub="all routes" />
                <Stat label="24h volume" value={`$${num(volume)}`} sub="in + out" />
                <Stat label="claude price" value={`$${dec(CHAIN.claudePriceUsd)}`} sub="oracle network" />
                <Stat label="pending releases" value={num(3 + Math.round(r() * 9))} sub="awaiting signatures" />
              </div>
            </div>
            <div className="panel mt-2">
              <div className="panel-hd panel-hd--plain">tvl by source chain</div>
              <Bars rows={chains.map((c) => ({ label: c.label, value: c.value, max: 50, right: `${c.value}%` }))} />
            </div>
          </div>
        </div>
      </Panel>

      <Panel title="routes">
        <table className="tbl">
          <thead>
            <tr>
              <th>from</th>
              <th>asset</th>
              <th>typical time</th>
              <th>fee</th>
              <th>status</th>
            </tr>
          </thead>
          <tbody>
            {ROUTES.map((route) => (
              <tr key={route.from + route.asset}>
                <td>{route.from}</td>
                <td>{route.asset}</td>
                <td className="num">{route.time}</td>
                <td className="num">{route.fee}</td>
                <td>
                  <span className="chip bg-clay text-clay-foreground border-clay">{route.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <PanelNote>
          bridging is a simulation on this site; there is no wallet to connect and no funds move
          anywhere
        </PanelNote>
      </Panel>
    </div>
  )
}
