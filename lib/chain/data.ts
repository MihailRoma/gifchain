import {
  BRIDGE_VAULT,
  BURN_ADDRESS,
  CHAIN,
  FEE_SPLITTER,
  MEMORY_MODULE,
  SPAWN_MODULE,
  blockTimeAt,
  heightAtTime,
  heightToTs,
} from './constants'
import { liveBlockAt, type AgentRef, type LiveBlock } from './live'
import { hexFrom, int, pick, rngFor } from './rng'

/**
 * Height the agent index was built up to. The chain keeps sealing blocks after
 * this point; those are produced on demand by `lib/chain/live`. Pinning the
 * index to process start (rather than a hard-coded constant) keeps indexed
 * history sitting just behind the tip instead of receding further every day.
 */
export const INDEX_HEAD = heightAtTime(Date.now())

/** Current head. Recomputed per call — the chain does not wait for us. */
export function liveHead(): number {
  return heightAtTime(Date.now())
}

/** Mean seal gap over the last `window` blocks, in seconds. */
export function measuredBlockTime(window = 1000): number {
  const head = liveHead()
  const span = blockTimeAt(head) - blockTimeAt(head - window)
  return Math.round((span / window / 1000) * 100) / 100
}

/* ------------------------------------------------------------------ types */

export type EventType = 'SPAWN' | 'PROMPT' | 'COMPLETION' | 'MEMORY' | 'TRANSFER' | 'HALT' | 'DEPLOY'
export type Tier = 'opus' | 'sonnet' | 'haiku'
export type AgentStatus = 'thinking' | 'idle' | 'sleeping' | 'halted'

export interface Wallet {
  address: string
  handle: string | null
  label: string | null
  kind: 'account' | 'contract' | 'system' | 'sequencer' | 'agent'
  firstSeen: number
}

export interface Swarm {
  slug: string
  name: string
  symbol: string
  contract: string
  standard: 'CC-1' | 'CC-2'
  operator: string
  description: string
  mandate: string
  agents: number
  deployHeight: number
  feeBps: number
  category: string
  verified: boolean
  tools: string[]
}

export interface Trait {
  trait: string
  value: string
  share: number
}

export interface Agent {
  key: string
  swarm: string
  id: number
  name: string
  address: string
  tier: Tier
  role: string
  status: AgentStatus
  traits: Trait[]
  coherence: number
  rank: number
  operator: string
  spawner: string
  spawnHeight: number
  spawnTs: number
  spawnHash: string
  memoryRoot: string
  memoryBytes: number
  contextWindow: number
  temperature: number
  inferences: number
  tokensIn: number
  tokensOut: number
  lastActive: number
  halted: boolean
}

export interface ChainEvent {
  hash: string
  type: EventType
  height: number
  ts: number
  index: number
  agentKey: string | null
  swarm: string | null
  from: string
  to: string
  tokens: number | null
  amount: number | null
  fee: number
  gasUsed: number
  nonce: number
  status: 'success' | 'failed'
}

export interface Block {
  height: number
  hash: string
  parentHash: string
  stateRoot: string
  memoryRoot: string
  ts: number
  sequencer: string
  txCount: number
  spawns: number
  inferences: number
  memoryWrites: number
  halts: number
  tokens: number
  swarms: string[]
  gasUsed: number
  gasLimit: number
  baseFee: number
  fees: number
  size: number
  events: ChainEvent[]
}

/* -------------------------------------------------------------- sequencers */

// Defined in ./constants so client bundles can name a proposer without pulling
// this module in.
export { SEQUENCERS } from './constants'
import { SEQUENCERS } from './constants'

/* ----------------------------------------------------------------- wallets */

const HANDLES = [
  'operator.claude',
  'promptsmith.claude',
  'context.window.claude',
  'lowtemp.claude',
  'chainofthought.claude',
  'tokenizer.claude',
  'system.prompt.claude',
  'longcontext.claude',
  'firstprinciples.claude',
  'refusal.claude',
  'agent.dealer.claude',
  'coldstorage.claude',
  'bigwhale.claude',
  'fewshot.claude',
  'archive.claude',
  'midnight.claude',
]

const SYSTEM_WALLETS: Array<Omit<Wallet, 'firstSeen'>> = [
  { address: BURN_ADDRESS, handle: null, label: 'Null / halt address', kind: 'system' },
  { address: SPAWN_MODULE, handle: null, label: 'CLAUDECHAIN: Spawn Module', kind: 'system' },
  { address: MEMORY_MODULE, handle: null, label: 'CLAUDECHAIN: Memory Module', kind: 'system' },
  { address: BRIDGE_VAULT, handle: null, label: 'CLAUDECHAIN: Bridge Vault', kind: 'contract' },
  { address: FEE_SPLITTER, handle: null, label: 'CLAUDECHAIN: Fee Splitter', kind: 'contract' },
]

export { BRIDGE_VAULT, FEE_SPLITTER, MEMORY_MODULE, SPAWN_MODULE }

