import Link from 'next/link'
import {
  getAgentByKey,
  type Agent,
  type Block,
  type ChainEvent,
  type Swarm,
  type SwarmStats,
} from '@/lib/chain/data'
import { bytes, claude, dec, num, tok, trunc } from '@/lib/chain/format'
import { Age } from './live/age'
import {
  AddressLink,
  AgentGlyph,
  AgentThumbLink,
  Chip,
  HashLink,
  StatusDot,
  SwarmLink,
  Table,
  TierChip,
} from './kit'

export function BlocksTable({ blocks, compact = false }: { blocks: Block[]; compact?: boolean }) {
  return (
    <Table>
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
          <tr key={b.height}>
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
            <td className="num">{b.tokens ? tok(b.tokens) : <span className="text-muted-foreground">{'\u2014'}</span>}</td>
            {!compact && <td className="num">{num(b.gasUsed)}</td>}
            {!compact && <td className="num">{num(b.size)} B</td>}
            <td className="num">{dec(b.fees, 4)}</td>
            <td className="text-muted-foreground">{b.sequencer}</td>
            <td>
              <span className="flex items-center gap-[2px]">
                {b.events
                  .filter((e) => e.agentKey)
                  .slice(0, 6)
                  .map((e) => {
                    const a = getAgentByKey(e.agentKey!)
                    return a ? <AgentThumbLink key={e.hash} agent={a} size={18} /> : null
                  })}
                {b.events.filter((e) => e.agentKey).length === 0 ? (
                  <span className="text-muted-foreground">{'\u2014'}</span>
                ) : null}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  )
}

export function EventsTable({
  events,
  showBlock = true,
  showAgent = true,
  showThumb = true,
  showHash = true,
}: {
  events: ChainEvent[]
  showBlock?: boolean
  showAgent?: boolean
  showThumb?: boolean
  showHash?: boolean
}) {
  return (
    <Table>
      <thead>
        <tr>
          <th>action</th>
          {showHash && <th>tx hash</th>}
          {showThumb && <th aria-label="glyph" />}
          {showAgent && <th>agent</th>}
          <th>swarm</th>
          <th>from</th>
          <th>to</th>
          <th>value</th>
          {showBlock && <th>block</th>}
          <th>age</th>
        </tr>
      </thead>
      <tbody>
        {events.map((e) => {
          const a = e.agentKey ? getAgentByKey(e.agentKey) : null
          return (
            <tr key={e.hash}>
              <td>
                <Chip kind={e.status === 'failed' ? 'FAILED' : e.type}>
                  {e.status === 'failed' ? `${e.type} !` : e.type}
                </Chip>
              </td>
              {showHash && (
                <td>
                  <HashLink href={`/tx/${e.hash}`} value={e.hash} head={10} tail={6} />
                </td>
              )}
              {showThumb && (
                <td className="w-[26px] p-[2px]">{a ? <AgentThumbLink agent={a} size={22} /> : null}</td>
              )}
              {showAgent && (
                <td>
                  {a ? (
                    <Link href={`/agent/${a.swarm}/${a.id}`} className="font-mono">
                      {a.name}
                    </Link>
                  ) : (
                    <span className="text-muted-foreground">{'\u2014'}</span>
                  )}
                </td>
              )}
              <td>{e.swarm ? <SwarmLink slug={e.swarm} /> : <span className="text-muted-foreground">{'\u2014'}</span>}</td>
              <td>
                <AddressLink address={e.from} />
              </td>
              <td>
                <AddressLink address={e.to} />
              </td>
              <td className="num">
                {e.tokens !== null ? tok(e.tokens) : e.amount !== null ? claude(e.amount) : <span className="text-muted-foreground">{'\u2014'}</span>}
              </td>
              {showBlock && (
                <td>
                  <Link href={`/block/${e.height}`} className="font-mono">
                    {num(e.height)}
                  </Link>
                </td>
              )}
              <td className="num text-muted-foreground">
                <Age ts={e.ts} />
              </td>
            </tr>
          )
        })}
      </tbody>
    </Table>
  )
}

