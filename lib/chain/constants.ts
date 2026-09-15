/**
 * GIFCHAIN block timing.
 *
 * The chain is a pure function of wall-clock time: there is no stored state and
 * no frozen snapshot. Block N is sealed at `blockTimeAt(N)`, so the head height
 * and every age on the site advance on their own, forever.
 *
 * Intervals are randomised per block but stay inside a hard 3s-7s band. That is
 * achieved by giving each height a bounded offset instead of summing random
 * gaps, which keeps `blockTimeAt` O(1) and strictly increasing:
 *
 *   blockTimeAt(n) = GENESIS + n * 5000 + offset(n),  offset(n) in [-1000, 1000]
 *   interval(n)    = 5000 + offset(n) - offset(n-1)   => 3000..7000 ms
 *
 * Summing random gaps instead would need a walk over four million heights and
 * could drift; this cannot.
 */

/** Mean seal time. Offsets swing each interval +/-2s around it. */
export const BLOCK_BASE_MS = 5_000
/** Per-height offset bound. Half the 4s spread between the 3s and 7s limits. */
export const BLOCK_JITTER_MS = 1_000
export const BLOCK_MIN_MS = BLOCK_BASE_MS - 2 * BLOCK_JITTER_MS
export const BLOCK_MAX_MS = BLOCK_BASE_MS + 2 * BLOCK_JITTER_MS

/** Height the chain had reached at LAUNCH_AT; fixes the height/time mapping. */
const LAUNCH_HEIGHT = 4_128_744
const LAUNCH_AT = Date.parse('2026-09-15T12:00:00Z')

/** Genesis is derived so LAUNCH_HEIGHT seals exactly at LAUNCH_AT. */
export const GENESIS_MS = LAUNCH_AT - LAUNCH_HEIGHT * BLOCK_BASE_MS

/** Integer avalanche hash. Cheap enough to call per height, per frame. */
function hash32(n: number): number {
  let h = n >>> 0
  h = Math.imul(h ^ (h >>> 16), 0x7feb352d)
  h = Math.imul(h ^ (h >>> 15), 0x846ca68b)
  return (h ^ (h >>> 16)) >>> 0
}

/** Deterministic offset for a height, in [-BLOCK_JITTER_MS, BLOCK_JITTER_MS). */
function offsetAt(height: number): number {
  return (hash32(height) / 0x1_0000_0000) * 2 * BLOCK_JITTER_MS - BLOCK_JITTER_MS
}

/** Wall-clock ms at which a height sealed. Strictly increasing in height. */
export function blockTimeAt(height: number): number {
  return Math.round(GENESIS_MS + height * BLOCK_BASE_MS + offsetAt(height))
}

/** Gap between a height and its parent. Always within [3000, 7000]. */
export function blockIntervalMs(height: number): number {
  return blockTimeAt(height) - blockTimeAt(height - 1)
}

/** Highest height sealed at or before `now`. */
export function heightAtTime(now: number): number {
  // The offset is bounded by BLOCK_JITTER_MS, so the linear estimate is never
  // more than one height out; the two guards below settle it.
  let h = Math.floor((now - GENESIS_MS) / BLOCK_BASE_MS)
  while (blockTimeAt(h + 1) <= now) h++
  while (h > 0 && blockTimeAt(h) > now) h--
  return h
}

/** When the next block after `now` seals. Used to schedule the live ticker. */
export function nextBlockTimeAfter(now: number): number {
  return blockTimeAt(heightAtTime(now) + 1)
}

/** Sequencer set. Lives here so client bundles can name a proposer cheaply. */
export const SEQUENCERS = [
  'seq-01.ams',
  'seq-02.ams',
  'seq-03.nrt',
  'seq-04.iad',
  'seq-05.sfo',
  'seq-06.gru',
  'seq-07.sin',
  'seq-08.fra',
] as const

export const CHAIN = {
  name: 'GIFCHAIN',
  ticker: 'GIF',
  chainId: 6464,
  networkId: 'gifchain-mainnet-1',
  blockTimeMs: BLOCK_BASE_MS,
  /** Nominal block time shown in copy, in seconds. */
  blockTimeSec: BLOCK_BASE_MS / 1000,
  /** How many recent blocks the object indexer keeps hot. */
  indexWindow: 2000,
  /** Finality depth, in seals after inclusion. */
  finalityDepth: 2,
  rpcHttp: 'https://rpc.gifchain.art',
  rpcWs: 'wss://rpc.gifchain.art/ws',
  restBase: 'https://api.gifchain.art/v1',
  graphBase: 'https://index.gifchain.art/graphql',
  gifPriceUsd: 3.42,
} as const

export const BURN_ADDRESS = '0x0000000000000000000000000000000000000000'
export const NULL_HASH = '0x' + '0'.repeat(64)

/** Back-compat alias: every timestamp on the chain comes from the same curve. */
export const heightToTs = blockTimeAt
