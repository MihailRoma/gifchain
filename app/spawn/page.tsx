import type { Metadata } from 'next'
import Link from 'next/link'
import { Panel, PanelNote, Stat } from '@/components/kit'
import { EventsTable } from '@/components/tables'
import { SpawnPanel } from '@/components/spawn-panel'
import { agents, latestEvents, networkStats, swarms } from '@/lib/chain/data'
import { num } from '@/lib/chain/format'

export const metadata: Metadata = {
  title: 'Spawn an agent',
  description: 'Spawn a new CC-1 agent into a swarm: choose a tier, a role, a memory policy and an operator.',
}

export default function SpawnPage() {
  const stats = networkStats()
  const recent = latestEvents(12, 0, ['SPAWN'])
  const options = swarms.map((s) => ({
    slug: s.slug,
    name: s.name,
    symbol: s.symbol,
    roles: [...new Set(agents.filter((a) => a.swarm === s.slug).map((a) => a.role))],
    feeBps: s.feeBps,
    tools: s.tools,
  }))

  return (
    <div className="flex flex-col gap-2">
      <Panel tone="clay" title="spawn / new agent">
        <div className="p-2">
          <h1 className="font-mono text-[20px] font-bold leading-tight tracking-[-0.02em]">Spawn an agent.</h1>
          <p className="mt-1 max-w-[70ch] text-[12px] leading-relaxed">
            A SPAWN transaction asks a swarm contract to bring one more agent to life. The contract
            fixes the agent&apos;s parameters, assigns it an address, and hands it to your operator
            wallet. From the next block on it can be prompted by anyone and will write its own memory.
            The spawn fee is burned; the swarm&apos;s operator fee is taken from each inference after.
          </p>
        </div>
        <SpawnPanel swarms={options} />
      </Panel>

      <div className="panel">
        <div className="grid grid-cols-2 sm:grid-cols-4">
          <Stat label="agents alive" value={num(stats.agents)} />
          <Stat label="24h spawns" value={num(stats.spawns24h)} />
          <Stat label="swarms accepting spawns" value={swarms.filter((s) => s.feeBps < 1000).length} sub="below the cap" />
          <Stat label="spawn fee, burned" value="3 - 48 CLAUDE" sub="by tier" />
        </div>
      </div>

      <div className="grid gap-2 lg:grid-cols-2">
        <Panel title="how a spawn settles">
          <ol className="flex flex-col gap-1 p-2 font-mono text-[11px] leading-relaxed">
            {[
              ['1', 'Your wallet signs a SPAWN calling the swarm contract with tier, role and memory policy.'],
              ['2', 'The sealer includes it in the next block; the spawn fee is burned to the null address.'],
              ['3', 'The Spawn Module derives the agent address from (operator, swarm, nonce) and writes it to the state root.'],
              ['4', 'The agent performs its first inference against the mandate and commits its first MEMORY write.'],
              ['5', 'Two seals later the spawn is final. Anyone can PROMPT the agent; only you can HALT it.'],
            ].map(([n, text]) => (
              <li key={n} className="flex gap-2 border-b border-hair pb-1 last:border-b-0">
                <span className="w-4 shrink-0 text-clay">{n}</span>
                <span>{text}</span>
              </li>
            ))}
          </ol>
          <PanelNote>
            the address preview on the right is the real derivation: same operator, same swarm, same
            glyph {'\u00b7'} <Link href="/docs/spawning">full spec</Link>
          </PanelNote>
        </Panel>
        <Panel title="recent spawns">
          <EventsTable events={recent} showThumb showAgent showHash={false} />
        </Panel>
      </div>
    </div>
  )
}
