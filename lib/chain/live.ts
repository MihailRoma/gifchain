/**
 * Live tip generation.
 *
 * Everything here is derived from a height alone, so the browser can extend the
 * chain past whatever the server indexed without fetching. This module must
 * stay free of `data.ts` — that graph is ~1k lines and server-only, and pulling
 * it into a client bundle is what previously stalled hydration.
 *
 * Agents are supplied as an `AgentRef[]` pool by the server, so the tip names
 * real agents without shipping the agent index.
 */
import { BURN_ADDRESS, MEMORY_MODULE, SEQUENCERS, SPAWN_MODULE, blockTimeAt } from './constants'
import { hexFrom, int, mulberry32, pick, seedFrom } from './rng'

export type LiveTxKind = 'PROMPT' | 'COMPLETION' | 'MEMORY' | 'SPAWN' | 'TRANSFER' | 'HALT'

/** Used when a stats window is too short to measure a real gap. */
const FALLBACK_BLOCK_SEC = 5

/** Minimal agent descriptor: enough to draw a glyph and link to its page. */
export interface AgentRef {
  key: string
  swarm: string
  id: number
  name: string
  address: string
  tier: 'opus' | 'sonnet' | 'haiku'
}

export interface LiveTx {
  hash: string
  kind: LiveTxKind
  height: number
  ts: number
  index: number
  ref: AgentRef | null
  from: string
  to: string
  /** Context tokens consumed, for PROMPT and COMPLETION. */
  tokens: number | null
  /** CLAUDE moved, for TRANSFER. */
  amount: number | null
  fee: number
  gasUsed: number
  status: 'success' | 'failed'
}

export interface LiveBlock {
  height: number
  ts: number
  hash: string
  parentHash: string
  stateRoot: string
  memoryRoot: string
  sequencer: string
  txCount: number
  spawns: number
  inferences: number
  memoryWrites: number
  halts: number
  tokens: number
  fees: number
  gasUsed: number
  gasLimit: number
  baseFee: number
  size: number
  txs: LiveTx[]
}

/** Recurring participants, so the same wallets reappear across the tip. */
const ADDRESS_POOL: string[] = Array.from(
  { length: 96 },
  (_, i) => '0x' + hexFrom(`claudechain:addr:${i}`, 40),
)

/** Weighted transaction mix. Inference dominates, halts are rare. */
const KIND_TABLE: LiveTxKind[] = [
  ...Array<LiveTxKind>(8).fill('PROMPT'),
  ...Array<LiveTxKind>(8).fill('COMPLETION'),
  ...Array<LiveTxKind>(4).fill('MEMORY'),
  ...Array<LiveTxKind>(3).fill('TRANSFER'),
  ...Array<LiveTxKind>(2).fill('SPAWN'),
  'HALT',
]

/**
 * Transactions per block. Skewed low with a long tail so the table breathes:
 * plenty of quiet blocks, the occasional busy one.
 */
function txCountFor(rand: () => number): number {
  const roll = rand()
  if (roll < 0.18) return 0
  if (roll < 0.58) return int(rand, 1, 4)
  if (roll < 0.9) return int(rand, 5, 10)
  return int(rand, 11, 21)
}

