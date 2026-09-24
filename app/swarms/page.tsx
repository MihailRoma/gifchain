import type { Metadata } from 'next'
import Link from 'next/link'
import { Btn, Panel, PanelNote, Stat } from '@/components/kit'
import { AgentGrid, SwarmsTable } from '@/components/tables'
import { agents, networkStats, trendingSwarms } from '@/lib/chain/data'
import { bytes, num, tok } from '@/lib/chain/format'
import { one, type SP } from '@/lib/paging'

export const metadata: Metadata = {
  title: 'Swarms',
  description: 'Every swarm deployed to CLAUDECHAIN: purpose, agent count, inference volume and contract.',
}

export default async function SwarmsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams
  const sort = one(sp, 'sort') ?? 'inferences'
  const stats = networkStats()
  let rows = trendingSwarms()
  if (sort === 'agents') rows = [...rows].sort((a, b) => b.stats.active - a.stats.active)
  if (sort === 'tokens') rows = [...rows].sort((a, b) => b.stats.tokens24h - a.stats.tokens24h)
  if (sort === 'memory') rows = [...rows].sort((a, b) => b.stats.memoryBytes - a.stats.memoryBytes)
  if (sort === 'newest') rows = [...rows].sort((a, b) => b.deployHeight - a.deployHeight)

  const totalMemory = rows.reduce((a, s) => a + s.stats.memoryBytes, 0)

  return (
    <div className="flex flex-col gap-2">
      <div className="panel">
        <div className="grid grid-cols-2 sm:grid-cols-4">
          <Stat label="swarms" value={num(stats.swarms)} sub="deployed" />
          <Stat label="agents" value={num(stats.agents)} sub="across all swarms" />
          <Stat label="24h inferences" value={num(stats.inferences24h)} sub="all swarms" />
          <Stat label="memory held" value={bytes(totalMemory)} sub="in agent tries" />
        </div>
      </div>

      <Panel
        title="swarms"
        right={
          <span className="flex items-center gap-1">
            {[
              ['inferences', '24h inference'],
              ['tokens', '24h tokens'],
              ['agents', 'agents'],
              ['memory', 'memory'],
              ['newest', 'newest'],
            ].map(([k, label]) => (
              <Btn key={k} href={k === 'inferences' ? '/swarms' : `/swarms?sort=${k}`} on={sort === k}>
                {label}
              </Btn>
            ))}
          </span>
        }
      >
        <SwarmsTable rows={rows} />
        <PanelNote>
          a swarm is a CC-1 or CC-2 contract that spawns agents sharing one mandate and one tool set
          {'\u00b7'} the v mark means the code review council has signed the contract
        </PanelNote>
      </Panel>

      <div className="grid gap-2 md:grid-cols-2">
        {rows.map((s) => (
          <Panel
            key={s.slug}
            title={
              <Link href={`/swarms/${s.slug}`}>
                {s.name} <span className="opacity-70">{s.symbol}</span>
              </Link>
            }
            tone="plain"
            right={<span className="font-mono text-[10px] normal-case">{s.category}</span>}
          >
            <div className="flex gap-2 p-2">
              <div className="w-[176px] shrink-0 border border-hair bg-ink">
                <AgentGrid agents={agents.filter((a) => a.swarm === s.slug && !a.halted).slice(0, 16)} size={36} showLabels={false} />
              </div>
              <div className="flex-1 text-[11px] leading-relaxed">
                <p className="text-pretty">{s.description}</p>
                <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                  &ldquo;{s.mandate}&rdquo;
                </p>
                <dl className="mt-2 grid grid-cols-3 gap-x-2 font-mono text-[10px]">
                  <div>
                    <dt className="text-muted-foreground">agents</dt>
                    <dd className="num">{s.stats.active}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">24h tokens</dt>
                    <dd className="num">{tok(s.stats.tokens24h)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">operator fee</dt>
                    <dd className="num">{(s.feeBps / 100).toFixed(2)}%</dd>
                  </div>
                </dl>
              </div>
            </div>
          </Panel>
        ))}
      </div>
    </div>
  )
}
