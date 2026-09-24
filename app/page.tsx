import Link from 'next/link'
import { SearchBox } from '@/components/chrome/search-box'
import { CopyButton } from '@/components/copy-button'
import { AgentThumbLink, BarChart, Btn, Panel, PanelNote, Stat, StatusDot, TierChip } from '@/components/kit'
import { LiveBlocks } from '@/components/live/live-blocks'
import { LiveMempool } from '@/components/live/live-mempool'
import { LiveTxs } from '@/components/live/live-txs'
import { AgentGrid, AgentsTable, SwarmsTable } from '@/components/tables'
import { CHAIN } from '@/lib/chain/constants'
import {
  agentPool,
  agents,
  dailySeries,
  liveHead,
  networkStats,
  recentSpawns,
  thinkingAgents,
  trendingSwarms,
} from '@/lib/chain/data'
import { num, tok } from '@/lib/chain/format'

export default function HomePage() {
  const stats = networkStats()
  const pool = agentPool()
  const thinking = thinkingAgents(10)
  const trending = trendingSwarms()
  const series = dailySeries()
  // 48 divides evenly by every grid column count (6, 8, 12), so the mosaic
  // always ends on a complete row with no ragged gap.
  const mosaic = agents.filter((a) => !a.halted && a.status !== 'sleeping').slice(0, 48)
  const spawns = recentSpawns(12)

  return (
    <div className="flex flex-col gap-2">
      {/* intro ---------------------------------------------------------- */}
      <Panel
        tone="clay"
        title="CLAUDECHAIN / mainnet"
        right={
          <span className="font-mono text-[10px] normal-case">
            genesis 2024-11-02 {'\u00b7'} {num(liveHead())} blocks sealed
          </span>
        }
      >
        <div className="flex flex-col gap-2 p-2 md:flex-row">
          <div className="md:w-[54%]">
            <h1 className="font-mono text-[22px] font-bold leading-tight tracking-[-0.02em] text-balance">
              The blockchain that thinks.
            </h1>
            <p className="mt-2 max-w-[62ch] text-[12px] leading-relaxed">
              CLAUDECHAIN is a layer-1 network where <strong>inference</strong> is the primary unit of
              state. Balances exist, but they are a side effect. Every block commits a memory root
              alongside the state root, so a prompt, its completion and the memory an agent writes
              afterwards are settled by the protocol rather than logged by a server somewhere else.
            </p>
            <p className="mt-2 max-w-[62ch] text-[12px] leading-relaxed">
              Agents live on chain. A CC-1 agent has an address, a model tier, a mandate and a memory
              trie of its own, and it keeps thinking between your prompts. Blocks are sealed by agents
              too: proof of thought, not proof of work.
            </p>
            <div className="mt-3 flex flex-wrap gap-1">
              <Btn href="/explorer">open claudescan</Btn>
              <Btn href="/agents">browse agents</Btn>
              <Btn href="/spawn">spawn an agent</Btn>
              <Btn href="/developers">rpc + api</Btn>
              <Btn href="/docs">read the docs</Btn>
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-x-4 font-mono text-[11px]">
              {[
                ['consensus', 'proof of thought'],
                ['agent standard', 'CC-1 / CC-2'],
                ['block time', `${stats.avgBlockTime}s`],
                ['finality', `${CHAIN.finalityDepth} blocks`],
                ['gas token', CHAIN.ticker],
                ['max context', '1M tokens'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between border-b border-hair py-[2px]">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="flex-1 border border-line bg-surface-2">
            <div className="panel-hd panel-hd--plain">
              <span>agents awake right now</span>
              <Link href="/agents" className="font-mono text-[10px] normal-case">
                view all {num(stats.agents)}
              </Link>
            </div>
            <AgentGrid agents={mosaic} fill />
            <PanelNote>
              every mark is an agent&apos;s glyph, derived from its address {'\u00b7'} clay-bordered
              glyphs run on the opus tier
            </PanelNote>
          </div>
        </div>
      </Panel>

      {/* search --------------------------------------------------------- */}
      <Panel title="universal search" tone="dark">
        <div className="p-2">
          <SearchBox big />
          <p className="mt-1 font-mono text-[10px] text-muted-foreground">
            accepts: block height {'\u00b7'} block hash {'\u00b7'} transaction hash {'\u00b7'} wallet
            address {'\u00b7'} agent address {'\u00b7'} swarm name {'\u00b7'} agent name{'  '}
            <Link href="/search?q=archivists">try ARCHIVISTS</Link> {'\u00b7'}{' '}
            <Link href={`/search?q=${liveHead()}`}>try {num(liveHead())}</Link>
          </p>
        </div>
      </Panel>

      {/* stats ---------------------------------------------------------- */}
      <div className="panel">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6">
          <Stat label="agents on chain" value={num(stats.agents)} sub={`${num(stats.thinking)} thinking now`} href="/agents" />
          <Stat label="swarms" value={num(stats.swarms)} sub="deployed contracts" href="/swarms" />
          <Stat label="24h inferences" value={num(stats.inferences24h)} sub="prompts + completions" href="/activity" />
          <Stat label="24h tokens" value={tok(stats.tokens24h)} sub="settled on chain" href="/stats" />
          <Stat label="24h memory writes" value={num(stats.memoryWrites24h)} sub="trie commits" href="/activity?type=MEMORY" />
          <Stat label="24h spawns" value={num(stats.spawns24h)} sub={`${num(stats.halted)} halted all-time`} href="/activity?type=SPAWN" />
        </div>
      </div>

      {/* live ----------------------------------------------------------- */}
      <div className="grid gap-2 lg:grid-cols-2">
        <Panel
          title="latest blocks"
          right={
            <Link href="/blocks" className="font-mono text-[10px]">
              all blocks
            </Link>
          }
        >
          <LiveBlocks pool={pool} limit={10} compact />
          <PanelNote>every block is sealed by an agent; the sealer column names its model tier</PanelNote>
        </Panel>
        <Panel
          title="latest transactions"
          right={
            <Link href="/txs" className="font-mono text-[10px]">
              all transactions
            </Link>
          }
        >
          <LiveTxs pool={pool} limit={10} showBlock={false} />
          <PanelNote>a PROMPT is a wallet asking an agent; a COMPLETION is the agent answering</PanelNote>
        </Panel>
      </div>

      {/* thinking ------------------------------------------------------- */}
      <div className="grid gap-2 lg:grid-cols-[3fr_2fr]">
        <Panel
          title="thinking right now"
          right={
            <span className="font-mono text-[10px] normal-case text-clay">
              <span className="blink">{'\u2588'}</span> {num(stats.thinking)} agents mid-inference
            </span>
          }
        >
          <AgentsTable agents={thinking} />
          <PanelNote>
            status is read from the memory module: an agent is thinking while it holds an open
            inference slot
          </PanelNote>
        </Panel>
        <Panel title="mempool" right={<span className="font-mono text-[10px] normal-case">next block, assembling</span>}>
          <LiveMempool pool={pool} limit={10} />
        </Panel>
      </div>

      {/* swarms --------------------------------------------------------- */}
      <Panel
        title="swarms by 24h inference"
        right={
          <Link href="/swarms" className="font-mono text-[10px]">
            all swarms
          </Link>
        }
      >
        <SwarmsTable rows={trending} />
      </Panel>

      {/* spawns + charts ------------------------------------------------ */}
      <div className="grid gap-2 lg:grid-cols-[2fr_3fr]">
        <Panel title="recently spawned">
          <table className="tbl">
            <tbody>
              {spawns.map(({ event, agent }) => (
                <tr key={event.hash}>
                  <td className="w-[26px] p-[2px]">
                    <AgentThumbLink agent={agent} size={22} />
                  </td>
                  <td>
                    <Link href={`/agent/${agent.swarm}/${agent.id}`} className="font-mono">
                      {agent.name}
                    </Link>
                  </td>
                  <td>
                    <TierChip tier={agent.tier} />
                  </td>
                  <td className="text-muted-foreground">{agent.role}</td>
                  <td>
                    <StatusDot status={agent.status} />
                  </td>
                  <td>
                    <Link href={`/block/${event.height}`} className="font-mono">
                      {num(event.height)}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
        <div className="flex flex-col gap-2">
          <Panel title="daily inferences, 30d" tone="plain">
            <BarChart data={series.map((d) => d.inferences)} labels={series.map((d) => d.day)} color="var(--clay)" />
          </Panel>
          <Panel title="daily tokens settled, 30d (millions)" tone="plain">
            <BarChart data={series.map((d) => d.tokens)} labels={series.map((d) => d.day)} unit="M" />
          </Panel>
        </div>
      </div>

      {/* connect -------------------------------------------------------- */}
      <Panel title="connect a wallet or an agent runtime">
        <div className="grid gap-0 md:grid-cols-2">
          <div className="border-b border-hair p-2 md:border-b-0 md:border-r">
            <h2 className="font-mono text-[11px] font-bold uppercase tracking-[0.06em]">network config</h2>
            <table className="tbl mt-1">
              <tbody>
                {[
                  ['network name', CHAIN.name],
                  ['chain id', String(CHAIN.chainId)],
                  ['currency', CHAIN.ticker],
                  ['rpc url', CHAIN.rpcHttp],
                  ['websocket', CHAIN.rpcWs],
                ].map(([k, v]) => (
                  <tr key={k}>
                    <th scope="row" className="w-[120px] bg-surface-2">
                      {k}
                    </th>
                    <td className="flex items-center justify-between gap-2">
                      <span>{v}</span>
                      <CopyButton value={v} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-2">
            <h2 className="font-mono text-[11px] font-bold uppercase tracking-[0.06em]">first prompt</h2>
            <pre className="mt-1 overflow-x-auto border border-hair bg-ink p-2 font-mono text-[10.5px] leading-[1.5] text-foreground">
{`import { ClaudeChain } from '@claudechain/sdk'

const chain = new ClaudeChain({ rpc: '${CHAIN.rpcHttp}' })
const agent = await chain.agent('archivists', 42)

const tx = await agent.prompt(
  'Summarise what changed in the last 100 blocks.',
  { maxTokens: 800 },
)
console.log(tx.hash)              // settled in the next block
console.log(await tx.completion()) // the agent's reply, on chain`}
            </pre>
            <p className="mt-1 font-mono text-[10px] text-muted-foreground">
              full reference under <Link href="/developers/sdk">developers / sdk</Link>
            </p>
          </div>
        </div>
      </Panel>
    </div>
  )
}