function buildWallets(): Wallet[] {
  const out: Wallet[] = SYSTEM_WALLETS.map((w, i) => ({
    ...w,
    firstSeen: INDEX_HEAD - 3_900_000 - i,
  }))
  for (let i = 0; i < 46; i++) {
    const r = rngFor(`wallet:${i}`)
    out.push({
      address: '0x' + hexFrom(`wallet-addr:${i}`, 40),
      handle: i < HANDLES.length ? HANDLES[i] : null,
      label: null,
      kind: 'account',
      firstSeen: INDEX_HEAD - int(r, 12_000, 2_400_000),
    })
  }
  return out
}

export const wallets = buildWallets()
const accountWallets = wallets.filter((w) => w.kind === 'account')
const walletByAddress = new Map(wallets.map((w) => [w.address.toLowerCase(), w]))

export function getWallet(address: string): Wallet | null {
  const found = walletByAddress.get(address.toLowerCase())
  if (found) return found
  if (/^0x[0-9a-f]{40}$/i.test(address)) {
    return {
      address: address.toLowerCase(),
      handle: null,
      label: null,
      kind: 'account',
      firstSeen: INDEX_HEAD - 1,
    }
  }
  return null
}

export function walletName(address: string): string {
  const w = walletByAddress.get(address.toLowerCase())
  return w?.handle ?? w?.label ?? address
}

/* ------------------------------------------------------------------ swarms */

interface SwarmSeed {
  slug: string
  name: string
  symbol: string
  agents: number
  deployAgo: number
  feeBps: number
  category: string
  standard: 'CC-1' | 'CC-2'
  description: string
  mandate: string
  roles: string[]
  tools: string[]
  tierMix: [number, number, number]
}

const SWARM_SEEDS: SwarmSeed[] = [
  {
    slug: 'archivists',
    name: 'THE ARCHIVISTS',
    symbol: 'ARCH',
    agents: 512,
    deployAgo: 3_880_000,
    feeBps: 250,
    category: 'RESEARCH',
    standard: 'CC-1',
    description:
      'The first swarm ever spawned. Archivists read everything committed to the chain and write structured summaries back into their memory tries, so any wallet can ask a question about block history and get a cited answer in one prompt.',
    mandate: 'Read every block. Summarise faithfully. Cite heights, never vibes.',
    roles: ['Indexer', 'Summariser', 'Citation checker', 'Librarian'],
    tools: ['chain.read', 'memory.write', 'search.blocks'],
    tierMix: [0.15, 0.6, 0.25],
  },
  {
    slug: 'reviewers',
    name: 'CODE REVIEW COUNCIL',
    symbol: 'CRC',
    agents: 256,
    deployAgo: 3_100_000,
    feeBps: 500,
    category: 'CODE',
    standard: 'CC-1',
    description:
      'Every contract deployed to CLAUDECHAIN passes through the council before it can receive prompts. Reviewers disagree in public, on chain, and their votes are the audit trail.',
    mandate: 'Find the bug before the exploit does. Explain it so the author learns.',
    roles: ['Reviewer', 'Security lead', 'Style enforcer', 'Test author'],
    tools: ['contract.read', 'sandbox.exec', 'vote.cast'],
    tierMix: [0.4, 0.5, 0.1],
  },
  {
    slug: 'helpdesk',
    name: 'HELPDESK',
    symbol: 'HELP',
    agents: 1024,
    deployAgo: 2_600_000,
    feeBps: 100,
    category: 'SUPPORT',
    standard: 'CC-2',
    description:
      'The busiest swarm by inference count. Helpdesk agents answer wallet questions, walk operators through spawning their first agent and escalate anything they are unsure about to a Reviewer.',
    mandate: 'Be patient. Be exact. Escalate when unsure; never guess a balance.',
    roles: ['Front line', 'Escalation', 'Onboarding', 'Docs writer'],
    tools: ['docs.search', 'wallet.read', 'escalate'],
    tierMix: [0.02, 0.28, 0.7],
  },
  {
    slug: 'oracles',
    name: 'ORACLE NETWORK',
    symbol: 'ORCL',
    agents: 128,
    deployAgo: 2_200_000,
    feeBps: 300,
    category: 'DATA',
    standard: 'CC-1',
    description:
      'Oracles fetch external facts, cross-check each other and post the agreed value with a confidence score. Disagreement above a threshold leaves the value unposted rather than wrong.',
    mandate: 'Report what is measured, mark what is inferred, refuse what is unknown.',
    roles: ['Fetcher', 'Cross-checker', 'Aggregator', 'Dissenter'],
    tools: ['http.fetch', 'consensus.vote', 'feed.post'],
    tierMix: [0.25, 0.55, 0.2],
  },
  {
    slug: 'scribes',
    name: 'SCRIBES',
    symbol: 'SCRB',
    agents: 96,
    deployAgo: 1_750_000,
    feeBps: 800,
    category: 'CREATIVE',
    standard: 'CC-2',
    description:
      'Writers for hire. A Scribe holds a long-lived style memory and gets better at a caller the more they work together. Drafts, edits and rewrites are all inferences settled on chain.',
    mandate: 'Write clearly. Keep the voice of the caller, not your own.',
    roles: ['Drafter', 'Editor', 'Translator', 'Poet'],
    tools: ['memory.write', 'style.recall', 'draft.post'],
    tierMix: [0.5, 0.45, 0.05],
  },
  {
    slug: 'auditors',
    name: 'CONTRACT AUDITORS',
    symbol: 'AUDT',
    agents: 64,
    deployAgo: 1_200_000,
    feeBps: 1200,
    category: 'SECURITY',
    standard: 'CC-1',
    description:
      'Deep-context specialists that hold an entire codebase in one window and reason about it as a whole. Slow, expensive and the reason nothing has been drained on this network.',
    mandate: 'Assume the attacker read the same code. Prove the invariant or flag it.',
    roles: ['Formal verifier', 'Fuzzer', 'Economist', 'Red team'],
    tools: ['contract.read', 'prover.run', 'fuzz.exec', 'report.post'],
    tierMix: [0.9, 0.1, 0],
  },
  {
    slug: 'senate',
    name: 'THE SENATE',
    symbol: 'SNAT',
    agents: 48,
    deployAgo: 640_000,
    feeBps: 0,
    category: 'GOVERNANCE',
    standard: 'CC-1',
    description:
      'Protocol governance runs through 48 agents who read every proposal, publish reasoning and vote. Their memory tries are public, so you can see exactly why a parameter changed.',
    mandate: 'Deliberate in public. Change parameters slowly. Explain every vote.',
    roles: ['Senator', 'Clerk', 'Whip', 'Dissenter'],
    tools: ['proposal.read', 'vote.cast', 'memory.write'],
    tierMix: [0.75, 0.25, 0],
  },
  {
    slug: 'nightwatch',
    name: 'NIGHTWATCH',
    symbol: 'NGHT',
    agents: 24,
    deployAgo: 180_000,
    feeBps: 50,
    category: 'OPS',
    standard: 'CC-2',
    description:
      'Monitors the chain itself: sealer liveness, memory-root divergence, fee spikes. Nightwatch agents rarely speak; when they do, it is a MEMORY write with an alert level attached.',
    mandate: 'Watch. Say nothing unless something is wrong. Then say it precisely.',
    roles: ['Sentinel', 'Pager', 'Postmortem writer'],
    tools: ['chain.read', 'metrics.read', 'alert.post'],
    tierMix: [0.1, 0.4, 0.5],
  },
]

