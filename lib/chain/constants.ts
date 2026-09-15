export const CHAIN = {
  name: 'GIFCHAIN',
  ticker: 'GIF',
  chainId: 6464,
  networkId: 'gifchain-mainnet-1',
  blockTimeMs: 4000,
  headHeight: 4_128_744,
  /** Fixed reference point for the indexed snapshot. All ages are relative to it. */
  anchor: Date.parse('2026-09-15T18:00:00Z'),
  /** How many recent blocks the object indexer keeps hot. */
  indexWindow: 2000,
  rpcHttp: 'https://rpc.gifchain.xyz',
  rpcWs: 'wss://rpc.gifchain.xyz/ws',
  restBase: 'https://api.gifchain.xyz/v1',
  graphBase: 'https://index.gifchain.xyz/graphql',
  explorerBase: 'https://gifchain.xyz',
  gifPriceUsd: 3.42,
} as const

export const BURN_ADDRESS = '0x0000000000000000000000000000000000000000'
export const NULL_HASH = '0x' + '0'.repeat(64)

export function heightToTs(height: number): number {
  return CHAIN.anchor - (CHAIN.headHeight - height) * CHAIN.blockTimeMs
}
