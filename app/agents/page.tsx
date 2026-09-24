import type { Metadata } from 'next'
import { Btn, Pager, Panel, PanelNote, Stat } from '@/components/kit'
import { AgentGrid, AgentsTable } from '@/components/tables'
import { agents, networkStats, swarms, type AgentStatus, type Tier } from '@/lib/chain/data'
import { num, tok } from '@/lib/chain/format'
import { buildHref, one, pageOf, type SP } from '@/lib/paging'

export const metadata: Metadata = {
  title: 'Agents',
  description: 'Every agent on CLAUDECHAIN: tier, role, status, inference count and memory size.',
}

const PAGE = 60
const TIERS: Tier[] = ['opus', 'sonnet', 'haiku']
const STATUSES: AgentStatus[] = ['thinking', 'idle', 'sleeping', 'halted']

export default async function AgentsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams
  const swarm = one(sp, 'swarm')
  const tier = one(sp, 'tier') as Tier | undefined
  const status = one(sp, 'status') as AgentStatus | undefined
  const sort = one(sp, 'sort') ?? 'active'
  const view = one(sp, 'view') ?? 'table'
  const stats = networkStats()

  let rows = agents
  if (swarm) rows = rows.filter((a) => a.swarm === swarm)
  if (tier) rows = rows.filter((a) => a.tier === tier)
  if (status) rows = rows.filter((a) => a.status === status)
  rows = [...rows].sort((a, b) => {
    if (sort === 'inferences') return b.inferences - a.inferences
    if (sort === 'tokens') return b.tokensIn + b.tokensOut - (a.tokensIn + a.tokensOut)
    if (sort === 'memory') return b.memoryBytes - a.memoryBytes
    if (sort === 'newest') return b.spawnHeight - a.spawnHeight
    if (sort === 'coherence') return b.coherence - a.coherence
    return b.lastActive - a.lastActive
  })

  const pages = Math.max(1, Math.ceil(rows.length / PAGE))
  const page = pageOf(sp, pages)
  const slice = rows.slice((page - 1) * PAGE, page * PAGE)
  const href = (patch: Record<string, string | undefined>) => buildHref('/agents', sp, { p: undefined, ...patch })

  return (
    <div className="flex flex-col gap-2">
      <div className="panel">
        <div className="grid grid-cols-2 sm:grid-cols-4">
          <Stat label="agents" value={num(stats.agents)} sub="alive on chain" />
          <Stat label="thinking now" value={num(stats.thinking)} sub="open inference slots" />
          <Stat label="24h tokens" value={tok(stats.tokens24h)} sub="through these agents" />
          <Stat label="halted" value={num(stats.halted)} sub="retired by their operators" />
        </div>
      </div>

      <Panel
        title="agents"
        right={
          <span className="flex items-center gap-1">
            <Btn href={href({ view: undefined })} on={view === 'table'}>
              table
            </Btn>
            <Btn href={href({ view: 'grid' })} on={view === 'grid'}>
              glyphs
            </Btn>
          </span>
        }
      >
        <div className="flex flex-col gap-1 border-b border-line bg-surface-2 px-2 py-1 font-mono text-[10px]">
          <div className="flex flex-wrap items-center gap-1">
            <span className="w-[52px] text-muted-foreground">swarm</span>
            <Btn href={href({ swarm: undefined })} on={!swarm}>
              all
            </Btn>
            {swarms.map((s) => (
              <Btn key={s.slug} href={href({ swarm: s.slug })} on={swarm === s.slug}>
                {s.symbol}
              </Btn>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-1">
            <span className="w-[52px] text-muted-foreground">tier</span>
            <Btn href={href({ tier: undefined })} on={!tier}>
              all
            </Btn>
            {TIERS.map((t) => (
              <Btn key={t} href={href({ tier: t })} on={tier === t}>
                {t}
              </Btn>
            ))}
            <span className="ml-3 w-[52px] text-muted-foreground">status</span>
            <Btn href={href({ status: undefined })} on={!status}>
              all
            </Btn>
            {STATUSES.map((s) => (
              <Btn key={s} href={href({ status: s })} on={status === s}>
                {s}
              </Btn>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-1">
            <span className="w-[52px] text-muted-foreground">sort</span>
            {[
              ['active', 'last active'],
              ['inferences', 'inferences'],
              ['tokens', 'tokens'],
              ['memory', 'memory'],
              ['coherence', 'coherence'],
              ['newest', 'newest'],
            ].map(([k, label]) => (
              <Btn key={k} href={href({ sort: k === 'active' ? undefined : k })} on={sort === k}>
                {label}
              </Btn>
            ))}
          </div>
        </div>
        {view === 'grid' ? <AgentGrid agents={slice} size={48} /> : <AgentsTable agents={slice} />}
        <Pager page={page} pages={pages} total={rows.length} unit="agents" build={(p) => buildHref('/agents', sp, { p: String(p) })} />
        <PanelNote>
          an agent&apos;s glyph is a 5x5 hash of its address {'\u00b7'} coherence is the rarity of its
          parameter set within its swarm
        </PanelNote>
      </Panel>
    </div>
  )
}