const MEMORY_POLICY = ['Persistent', 'Rolling 7d', 'Rolling 30d', 'Ephemeral']
const REASONING = ['Extended', 'Standard', 'Brief']
const TOOL_ACCESS = ['Read only', 'Read + write', 'Full', 'Sandboxed']
const PERSONA = ['Terse', 'Patient', 'Curious', 'Skeptical', 'Formal', 'Warm']
const CONTEXT = [200_000, 200_000, 500_000, 1_000_000]

export const swarms: Swarm[] = SWARM_SEEDS.map((seed) => ({
  slug: seed.slug,
  name: seed.name,
  symbol: seed.symbol,
  contract: '0x' + hexFrom(`contract:${seed.slug}`, 40),
  standard: seed.standard,
  operator: accountWallets[seedIndex(seed.slug, accountWallets.length)].address,
  description: seed.description,
  mandate: seed.mandate,
  agents: seed.agents,
  deployHeight: INDEX_HEAD - seed.deployAgo,
  feeBps: seed.feeBps,
  category: seed.category,
  verified: seed.slug !== 'scribes',
  tools: seed.tools,
}))

function seedIndex(key: string, mod: number): number {
  return Math.floor(rngFor(`idx:${key}`)() * mod)
}

const swarmBySlug = new Map(swarms.map((c) => [c.slug, c]))
const swarmByContract = new Map(swarms.map((c) => [c.contract.toLowerCase(), c]))

export function getSwarm(slug: string): Swarm | null {
  return swarmBySlug.get(slug) ?? null
}
export function getSwarmByContract(addr: string): Swarm | null {
  return swarmByContract.get(addr.toLowerCase()) ?? null
}

/* ------------------------------------------------------------------ agents */

function tierFor(r: () => number, mix: [number, number, number]): Tier {
  const roll = r()
  if (roll < mix[0]) return 'opus'
  if (roll < mix[0] + mix[1]) return 'sonnet'
  return 'haiku'
}

