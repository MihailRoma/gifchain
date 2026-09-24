import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CopyButton } from '@/components/copy-button'
import { AddressLink, Bars, DetailList, Pager, Panel, PanelNote, Stat, TabNav } from '@/components/kit'
import { Age } from '@/components/live/age'
import { AgentGrid, AgentsTable, EventsTable } from '@/components/tables'
import { agents, getSwarm, swarmActivity, swarmStats } from '@/lib/chain/data'
import { bytes, num, tok, utc } from '@/lib/chain/format'
import { blockTimeAt } from '@/lib/chain/constants'
import { buildHref, one, pageOf, type SP } from '@/lib/paging'

type Params = Promise<{ slug: string }>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const swarm = getSwarm((await params).slug)
  if (!swarm) return { title: 'Swarm not found' }
  return { title: swarm.name, description: swarm.description }
}

const PAGE = 60

export default async function SwarmPage({ params, searchParams }: { params: Params; searchParams: Promise<SP> }) {
  const { slug } = await params
  const sp = await searchParams
  const swarm = getSwarm(slug)
  if (!swarm) notFound()
  const stats = swarmStats(slug)
  const tab = one(sp, 'tab') ?? 'agents'
  const members = agents.filter((a) => a.swarm === slug)
  const activity = swarmActivity(slug)
  const base = `/swarms/${slug}`

  const tierCounts = (['opus', 'sonnet', 'haiku'] as const).map((t) => ({
    tier: t,
    count: members.filter((a) => a.tier === t && !a.halted).length,
  }))
  const roleCounts = [...new Set(members.map((a) => a.role))].map((role) => ({
    role,
    count: members.filter((a) => a.role === role && !a.halted).length,
  }))

  const list = tab === 'activity' ? activity : members
  const pages = Math.max(1, Math.ceil(list.length / PAGE))
  const page = pageOf(sp, pages)

  return (
    <div className="flex flex-col gap-2">
      <Panel
        tone="clay"
        title={`${swarm.name} \u00b7 ${swarm.symbol}`}
        right={
          <span className="font-mono text-[10px] normal-case">
            {swarm.standard} {'\u00b7'} {swarm.category}
            {swarm.verified ? ' \u00b7 reviewed' : ''}
          </span>
        }
      >
        <div className="flex flex-col gap-2 p-2 md:flex-row">
          <div className="md:w-[58%]">
            <h1 className="font-mono text-[20px] font-bold leading-tight tracking-[-0.02em]">{swarm.name}</h1>
            <p className="mt-2 max-w-[66ch] text-[12px] leading-relaxed">{swarm.description}</p>
            <div className="mt-2 border border-hair bg-surface-2 p-2 font-mono text-[11px]">
              <div className="text-[9px] uppercase tracking-[0.08em] text-muted-foreground">mandate, as committed to the contract</div>
              <p className="mt-1">&ldquo;{swarm.mandate}&rdquo;</p>
            </div>
            <DetailList
              rows={[
                ['contract', <span key="c" className="flex items-center gap-2"><span className="font-mono">{swarm.contract}</span><CopyButton value={swarm.contract} /></span>],
                ['operator', <AddressLink key="o" address={swarm.operator} len={12} />],
                ['deployed', <span key="d">block <Link href={`/block/${swarm.deployHeight}`} className="font-mono">{num(swarm.deployHeight)}</Link> {'\u00b7'} <Age ts={blockTimeAt(swarm.deployHeight)} long /> {'\u00b7'} {utc(blockTimeAt(swarm.deployHeight))}</span>],
                ['operator fee', `${(swarm.feeBps / 100).toFixed(2)}% of every inference fee`],
                ['tools', swarm.tools.join(', ')],
                ['spawn cap', `${num(swarm.agents)} agents`],
              ]}
            />
          </div>
          <div className="flex-1 border border-line bg-surface-2">
            <div className="panel-hd panel-hd--plain">
              <span>agents, by id</span>
              <span className="font-mono text-[10px] normal-case">{stats.active} alive</span>
            </div>
            <AgentGrid agents={members.slice(0, 48)} fill />
          </div>
        </div>
      </Panel>

      <div className="panel">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8">
          <Stat label="agents" value={num(stats.active)} sub={`${stats.halted} halted`} />
          <Stat label="thinking" value={num(stats.thinking)} sub="right now" />
          <Stat label="operators" value={num(stats.operators)} sub="distinct wallets" />
          <Stat label="24h inferences" value={num(stats.inferences24h)} sub={`${stats.change24h > 0 ? '+' : ''}${stats.change24h}%`} />
          <Stat label="24h tokens" value={tok(stats.tokens24h)} sub="settled" />
          <Stat label="lifetime tokens" value={tok(stats.tokensTotal)} sub="all agents" />
          <Stat label="memory" value={bytes(stats.memoryBytes)} sub="across tries" />
          <Stat label="success rate" value={`${stats.successRate}%`} sub={`~${stats.avgLatencyBlocks} blocks latency`} />
        </div>
      </div>

      <Panel>
        <TabNav
          items={[
            { label: 'agents', href: base, active: tab === 'agents', count: members.length },
            { label: 'activity', href: `${base}?tab=activity`, active: tab === 'activity', count: activity.length },
            { label: 'composition', href: `${base}?tab=composition`, active: tab === 'composition' },
            { label: 'contract', href: `${base}?tab=contract`, active: tab === 'contract' },
          ]}
        />
        {tab === 'agents' && (
          <>
            <AgentsTable agents={members.slice((page - 1) * PAGE, page * PAGE)} showSwarm={false} />
            <Pager page={page} pages={pages} total={members.length} unit="agents" build={(p) => buildHref(base, sp, { p: String(p) })} />
          </>
        )}
        {tab === 'activity' && (
          <>
            <EventsTable events={activity.slice((page - 1) * PAGE, page * PAGE)} showThumb />
            <Pager page={page} pages={pages} total={activity.length} unit="events" build={(p) => buildHref(base, sp, { p: String(p) })} />
          </>
        )}
        {tab === 'composition' && (
          <div className="grid gap-0 md:grid-cols-2">
            <div className="border-b border-hair md:border-b-0 md:border-r">
              <div className="panel-hd panel-hd--plain">model tier</div>
              <Bars rows={tierCounts.map((t) => ({ label: t.tier, value: t.count, max: Math.max(...tierCounts.map((x) => x.count), 1), right: t.count }))} />
            </div>
            <div>
              <div className="panel-hd panel-hd--plain">role</div>
              <Bars rows={roleCounts.map((r) => ({ label: r.role, value: r.count, max: Math.max(...roleCounts.map((x) => x.count), 1), right: r.count }))} />
            </div>
          </div>
        )}
        {tab === 'contract' && (
          <div className="p-2">
            <pre className="overflow-x-auto border border-hair bg-ink p-2 font-mono text-[10.5px] leading-[1.5]">
{`// ${swarm.name} — ${swarm.standard} swarm contract
// deployed at block ${num(swarm.deployHeight)} by ${swarm.operator}

swarm ${swarm.symbol} is ${swarm.standard} {
  mandate  = "${swarm.mandate}"
  cap      = ${swarm.agents}
  fee_bps  = ${swarm.feeBps}
  tools    = [${swarm.tools.map((t) => `"${t}"`).join(', ')}]

  fn spawn(tier, role, params) -> Agent   // SPAWN
  fn prompt(agent, input, max_tokens)     // PROMPT  -> COMPLETION
  fn commit(agent, memory_root)           // MEMORY
  fn halt(agent)                          // HALT, operator only
}`}
            </pre>
            <PanelNote>
              bytecode hash {'0x' + swarm.contract.slice(2, 18)}{'\u2026'} {'\u00b7'} verified source
              matches deployment {'\u00b7'} read via <Link href="/developers/rest">REST</Link> or{' '}
              <Link href="/developers/graphql">GraphQL</Link>
            </PanelNote>
          </div>
        )}
      </Panel>
    </div>
  )
}