export function SwarmsTable({
  rows,
  offset = 0,
}: {
  rows: Array<Swarm & { stats: SwarmStats }>
  offset?: number
}) {
  return (
    <Table>
      <thead>
        <tr>
          <th>#</th>
          <th>swarm</th>
          <th>purpose</th>
          <th>standard</th>
          <th>24h infer</th>
          <th>24h</th>
          <th>24h tokens</th>
          <th>agents</th>
          <th>thinking</th>
          <th>operators</th>
          <th>halted</th>
          <th>contract</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((s, i) => (
          <tr key={s.slug}>
            <td className="num text-muted-foreground">{offset + i + 1}</td>
            <td>
              <Link href={`/swarms/${s.slug}`} className="font-mono">
                {s.name}
              </Link>{' '}
              {s.verified ? (
                <span className="chip bg-clay text-clay-foreground border-clay" title="reviewed by the code review council">
                  v
                </span>
              ) : null}
            </td>
            <td className="text-muted-foreground">{s.category}</td>
            <td className="text-muted-foreground">{s.standard}</td>
            <td className="num">{num(s.stats.inferences24h)}</td>
            <td className={`num ${s.stats.change24h < 0 ? 'text-destructive' : ''}`}>
              {s.stats.change24h > 0 ? '+' : ''}
              {s.stats.change24h}%
            </td>
            <td className="num">{tok(s.stats.tokens24h)}</td>
            <td className="num">{s.stats.active}</td>
            <td className="num">{s.stats.thinking}</td>
            <td className="num">{s.stats.operators}</td>
            <td className="num">{s.stats.halted}</td>
            <td>
              <HashLink href={`/swarms/${s.slug}?tab=contract`} value={s.contract} head={8} tail={4} />
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  )
}

export function AgentsTable({ agents, showSwarm = true }: { agents: Agent[]; showSwarm?: boolean }) {
  if (agents.length === 0) {
    return <p className="p-2 font-mono text-[11px] text-muted-foreground">no agents</p>
  }
  return (
    <Table>
      <thead>
        <tr>
          <th aria-label="glyph" />
          <th>agent</th>
          {showSwarm && <th>swarm</th>}
          <th>tier</th>
          <th>role</th>
          <th>status</th>
          <th>inferences</th>
          <th>tokens</th>
          <th>memory</th>
          <th>operator</th>
          <th>last active</th>
        </tr>
      </thead>
      <tbody>
        {agents.map((a) => (
          <tr key={a.key}>
            <td className="w-[26px] p-[2px]">
              <AgentThumbLink agent={a} size={22} />
            </td>
            <td>
              <Link href={`/agent/${a.swarm}/${a.id}`} className="font-mono">
                {a.name}
              </Link>
            </td>
            {showSwarm && (
              <td>
                <SwarmLink slug={a.swarm} />
              </td>
            )}
            <td>
              <TierChip tier={a.tier} />
            </td>
            <td className="text-muted-foreground">{a.role}</td>
            <td>
              <StatusDot status={a.status} />
            </td>
            <td className="num">{num(a.inferences)}</td>
            <td className="num">{tok(a.tokensIn + a.tokensOut)}</td>
            <td className="num">{bytes(a.memoryBytes)}</td>
            <td>
              <AddressLink address={a.operator} />
            </td>
            <td className="num text-muted-foreground">
              <Link href={`/block/${a.lastActive}`} className="font-mono">
                {num(a.lastActive)}
              </Link>
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  )
}

export function AgentGrid({
  agents,
  size = 56,
  showLabels = true,
  fill = false,
}: {
  agents: Agent[]
  size?: number
  showLabels?: boolean
  /**
   * Fill the panel edge to edge: a gapless fixed-column grid with glyphs that
   * scale to the column width, so the box always squares off with no ragged
   * last row. Feed it a count divisible by the column counts below.
   */
  fill?: boolean
}) {
  if (agents.length === 0) {
    return <p className="p-2 font-mono text-[11px] text-muted-foreground">no agents</p>
  }

  if (fill) {
    return (
      <div className="grid grid-cols-6 sm:grid-cols-8 lg:grid-cols-12">
        {agents.map((a) => (
          <Link
            key={a.key}
            href={`/agent/${a.swarm}/${a.id}`}
            className="group block border-b border-r border-hair no-underline last:border-r hover:bg-transparent"
            title={`${a.name}${a.halted ? ' (halted)' : ''} \u00b7 ${a.tier} \u00b7 ${a.status}`}
          >
            <AgentGlyph agent={a} fluid className="border-0" />
          </Link>
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-wrap gap-[3px] p-2">
      {agents.map((a) => (
        <Link
          key={a.key}
          href={`/agent/${a.swarm}/${a.id}`}
          className="block shrink-0 no-underline hover:bg-transparent"
          title={`${a.name}${a.halted ? ' (halted)' : ''} \u00b7 ${a.tier} \u00b7 ${a.status}`}
        >
          <span className="block border border-line bg-surface p-[1px]">
            <AgentGlyph agent={a} size={size} />
            {showLabels ? (
              <span className="block text-center font-mono text-[9px] leading-[12px] text-muted-foreground">
                {String(a.id).padStart(4, '0')}
              </span>
            ) : null}
          </span>
        </Link>
      ))}
    </div>
  )
}

export function AddressCell({ address }: { address: string }) {
  return <span className="font-mono">{trunc(address, 8, 6)}</span>
}