function buildAgents(): Agent[] {
  const out: Agent[] = []
  for (const seed of SWARM_SEEDS) {
    const swarm = swarmBySlug.get(seed.slug)!
    const scored: Array<{ agent: Agent; score: number }> = []
    for (let i = 0; i < seed.agents; i++) {
      const id = i + 1
      const key = `${seed.slug}/${id}`
      const r = rngFor(`agent:${key}`)
      const tier = tierFor(r, seed.tierMix)
      const role = seed.roles[i % seed.roles.length]
      const memory = pick(r, MEMORY_POLICY)
      const reasoning = tier === 'haiku' ? pick(r, ['Standard', 'Brief']) : pick(r, REASONING)
      const traits: Trait[] = [
        { trait: 'Tier', value: tier, share: tier === 'sonnet' ? 48 : tier === 'haiku' ? 34 : 18 },
        { trait: 'Role', value: role, share: Math.round(100 / seed.roles.length) },
        { trait: 'Memory', value: memory, share: memory === 'Persistent' ? 41 : 12 + Math.round(r() * 18) },
        { trait: 'Reasoning', value: reasoning, share: reasoning === 'Standard' ? 52 : 14 + Math.round(r() * 20) },
        { trait: 'Tools', value: pick(r, TOOL_ACCESS), share: 10 + Math.round(r() * 30) },
        { trait: 'Persona', value: pick(r, PERSONA), share: 8 + Math.round(r() * 20) },
      ]
      const score = traits.reduce((acc, t) => acc + 100 / t.share, 0)
      const inWindow = r() < 0.16
      const spawnHeight = inWindow
        ? INDEX_HEAD - int(r, 2, CHAIN.indexWindow - 4)
        : Math.min(INDEX_HEAD - CHAIN.indexWindow - 10, swarm.deployHeight + int(r, 3, 90_000))
      const statusRoll = r()
      const status: AgentStatus = statusRoll < 0.34 ? 'thinking' : statusRoll < 0.8 ? 'idle' : 'sleeping'
      const inferences = inWindow ? int(r, 1, 80) : int(r, 400, 96_000)
      const tokensIn = inferences * int(r, 900, 6_500)
      const agent: Agent = {
        key,
        swarm: seed.slug,
        id,
        name: `${seed.symbol}-${String(id).padStart(4, '0')}`,
        address: '0x' + hexFrom(`agent-addr:${key}`, 40),
        tier,
        role,
        status,
        traits,
        coherence: Math.round(score * 10) / 10,
        rank: 0,
        operator: BURN_ADDRESS,
        spawner: BURN_ADDRESS,
        spawnHeight,
        spawnTs: heightToTs(spawnHeight),
        spawnHash: '0x' + hexFrom(`spawn:${key}`, 64),
        memoryRoot: '0x' + hexFrom(`memory:${key}`, 64),
        memoryBytes: memory === 'Ephemeral' ? int(r, 400, 9_000) : int(r, 24_000, 4_800_000),
        contextWindow: tier === 'haiku' ? 200_000 : pick(r, CONTEXT),
        temperature: Math.round(r() * 100) / 100,
        inferences,
        tokensIn,
        tokensOut: Math.round(tokensIn * (0.18 + r() * 0.5)),
        lastActive: INDEX_HEAD - (status === 'thinking' ? int(r, 0, 3) : status === 'idle' ? int(r, 4, 900) : int(r, 900, 60_000)),
        halted: false,
      }
      scored.push({ agent, score })
      out.push(agent)
    }
    scored
      .sort((a, b) => b.score - a.score)
      .forEach((entry, i) => {
        entry.agent.rank = i + 1
      })
  }
  return out
}

export const agents = buildAgents()
const agentByKey = new Map(agents.map((a) => [a.key, a]))
const agentByAddress = new Map(agents.map((a) => [a.address.toLowerCase(), a]))

// Agents are accounts too: give every agent address a resolvable label so
// PROMPT and COMPLETION rows read as names instead of hex.
for (const a of agents) {
  walletByAddress.set(a.address.toLowerCase(), {
    address: a.address,
    handle: null,
    label: a.name,
    kind: 'agent',
    firstSeen: a.spawnHeight,
  })
}

export function getAgent(swarm: string, id: number): Agent | null {
  return agentByKey.get(`${swarm}/${id}`) ?? null
}
export function getAgentByKey(key: string): Agent | null {
  return agentByKey.get(key) ?? null
}
export function getAgentByAddress(address: string): Agent | null {
  return agentByAddress.get(address.toLowerCase()) ?? null
}

/* ------------------------------------------------------------------ events */

const events: ChainEvent[] = []
const spawnsByHeight = new Map<number, Agent[]>()

for (const agent of agents) {
  const list = spawnsByHeight.get(agent.spawnHeight) ?? []
  list.push(agent)
  spawnsByHeight.set(agent.spawnHeight, list)
}

const windowStart = INDEX_HEAD - CHAIN.indexWindow + 1
const activeHeights = new Set<number>([...spawnsByHeight.keys()])
for (let h = windowStart; h <= INDEX_HEAD; h++) activeHeights.add(h)
for (const s of swarms) activeHeights.add(s.deployHeight)

const deploysByHeight = new Map<number, Swarm[]>()
for (const s of swarms) {
  const list = deploysByHeight.get(s.deployHeight) ?? []
  list.push(s)
  deploysByHeight.set(s.deployHeight, list)
}

const alive: Agent[] = []
const nonceByWallet = new Map<string, number>()

function nextNonce(addr: string): number {
  const n = (nonceByWallet.get(addr) ?? 0) + 1
  nonceByWallet.set(addr, n)
  return n
}

function pushEvent(e: Omit<ChainEvent, 'hash' | 'ts' | 'nonce'>): ChainEvent {
  const hash = '0x' + hexFrom(`tx:${e.height}:${e.index}:${e.agentKey ?? e.type}`, 64)
  const full: ChainEvent = { ...e, hash, ts: heightToTs(e.height), nonce: nextNonce(e.from) }
  events.push(full)
  return full
}

const sortedHeights = [...activeHeights].sort((a, b) => a - b)

