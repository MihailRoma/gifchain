import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CopyButton } from '@/components/copy-button'
import {
  AddressLink,
  AgentGlyph,
  Bars,
  Btn,
  DetailList,
  HashLink,
  Panel,
  PanelNote,
  Stat,
  StatusDot,
  SwarmLink,
  TierChip,
} from '@/components/kit'
import { Age } from '@/components/live/age'
import { AgentGrid, EventsTable } from '@/components/tables'
import { agentHistory, getAgent, getSwarm, relatedAgents } from '@/lib/chain/data'
import { bytes, num, tok, utc } from '@/lib/chain/format'

type Params = Promise<{ swarm: string; id: string }>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { swarm, id } = await params
  const agent = getAgent(swarm, parseInt(id, 10))
  if (!agent) return { title: 'Agent not found' }
  return {
    title: agent.name,
    description: `${agent.name} \u00b7 ${agent.tier} ${agent.role.toLowerCase()} in ${getSwarm(swarm)?.name} \u00b7 ${num(agent.inferences)} inferences`,
  }
}

export default async function AgentPage({ params }: { params: Params }) {
  const { swarm: slug, id } = await params
  const agent = getAgent(slug, parseInt(id, 10))
  const swarm = getSwarm(slug)
  if (!agent || !swarm) notFound()

  const history = agentHistory(agent.key)
  const related = relatedAgents(agent, 24)
  const prompts = history.filter((e) => e.type === 'PROMPT').length
  const completions = history.filter((e) => e.type === 'COMPLETION').length
  const memories = history.filter((e) => e.type === 'MEMORY').length
  const prev = getAgent(slug, agent.id - 1)
  const next = getAgent(slug, agent.id + 1)

  return (
    <div className="flex flex-col gap-2">
      <Panel
        tone={agent.halted ? 'plain' : 'clay'}
        title={
          <>
            <SwarmLink slug={slug} /> / {agent.name}
          </>
        }
        right={
          <span className="flex items-center gap-1">
            <Btn href={prev ? `/agent/${slug}/${prev.id}` : '#'} disabled={!prev}>
              prev
            </Btn>
            <Btn href={next ? `/agent/${slug}/${next.id}` : '#'} disabled={!next}>
              next
            </Btn>
          </span>
        }
      >
        <div className="flex flex-col gap-2 p-2 md:flex-row">
          <div className="flex flex-col items-center gap-2 md:w-[260px]">
            <div className="w-full border border-line bg-ink p-3">
              <AgentGlyph agent={agent} fluid className="w-full" />
            </div>
            <div className="flex w-full flex-wrap items-center justify-between gap-1 font-mono text-[10px]">
              <StatusDot status={agent.status} />
              <TierChip tier={agent.tier} />
              <span className="text-muted-foreground">{agent.role}</span>
            </div>
            <div className="w-full border border-hair bg-surface-2 p-2 font-mono text-[10.5px] leading-relaxed">
              <div className="text-[9px] uppercase tracking-[0.08em] text-muted-foreground">mandate</div>
              <p className="mt-1">{swarm.mandate}</p>
            </div>
          </div>
          <div className="flex-1">
            <h1 className="font-mono text-[20px] font-bold leading-tight tracking-[-0.02em]">
              {agent.name}
              {agent.halted ? <span className="ml-2 chip bg-ink text-muted-foreground">halted</span> : null}
            </h1>
            <p className="mt-1 max-w-[70ch] text-[12px] leading-relaxed text-muted-foreground">
              {agent.tier === 'opus' ? 'An opus-tier' : agent.tier === 'sonnet' ? 'A sonnet-tier' : 'A haiku-tier'}{' '}
              {agent.role.toLowerCase()} in {swarm.name}. {swarm.description}
            </p>
            <div className="mt-2 grid grid-cols-2 border border-hair sm:grid-cols-4">
              <Stat label="inferences" value={num(agent.inferences)} sub="lifetime" />
              <Stat label="tokens in" value={tok(agent.tokensIn)} sub="prompted" />
              <Stat label="tokens out" value={tok(agent.tokensOut)} sub="completed" />
              <Stat label="memory" value={bytes(agent.memoryBytes)} sub={agent.traits[2].value.toLowerCase()} />
            </div>
            <DetailList
              rows={[
                ['agent address', <span key="a" className="flex items-center gap-2"><span className="font-mono">{agent.address}</span><CopyButton value={agent.address} /></span>],
                ['operator', <AddressLink key="o" address={agent.operator} len={12} />],
                ['swarm contract', <HashLink key="c" href={`/swarms/${slug}?tab=contract`} value={swarm.contract} head={14} tail={8} />],
                ['standard', swarm.standard],
                ['context window', `${num(agent.contextWindow)} tokens`],
                ['temperature', agent.temperature.toFixed(2)],
                ['memory root', <span key="m" className="font-mono">{agent.memoryRoot}</span>],
                ['spawned', <span key="s">block <Link href={`/block/${agent.spawnHeight}`} className="font-mono">{num(agent.spawnHeight)}</Link> {'\u00b7'} <Age ts={agent.spawnTs} long /> {'\u00b7'} {utc(agent.spawnTs)}</span>],
                ['spawn tx', <HashLink key="h" href={`/tx/${agent.spawnHash}`} value={agent.spawnHash} head={14} tail={8} />],
                ['last active', <Link key="l" href={`/block/${agent.lastActive}`} className="font-mono">block {num(agent.lastActive)}</Link>],
                ['coherence', `${agent.coherence} \u00b7 rank ${agent.rank} of ${swarm.agents} in swarm`],
                ['tools', swarm.tools.join(', ')],
              ]}
            />
          </div>
        </div>
      </Panel>

      <div className="grid gap-2 lg:grid-cols-[2fr_3fr]">
        <Panel title="parameters" right={<span className="font-mono text-[10px] normal-case">share within swarm</span>}>
          <Bars
            rows={agent.traits.map((t) => ({
              label: (
                <span>
                  <span className="text-muted-foreground">{t.trait}</span> <span className="font-bold">{t.value}</span>
                </span>
              ),
              value: t.share,
              max: 60,
              right: `${t.share}%`,
            }))}
          />
          <PanelNote>
            parameters are fixed at spawn and committed to the swarm contract; only memory changes
            afterwards
          </PanelNote>
        </Panel>
        <Panel
          title="indexed activity"
          right={
            <span className="font-mono text-[10px] normal-case text-muted-foreground">
              {prompts} prompts {'\u00b7'} {completions} completions {'\u00b7'} {memories} memory writes
            </span>
          }
        >
          {history.length ? (
            <EventsTable events={history.slice(0, 40)} showAgent={false} showThumb={false} />
          ) : (
            <p className="p-2 font-mono text-[11px] text-muted-foreground">
              no activity inside the indexed window; the agent&apos;s lifetime counters above come
              from the memory module
            </p>
          )}
        </Panel>
      </div>

      <Panel
        title={`more from ${swarm.name}`}
        right={
          <Link href={`/swarms/${slug}`} className="font-mono text-[10px]">
            view swarm
          </Link>
        }
      >
        <AgentGrid agents={related} size={40} />
      </Panel>
    </div>
  )
}
