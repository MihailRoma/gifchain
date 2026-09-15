import type { Metadata } from 'next'
import Link from 'next/link'
import { CopyButton } from '@/components/copy-button'
import { Panel, PanelNote, Stat, Table } from '@/components/kit'
import { CHAIN } from '@/lib/chain/constants'
import { num } from '@/lib/chain/format'

export const metadata: Metadata = {
  title: 'Developers',
  description: 'RPC endpoints, network configuration and client libraries for GIFCHAIN.',
}

const METHODS = [
  ['gif_blockNumber', '[]', 'current head height'],
  ['gif_getBlockByHeight', '[height, withTxs]', 'full block including object roots'],
  ['gif_getTransaction', '[hash]', 'single transaction and its receipt'],
  ['gif_getObject', '[slug, tokenId]', 'object metadata, traits and owner'],
  ['gif_getObjectBytes', '[slug, tokenId]', 'raw frame bytes from the object trie'],
  ['gif_getOwnership', '[address]', 'every object leaf owned by an address'],
  ['gif_getListing', '[slug, tokenId]', 'active listing, escrow account and price'],
  ['gif_sendRawTransaction', '[signedTx]', 'broadcast a signed transaction'],
  ['gif_objectRoot', '[height]', 'object root committed at a height'],
  ['gif_proof', '[slug, tokenId, height]', 'merkle proof of an object leaf'],
] as const

const SECTIONS = [
  ['rest', 'REST API', 'Plain HTTP endpoints for explorers and dashboards.'],
  ['graphql', 'Indexer / GraphQL', 'Query activity, holders and traits in one round trip.'],
  ['sdk', 'SDK', 'The TypeScript client used by everything on this site.'],
  ['webhooks', 'Webhooks', 'Push mints, sales and transfers to your own service.'],
] as const

export default function DevelopersPage() {
  const rpc = 'https://rpc.gifchain.net'
  return (
    <div className="flex flex-col gap-2">
      <Panel tone="lime" title="build on gifchain">
        <div className="grid grid-cols-2 md:grid-cols-4">
          <Stat label="rpc" value="open" sub="no key for read methods" />
          <Stat label="rate limit" value="60 rps" sub="per IP, burst 200" />
          <Stat label="archive depth" value={num(CHAIN.headHeight)} sub="full history from genesis" />
          <Stat label="websocket" value="wss" sub="new heads and object events" />
        </div>
      </Panel>

      <div className="grid gap-2 lg:grid-cols-2">
        <Panel title="network configuration" className="scroll-mt-4">
          <table className="tbl" id="config">
            <tbody>
              <tr>
                <th scope="row" className="w-[150px] bg-surface-2">chain id</th>
                <td className="font-mono">{CHAIN.chainId}</td>
              </tr>
              <tr>
                <th scope="row" className="bg-surface-2">network</th>
                <td className="font-mono">{CHAIN.networkId}</td>
              </tr>
              <tr>
                <th scope="row" className="bg-surface-2">currency</th>
                <td className="font-mono">GIF (18 decimals)</td>
              </tr>
              <tr>
                <th scope="row" className="bg-surface-2">rpc http</th>
                <td>
                  <span className="flex items-center gap-2">
                    <span className="font-mono">{rpc}</span>
                    <CopyButton value={rpc} />
                  </span>
                </td>
              </tr>
              <tr>
                <th scope="row" className="bg-surface-2">rpc ws</th>
                <td className="font-mono">wss://rpc.gifchain.net/ws</td>
              </tr>
              <tr>
                <th scope="row" className="bg-surface-2">explorer</th>
                <td className="font-mono">https://gifchain.net</td>
              </tr>
              <tr>
                <th scope="row" className="bg-surface-2">block time</th>
                <td className="font-mono">4.0s target, 2 block finality</td>
              </tr>
            </tbody>
          </table>
          <PanelNote>
            Read methods are open. Broadcasting requires no key either, but unsigned or underpriced
            transactions are dropped at the edge rather than entering the mempool.
          </PanelNote>
        </Panel>

        <Panel title="first request">
          <pre className="overflow-x-auto p-2 font-mono text-[10px] leading-[1.7]">
{`curl ${rpc} \\
  -H 'content-type: application/json' \\
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "gif_getObject",
    "params": ["gifcats", 128]
  }'

{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "key": "gifcats#128",
    "owner": "0x7f3a...c41d",
    "traits": [
      { "trait": "fur", "value": "static" },
      { "trait": "frame rate", "value": "12 fps" }
    ],
    "frames": 8,
    "bytes": 5312,
    "root": "0x9be4...0f21"
  }
}`}
          </pre>
        </Panel>
      </div>

      <Panel title="json-rpc methods">
        <Table>
          <thead>
            <tr>
              <th>method</th>
              <th>params</th>
              <th>returns</th>
            </tr>
          </thead>
          <tbody>
            {METHODS.map(([m, p, d]) => (
              <tr key={m}>
                <td className="font-mono">{m}</td>
                <td className="font-mono text-muted-foreground">{p}</td>
                <td>{d}</td>
              </tr>
            ))}
          </tbody>
        </Table>
        <PanelNote>
          Every read method accepts an optional trailing height so you can query historical state.
          Proofs verify against the object root in the block header, not against the indexer.
        </PanelNote>
      </Panel>

      <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
        {SECTIONS.map(([slug, title, blurb]) => (
          <Panel key={slug} title={title}>
            <div className="p-2">
              <p className="font-mono text-[10px] leading-relaxed text-muted-foreground">{blurb}</p>
              <Link href={`/developers/${slug}`} className="mt-2 inline-block font-mono text-[11px]">
                open {'\u2192'}
              </Link>
            </div>
          </Panel>
        ))}
      </div>
    </div>
  )
}