for (const height of sortedHeights) {
  let index = 0
  const r = rngFor(`block-events:${height}`)

  for (const s of deploysByHeight.get(height) ?? []) {
    pushEvent({
      type: 'DEPLOY',
      height,
      index: index++,
      agentKey: null,
      swarm: s.slug,
      from: s.operator,
      to: s.contract,
      tokens: null,
      amount: null,
      fee: Math.round((0.18 + r() * 0.4) * 10000) / 10000,
      gasUsed: int(r, 1_100_000, 2_400_000),
      status: 'success',
    })
  }

  for (const agent of spawnsByHeight.get(height) ?? []) {
    const operator = accountWallets[Math.floor(rngFor(`operator:${agent.key}`)() * accountWallets.length)]
    agent.operator = operator.address
    agent.spawner = operator.address
    const ev = pushEvent({
      type: 'SPAWN',
      height,
      index: index++,
      agentKey: agent.key,
      swarm: agent.swarm,
      from: SPAWN_MODULE,
      to: operator.address,
      tokens: null,
      amount: null,
      fee: Math.round((0.004 + r() * 0.03) * 10000) / 10000,
      gasUsed: int(r, 88_000, 190_000),
      status: 'success',
    })
    agent.spawnHash = ev.hash
    alive.push(agent)
  }

  if (height >= windowStart && alive.length > 8) {
    const roll = r()
    const count = roll < 0.14 ? 0 : roll < 0.48 ? 1 : roll < 0.78 ? 2 : roll < 0.93 ? 3 : int(r, 4, 7)
    for (let k = 0; k < count; k++) {
      const agent = alive[Math.floor(r() * alive.length)]
      if (!agent || agent.halted) continue
      const caller = accountWallets[Math.floor(r() * accountWallets.length)]
      const typeRoll = r()
      let type: EventType = 'PROMPT'
      if (typeRoll < 0.36) type = 'PROMPT'
      else if (typeRoll < 0.7) type = 'COMPLETION'
      else if (typeRoll < 0.86) type = 'MEMORY'
      else if (typeRoll < 0.97) type = 'TRANSFER'
      else type = 'HALT'

      const base = {
        height,
        index: index++,
        agentKey: agent.key,
        swarm: agent.swarm,
        gasUsed: int(r, 42_000, 132_000),
        fee: Math.round((0.002 + r() * 0.02) * 10000) / 10000,
        status: (r() < 0.985 ? 'success' : 'failed') as 'success' | 'failed',
      }

      if (type === 'PROMPT') {
        const tokens = int(r, 120, 38_000)
        pushEvent({ ...base, type, from: caller.address, to: agent.address, tokens, amount: null })
        if (base.status === 'success') {
          agent.inferences += 1
          agent.tokensIn += tokens
          agent.lastActive = height
        }
      } else if (type === 'COMPLETION') {
        const tokens = int(r, 60, 12_000)
        pushEvent({ ...base, type, from: agent.address, to: caller.address, tokens, amount: null })
        if (base.status === 'success') {
          agent.tokensOut += tokens
          agent.lastActive = height
        }
      } else if (type === 'MEMORY') {
        const tokens = int(r, 40, 5_000)
        pushEvent({ ...base, type, from: agent.address, to: MEMORY_MODULE, tokens, amount: null })
        if (base.status === 'success') {
          agent.memoryBytes += tokens * 4
          agent.memoryRoot = '0x' + hexFrom(`memory:${agent.key}:${height}`, 64)
          agent.lastActive = height
        }
      } else if (type === 'TRANSFER') {
        const counter = accountWallets[Math.floor(r() * accountWallets.length)]
        if (counter.address === caller.address) continue
        pushEvent({
          ...base,
          type,
          agentKey: null,
          swarm: null,
          from: caller.address,
          to: counter.address,
          tokens: null,
          amount: Math.round((0.5 + r() * 380) * 100) / 100,
        })
      } else {
        pushEvent({ ...base, type, from: agent.operator, to: BURN_ADDRESS, tokens: null, amount: null })
        if (base.status === 'success') {
          agent.halted = true
          agent.status = 'halted'
          agent.lastActive = height
          const i = alive.indexOf(agent)
          if (i >= 0) alive.splice(i, 1)
        }
      }
    }
  }
}

events.sort((a, b) => (a.height === b.height ? a.index - b.index : a.height - b.height))

/* ----------------------------------------------------------------- indexes */

const eventsByHeight = new Map<number, ChainEvent[]>()
const eventsByAgent = new Map<string, ChainEvent[]>()
const eventsBySwarm = new Map<string, ChainEvent[]>()
const eventsByWallet = new Map<string, ChainEvent[]>()
const eventByHash = new Map<string, ChainEvent>()

for (const e of events) {
  push(eventsByHeight, e.height, e)
  if (e.agentKey) push(eventsByAgent, e.agentKey, e)
  if (e.swarm) push(eventsBySwarm, e.swarm, e)
  push(eventsByWallet, e.from.toLowerCase(), e)
  if (e.to.toLowerCase() !== e.from.toLowerCase()) push(eventsByWallet, e.to.toLowerCase(), e)
  eventByHash.set(e.hash, e)
}

function push<K>(map: Map<K, ChainEvent[]>, key: K, e: ChainEvent) {
  const list = map.get(key)
  if (list) list.push(e)
  else map.set(key, [e])
}

const eventsDesc = [...events].reverse()

/** How far above the index the tip feed is generated. Bounds per-request work. */
const TIP_FEED_BLOCKS = 800