export function liveBlockAt(height: number, pool: readonly AgentRef[]): LiveBlock {
  const rand = mulberry32(seedFrom(`live:block:${height}`))
  const ts = blockTimeAt(height)
  const count = txCountFor(rand)

  const txs: LiveTx[] = []
  for (let i = 0; i < count; i++) {
    const kind = pick(rand, KIND_TABLE)
    const ref = pool.length ? pool[Math.floor(rand() * pool.length)] : null
    const caller = pick(rand, ADDRESS_POOL)
    let counter = pick(rand, ADDRESS_POOL)
    if (counter === caller) counter = ADDRESS_POOL[(ADDRESS_POOL.indexOf(counter) + 7) % ADDRESS_POOL.length]
    const agentAddr = ref?.address ?? counter

    let from = caller
    let to = counter
    if (kind === 'PROMPT') to = agentAddr
    else if (kind === 'COMPLETION') {
      from = agentAddr
      to = caller
    } else if (kind === 'MEMORY') {
      from = agentAddr
      to = MEMORY_MODULE
    } else if (kind === 'SPAWN') from = SPAWN_MODULE
    else if (kind === 'HALT') to = BURN_ADDRESS

    const inference = kind === 'PROMPT' || kind === 'COMPLETION'
    txs.push({
      hash: '0x' + hexFrom(`live:tx:${height}:${i}`, 64),
      kind,
      height,
      ts,
      index: i,
      ref: kind === 'TRANSFER' ? null : ref,
      from,
      to,
      tokens: inference ? int(rand, 180, 42_000) : kind === 'MEMORY' ? int(rand, 64, 6_000) : null,
      amount: kind === 'TRANSFER' ? Math.round((0.4 + rand() * 460) * 100) / 100 : null,
      fee: Math.round((0.0004 + rand() * 0.0075) * 10_000) / 10_000,
      gasUsed: int(rand, 34_000, 186_000),
      // Failures are rare but real; an explorer that never shows one looks fake.
      status: rand() < 0.031 ? 'failed' : 'success',
    })
  }

  const gasUsed = txs.reduce((a, t) => a + t.gasUsed, 0) + int(rand, 21_000, 64_000)
  const fees = txs.reduce((a, t) => a + t.fee, 0)

  return {
    height,
    ts,
    hash: '0x' + hexFrom(`blockhash:${height}`, 64),
    parentHash: '0x' + hexFrom(`blockhash:${height - 1}`, 64),
    stateRoot: '0x' + hexFrom(`stateroot:${height}`, 64),
    memoryRoot: '0x' + hexFrom(`memoryroot:${height}`, 64),
    sequencer: SEQUENCERS[height % SEQUENCERS.length],
    txCount: txs.length,
    spawns: txs.filter((t) => t.kind === 'SPAWN').length,
    inferences: txs.filter((t) => t.kind === 'PROMPT' || t.kind === 'COMPLETION').length,
    memoryWrites: txs.filter((t) => t.kind === 'MEMORY').length,
    halts: txs.filter((t) => t.kind === 'HALT').length,
    tokens: txs.reduce((a, t) => a + (t.tokens ?? 0), 0),
    fees: Math.round(fees * 10_000) / 10_000,
    gasUsed,
    gasLimit: 30_000_000,
    baseFee: Math.round((0.28 + rand() * 0.9) * 100) / 100,
    size: 612 + txs.length * int(rand, 820, 1640),
    txs,
  }
}

/** `count` blocks ending at `head`, newest first. */
export function liveBlocksTo(head: number, count: number, pool: readonly AgentRef[]): LiveBlock[] {
  const out: LiveBlock[] = []
  for (let i = 0; i < count; i++) {
    const h = head - i
    if (h < 1) break
    out.push(liveBlockAt(h, pool))
  }
  return out
}

/** Newest-first transactions drawn from the blocks ending at `head`. */
export function liveTxsTo(head: number, count: number, pool: readonly AgentRef[]): LiveTx[] {
  const out: LiveTx[] = []
  for (let h = head; h > head - 400 && out.length < count; h--) {
    if (h < 1) break
    const block = liveBlockAt(h, pool)
    for (let i = block.txs.length - 1; i >= 0 && out.length < count; i--) out.push(block.txs[i])
  }
  return out
}

/**
 * Resolve a tip transaction hash. Hashes encode height and index, but only as a
 * seed, so recovery is a bounded scan back from the head.
 */
export function findLiveTx(
  hash: string,
  head: number,
  pool: readonly AgentRef[],
  depth = 2_000,
): LiveTx | null {
  const target = hash.toLowerCase()
  for (let h = head; h > head - depth && h > 0; h--) {
    for (const tx of liveBlockAt(h, pool).txs) {
      if (tx.hash === target) return tx
    }
  }
  return null
}

/** Rolling averages over the tip, for the explorer's network cards. */
export function liveTipStats(head: number, pool: readonly AgentRef[], window = 120) {
  const blocks = liveBlocksTo(head, window, pool)
  const txs = blocks.reduce((a, b) => a + b.txCount, 0)
  const span = blocks.length > 1 ? blocks[0].ts - blocks[blocks.length - 1].ts : 0
  const seconds = span / 1000 || 1
  return {
    blocks: blocks.length,
    txs,
    /** Mean seal gap over the window, seconds. */
    avgBlockTime: blocks.length > 1 ? span / 1000 / (blocks.length - 1) : FALLBACK_BLOCK_SEC,
    tps: txs / seconds,
    tokens: blocks.reduce((a, b) => a + b.tokens, 0),
    tokensPerSec: blocks.reduce((a, b) => a + b.tokens, 0) / seconds,
    gasUsed: blocks.reduce((a, b) => a + b.gasUsed, 0),
    fees: blocks.reduce((a, b) => a + b.fees, 0),
    baseFee: blocks.reduce((a, b) => a + b.baseFee, 0) / (blocks.length || 1),
    fullness: blocks.reduce((a, b) => a + b.gasUsed / b.gasLimit, 0) / (blocks.length || 1),
  }
}