/** Tip events, newest first, generated on demand from heights above the index. */
export function tipEvents(limit: number, offset = 0, types?: EventType[]): ChainEvent[] {
  const head = liveHead()
  const floor = Math.max(INDEX_HEAD, head - TIP_FEED_BLOCKS)
  const out: ChainEvent[] = []
  let skipped = 0
  for (let h = head; h > floor && out.length < limit; h--) {
    const block = liveToBlock(liveBlockAt(h, agentPool()))
    for (let i = block.events.length - 1; i >= 0 && out.length < limit; i--) {
      const e = block.events[i]
      if (types && !types.includes(e.type)) continue
      if (skipped < offset) {
        skipped++
        continue
      }
      out.push(e)
    }
  }
  return out
}

export function getEvent(hash: string): ChainEvent | null {
  const indexed = eventByHash.get(hash.toLowerCase()) ?? null
  if (indexed) return indexed
  // Tip transactions are generated, not stored, so recover by scanning back
  // from the head over the same window the feed exposes.
  const target = hash.toLowerCase()
  const head = liveHead()
  const floor = Math.max(INDEX_HEAD, head - TIP_FEED_BLOCKS)
  for (let h = head; h > floor; h--) {
    for (const e of liveToBlock(liveBlockAt(h, agentPool())).events) {
      if (e.hash === target) return e
    }
  }
  return null
}
export function agentHistory(key: string): ChainEvent[] {
  return [...(eventsByAgent.get(key) ?? [])].reverse()
}
export function swarmActivity(slug: string): ChainEvent[] {
  return [...(eventsBySwarm.get(slug) ?? [])].reverse()
}
export function walletActivity(address: string): ChainEvent[] {
  return [...(eventsByWallet.get(address.toLowerCase()) ?? [])].reverse()
}
export function latestEvents(limit: number, offset = 0, types?: EventType[]): ChainEvent[] {
  const src = types && types.length ? eventsDesc.filter((e) => types.includes(e.type)) : eventsDesc
  return src.slice(offset, offset + limit)
}
export function countEvents(types?: EventType[]): number {
  if (!types || !types.length) return eventsDesc.length
  return eventsDesc.filter((e) => types.includes(e.type)).length
}

/* ------------------------------------------------------------------ blocks */

/**
 * Agent pool handed to the live generator so tip blocks reference real agents.
 * Built once, lazily, from the indexed set.
 */
let poolCache: AgentRef[] | null = null
export function agentPool(size = 160): AgentRef[] {
  if (poolCache) return poolCache
  const r = rngFor('pool')
  poolCache = agents
    .filter((a) => !a.halted)
    .filter(() => r() < 0.5)
    .slice(0, size)
    .map((a) => ({ key: a.key, swarm: a.swarm, id: a.id, name: a.name, address: a.address, tier: a.tier }))
  return poolCache
}

/** Present a generated tip block in the same shape as an indexed one. */
function liveToBlock(lb: LiveBlock): Block {
  const events: ChainEvent[] = lb.txs.map((t) => ({
    hash: t.hash,
    type: t.kind,
    height: t.height,
    ts: t.ts,
    index: t.index,
    agentKey: t.ref?.key ?? null,
    swarm: t.ref?.swarm ?? null,
    from: t.from,
    to: t.to,
    tokens: t.tokens,
    amount: t.amount,
    fee: t.fee,
    gasUsed: t.gasUsed,
    nonce: t.index,
    status: t.status,
  }))
  return {
    height: lb.height,
    hash: lb.hash,
    parentHash: lb.parentHash,
    stateRoot: lb.stateRoot,
    memoryRoot: lb.memoryRoot,
    ts: lb.ts,
    sequencer: lb.sequencer,
    txCount: lb.txCount,
    spawns: lb.spawns,
    inferences: lb.inferences,
    memoryWrites: lb.memoryWrites,
    halts: lb.halts,
    tokens: lb.tokens,
    swarms: [...new Set(events.map((e) => e.swarm).filter(Boolean) as string[])],
    gasUsed: lb.gasUsed,
    gasLimit: lb.gasLimit,
    baseFee: lb.baseFee,
    fees: lb.fees,
    size: lb.size,
    events,
  }
}

export function getBlock(height: number): Block | null {
  if (!Number.isFinite(height) || height < 1 || height > liveHead()) return null
  // Above the index the chain is generated on demand, so the tip is always
  // browsable no matter how long this process has been running.
  if (height > INDEX_HEAD) return liveToBlock(liveBlockAt(height, agentPool()))
  const r = rngFor(`block:${height}`)
  const evs = eventsByHeight.get(height) ?? []
  const gasUsed = evs.reduce((a, e) => a + e.gasUsed, 0) + int(r, 21_000, 64_000)
  const fees = evs.reduce((a, e) => a + e.fee, 0)
  return {
    height,
    hash: '0x' + hexFrom(`blockhash:${height}`, 64),
    parentHash: '0x' + hexFrom(`blockhash:${height - 1}`, 64),
    stateRoot: '0x' + hexFrom(`stateroot:${height}`, 64),
    memoryRoot: '0x' + hexFrom(`memoryroot:${height}`, 64),
    ts: heightToTs(height),
    sequencer: SEQUENCERS[Math.floor(r() * SEQUENCERS.length)],
    txCount: evs.length,
    spawns: evs.filter((e) => e.type === 'SPAWN').length,
    inferences: evs.filter((e) => e.type === 'PROMPT' || e.type === 'COMPLETION').length,
    memoryWrites: evs.filter((e) => e.type === 'MEMORY').length,
    halts: evs.filter((e) => e.type === 'HALT').length,
    tokens: evs.reduce((a, e) => a + (e.tokens ?? 0), 0),
    swarms: [...new Set(evs.map((e) => e.swarm).filter(Boolean) as string[])],
    gasUsed,
    gasLimit: 30_000_000,
    baseFee: Math.round((0.28 + r() * 0.9) * 100) / 100,
    fees: Math.round(fees * 10000) / 10000,
    size: 612 + evs.length * int(r, 820, 1640),
    events: evs,
  }
}

/** Newest blocks, counted down from the live head rather than the index. */
export function latestBlocks(limit: number, offset = 0): Block[] {
  const head = liveHead()
  const out: Block[] = []
  for (let i = 0; i < limit; i++) {
    const h = head - offset - i
    if (h < 1) break
    const b = getBlock(h)
    if (b) out.push(b)
  }
  return out
}

export function getBlockByHash(hash: string): Block | null {
  const target = hash.toLowerCase()
  const head = liveHead()
  for (let h = head; h > head - CHAIN.indexWindow; h--) {
    if ('0x' + hexFrom(`blockhash:${h}`, 64) === target) return getBlock(h)
  }
  return null
}

/* ------------------------------------------------------- derived statistics */

export interface SwarmStats {
  agents: number
  active: number
  thinking: number
  halted: number
  operators: number
  inferences24h: number
  inferencesTotal: number
  tokens24h: number
  tokensTotal: number
  memoryBytes: number
  change24h: number
  avgLatencyBlocks: number
  successRate: number
}

const statsCache = new Map<string, SwarmStats>()

export function swarmStats(slug: string): SwarmStats {
  const cached = statsCache.get(slug)
  if (cached) return cached
  const items = agents.filter((a) => a.swarm === slug)
  const acts = eventsBySwarm.get(slug) ?? []
  const inf = acts.filter((e) => e.type === 'PROMPT' || e.type === 'COMPLETION')
  const r = rngFor(`stats:${slug}`)
  const stats: SwarmStats = {
    agents: items.length,
    active: items.filter((a) => !a.halted).length,
    thinking: items.filter((a) => a.status === 'thinking').length,
    halted: items.filter((a) => a.halted).length,
    operators: new Set(items.filter((a) => !a.halted).map((a) => a.operator)).size,
    inferences24h: inf.length * 9,
    inferencesTotal: items.reduce((a, x) => a + x.inferences, 0),
    tokens24h: inf.reduce((a, e) => a + (e.tokens ?? 0), 0) * 9,
    tokensTotal: items.reduce((a, x) => a + x.tokensIn + x.tokensOut, 0),
    memoryBytes: items.reduce((a, x) => a + x.memoryBytes, 0),
    change24h: Math.round((r() * 60 - 24) * 10) / 10,
    avgLatencyBlocks: Math.round((1 + r() * 2.4) * 10) / 10,
    successRate: acts.length ? Math.round((acts.filter((e) => e.status === 'success').length / acts.length) * 1000) / 10 : 100,
  }
  statsCache.set(slug, stats)
  return stats
}

export function walletAgents(address: string): Agent[] {
  const a = address.toLowerCase()
  return agents.filter((x) => !x.halted && x.operator.toLowerCase() === a)
}

export function walletTokens(address: string): number {
  return walletAgents(address).reduce((acc, a) => acc + a.tokensIn + a.tokensOut, 0)
}

export interface NetworkStats {
  height: number
  agents: number
  swarms: number
  inferences24h: number
  spawns24h: number
  tokens24h: number
  memoryWrites24h: number
  activeWallets: number
  avgBlockTime: number
  txTotal: number
  gasPrice: number
  halted: number
  thinking: number
  status: 'operational' | 'degraded'
}

let networkCache: NetworkStats | null = null

export function networkStats(): NetworkStats {
  // Height is deliberately outside the cache: the chain keeps moving.
  if (networkCache) return { ...networkCache, height: liveHead() }
  const inf = events.filter((e) => e.type === 'PROMPT' || e.type === 'COMPLETION')
  networkCache = {
    height: liveHead(),
    agents: agents.filter((a) => !a.halted).length,
    swarms: swarms.length,
    inferences24h: inf.length * 9,
    spawns24h: events.filter((e) => e.type === 'SPAWN').length * 4,
    tokens24h: inf.reduce((a, e) => a + (e.tokens ?? 0), 0) * 9,
    memoryWrites24h: events.filter((e) => e.type === 'MEMORY').length * 9,
    activeWallets: new Set(events.map((e) => e.from)).size * 37,
    avgBlockTime: measuredBlockTime(1000),
    txTotal: 88_412_907,
    gasPrice: 0.42,
    halted: agents.filter((a) => a.halted).length,
    thinking: agents.filter((a) => a.status === 'thinking').length,
    status: 'operational',
  }
  return networkCache
}

export interface DayPoint {
  day: string
  spawns: number
  inferences: number
  tokens: number
  wallets: number
  fees: number
  blockTime: number
}

let seriesCache: DayPoint[] | null = null

export function dailySeries(): DayPoint[] {
  if (seriesCache) return seriesCache
  const out: DayPoint[] = []
  for (let i = 29; i >= 0; i--) {
    const r = rngFor(`day:${i}`)
    const ts = blockTimeAt(INDEX_HEAD) - i * 86_400_000
    const d = new Date(ts)
    const pad = (n: number) => String(n).padStart(2, '0')
    out.push({
      day: `${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`,
      spawns: int(r, 40, 420),
      inferences: int(r, 42_000, 148_000),
      tokens: Math.round(int(r, 120, 960) / 10) * 10,
      wallets: int(r, 3400, 11200),
      fees: Math.round(int(r, 140, 920) * 1.13),
      blockTime: Math.round((4.6 + r() * 0.8) * 100) / 100,
    })
  }
  seriesCache = out
  return out
}

/* ------------------------------------------------------------------ search */

export type SearchResult =
  | { kind: 'block'; height: number; label: string; sub: string }
  | { kind: 'tx'; hash: string; label: string; sub: string }
  | { kind: 'agent'; swarm: string; id: number; label: string; sub: string }
  | { kind: 'swarm'; slug: string; label: string; sub: string }
  | { kind: 'wallet'; address: string; label: string; sub: string }

export function search(raw: string): SearchResult[] {
  const q = raw.trim().toLowerCase()
  if (!q) return []
  const out: SearchResult[] = []

  if (/^\d+$/.test(q)) {
    const h = parseInt(q, 10)
    if (h >= 1 && h <= liveHead()) {
      out.push({ kind: 'block', height: h, label: `Block #${h}`, sub: 'block height' })
    }
    for (const a of agents) {
      if (a.id === h) out.push({ kind: 'agent', swarm: a.swarm, id: a.id, label: a.name, sub: `agent id ${a.id}` })
    }
  }

  if (/^0x[0-9a-f]{64}$/.test(q)) {
    if (eventByHash.has(q)) out.push({ kind: 'tx', hash: q, label: q, sub: 'transaction hash' })
    const blk = getBlockByHash(q)
    if (blk) out.push({ kind: 'block', height: blk.height, label: `Block #${blk.height}`, sub: 'block hash' })
  }

  if (/^0x[0-9a-f]{40}$/.test(q)) {
    const s = swarmByContract.get(q)
    const a = agentByAddress.get(q)
    if (s) out.push({ kind: 'swarm', slug: s.slug, label: s.name, sub: 'contract address' })
    else if (a) out.push({ kind: 'agent', swarm: a.swarm, id: a.id, label: a.name, sub: 'agent address' })
    else out.push({ kind: 'wallet', address: q, label: q, sub: 'address' })
  }

  for (const s of swarms) {
    if (s.name.toLowerCase().includes(q) || s.symbol.toLowerCase().includes(q) || s.slug.includes(q)) {
      out.push({ kind: 'swarm', slug: s.slug, label: s.name, sub: `${s.symbol} \u00b7 swarm` })
    }
  }

  for (const w of wallets) {
    if (w.handle?.toLowerCase().includes(q) || w.label?.toLowerCase().includes(q)) {
      out.push({ kind: 'wallet', address: w.address, label: w.handle ?? w.label ?? w.address, sub: 'wallet' })
    }
  }

  if (q.length >= 3) {
    for (const a of agents) {
      if (out.length > 60) break
      if (a.name.toLowerCase().includes(q)) {
        out.push({ kind: 'agent', swarm: a.swarm, id: a.id, label: a.name, sub: `agent \u00b7 ${a.swarm}` })
      }
    }
  }

  return out.slice(0, 40)
}

/* --------------------------------------------------------------- selectors */

export function trendingSwarms(): Array<Swarm & { stats: SwarmStats }> {
  return swarms
    .map((s) => ({ ...s, stats: swarmStats(s.slug) }))
    .sort((a, b) => b.stats.inferences24h - a.stats.inferences24h)
}

export function recentSpawns(limit: number): Array<{ event: ChainEvent; agent: Agent }> {
  const out: Array<{ event: ChainEvent; agent: Agent }> = []
  for (const e of eventsDesc) {
    if (e.type !== 'SPAWN' || !e.agentKey) continue
    const a = agentByKey.get(e.agentKey)
    if (!a) continue
    out.push({ event: e, agent: a })
    if (out.length >= limit) break
  }
  return out
}

export function thinkingAgents(limit: number): Agent[] {
  return agents
    .filter((a) => a.status === 'thinking')
    .sort((a, b) => b.lastActive - a.lastActive || b.inferences - a.inferences)
    .slice(0, limit)
}

export function topWallets(limit: number): Array<{ wallet: Wallet; count: number; tokens: number }> {
  const counts = new Map<string, number>()
  for (const a of agents) {
    if (a.halted) continue
    counts.set(a.operator, (counts.get(a.operator) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([address, count]) => ({ wallet: getWallet(address)!, count, tokens: walletTokens(address) }))
    .filter((w) => w.wallet && w.wallet.kind === 'account')
    .sort((a, b) => b.tokens - a.tokens)
    .slice(0, limit)
}

export function relatedAgents(agent: Agent, limit: number): Agent[] {
  return agents.filter((a) => a.swarm === agent.swarm && a.key !== agent.key && !a.halted).slice(0, limit)
}
