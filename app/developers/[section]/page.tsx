import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Panel, PanelNote, TabNav, Table } from '@/components/kit'

type Section = {
  title: string
  intro: string
  code: string
  rows: Array<[string, string, string]>
  columns: [string, string, string]
  note: string
}

const SECTIONS: Record<string, Section> = {
  rest: {
    title: 'REST API',
    intro:
      'A thin read-only layer over the indexer. Every response is JSON, every list endpoint pages with cursor and limit, and nothing is cached longer than one block.',
    columns: ['endpoint', 'query', 'returns'],
    rows: [
      ['GET /v1/blocks', 'cursor, limit', 'block headers, newest first'],
      ['GET /v1/blocks/:height', '\u2014', 'a block with its transactions'],
      ['GET /v1/txs/:hash', '\u2014', 'transaction and receipt'],
      ['GET /v1/objects', 'collection, owner, trait, cursor', 'object records with traits'],
      ['GET /v1/objects/:slug/:id', '\u2014', 'a single object'],
      ['GET /v1/objects/:slug/:id/frames', 'frame', 'raw frame bytes, image/gif'],
      ['GET /v1/collections', 'category, sort', 'collections with live stats'],
      ['GET /v1/wallets/:address', '\u2014', 'balance, holdings and counters'],
      ['GET /v1/activity', 'type, collection, since', 'operation feed'],
    ],
    code: `curl 'https://api.gifchain.net/v1/objects?collection=gifcats&limit=2'

{
  "data": [
    { "key": "gifcats#1", "owner": "0x7f3a...", "rarityRank": 41 },
    { "key": "gifcats#2", "owner": "0x1c08...", "rarityRank": 187 }
  ],
  "cursor": "eyJvIjoyfQ",
  "height": 4128733
}`,
    note: 'Responses carry the height they were computed at. If you are reconciling state, compare that height rather than wall-clock time.',
  },
  graphql: {
    title: 'Indexer / GraphQL',
    intro:
      'One endpoint, one round trip. The indexer keeps a denormalised view of objects, owners, listings and activity, rebuilt from the object roots on every block.',
    columns: ['field', 'arguments', 'notes'],
    rows: [
      ['block(height)', 'height: Int!', 'header, txs, object root'],
      ['object(slug, tokenId)', 'slug: String!, tokenId: Int!', 'traits, owner, provenance'],
      ['objects(where, first, after)', 'ObjectFilter', 'filter by trait, owner, price, burned'],
      ['collection(slug)', 'slug: String!', 'stats, traits, holders'],
      ['wallet(address)', 'address: String!', 'holdings and activity'],
      ['activity(where, first)', 'ActivityFilter', 'mints, sales, transfers, burns'],
      ['subscription objectEvents', 'slug: String', 'live stream over websocket'],
    ],
    code: `query Whale($addr: String!) {
  wallet(address: $addr) {
    objectCount
    estimatedValue
    holdings(first: 5, orderBy: RARITY_RANK) {
      key
      name
      rarityRank
      collection { name floor }
    }
  }
}`,
    note: 'Depth is capped at 8 and complexity at 2000 points. A holdings query that also pulls full provenance for each object will be rejected, page it instead.',
  },
  sdk: {
    title: 'SDK',
    intro:
      'The TypeScript client this explorer uses. It wraps JSON-RPC, verifies object proofs locally, and decodes frames into an ImageBitmap you can paint on a canvas.',
    columns: ['export', 'signature', 'notes'],
    rows: [
      ['createClient', '(opts) => Client', 'http or websocket transport'],
      ['client.block', '(height) => Block', 'null outside the archive window'],
      ['client.object', '(slug, id) => GifObject', 'includes traits and rarity'],
      ['client.frames', '(slug, id) => Uint8Array[]', 'decoded, palette applied'],
      ['client.proof', '(slug, id) => Proof', 'verify against a block header'],
      ['client.watch', '(filter, cb) => Unsub', 'live events over websocket'],
      ['signer.mint', '(slug, qty) => TxHash', 'requires a local key'],
    ],
    code: `import { createClient } from '@gifchain/sdk'

const chain = createClient({ url: 'https://rpc.gifchain.net' })

const obj = await chain.object('gifcats', 128)
const proof = await chain.proof('gifcats', 128)
const head = await chain.block()

console.log(proof.verify(head.objectRoot)) // true

chain.watch({ type: 'SALE', collection: 'gifcats' }, (e) => {
  console.log(e.price, '->', e.to)
})`,
    note: 'Proof verification runs in the client, so a lying RPC node cannot convince the SDK that an object has a different owner. It can only refuse to answer.',
  },
  webhooks: {
    title: 'Webhooks',
    intro:
      'Push delivery for teams that do not want to poll. Events are signed, retried with exponential backoff for 24 hours, and delivered at least once.',
    columns: ['event', 'payload', 'fires when'],
    rows: [
      ['object.minted', 'object, tx, height', 'a mint is included in a block'],
      ['object.transferred', 'object, from, to', 'ownership leaf changes'],
      ['object.sold', 'object, price, royalty', 'the market module settles a fill'],
      ['object.listed', 'object, price, escrow', 'a listing enters escrow'],
      ['object.burned', 'object, tx', 'the leaf is cleared'],
      ['collection.deployed', 'collection, creator', 'a new contract is deployed'],
      ['block.finalized', 'height, objectRoot', 'two blocks build on a height'],
    ],
    code: `POST /your-endpoint
x-gifchain-signature: t=1739812,v1=6f2c...9ab1

{
  "event": "object.sold",
  "height": 4128733,
  "data": {
    "object": "gifcats#128",
    "from": "0x7f3a...",
    "to": "0x1c08...",
    "price": "12.40",
    "royalty": "0.62"
  }
}`,
    note: 'Verify the signature before trusting a payload: HMAC the raw body with your endpoint secret and compare against v1. Reject anything older than five minutes.',
  },
}

const ORDER = ['rest', 'graphql', 'sdk', 'webhooks'] as const

type Props = { params: Promise<{ section: string }> }

export function generateStaticParams() {
  return ORDER.map((section) => ({ section }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { section } = await params
  const s = SECTIONS[section]
  return { title: s ? s.title : 'Developers', description: s?.intro }
}

export default async function DeveloperSectionPage({ params }: Props) {
  const { section } = await params
  const s = SECTIONS[section]
  if (!s) notFound()

  return (
    <div className="flex flex-col gap-2">
      <Panel tone="lime" title={s.title}>
        <TabNav
          items={[
            { label: 'overview', href: '/developers' },
            ...ORDER.map((k) => ({
              label: SECTIONS[k].title.toLowerCase(),
              href: `/developers/${k}`,
              active: k === section,
            })),
          ]}
        />
        <p className="max-w-[80ch] p-2 font-mono text-[11px] leading-relaxed">{s.intro}</p>
      </Panel>

      <div className="grid gap-2 lg:grid-cols-[1fr_1fr]">
        <Panel title="reference">
          <Table>
            <thead>
              <tr>
                {s.columns.map((c) => (
                  <th key={c}>{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {s.rows.map(([a, b, c]) => (
                <tr key={a}>
                  <td className="font-mono">{a}</td>
                  <td className="font-mono text-muted-foreground">{b}</td>
                  <td>{c}</td>
                </tr>
              ))}
            </tbody>
          </Table>
          <PanelNote>{s.note}</PanelNote>
        </Panel>
        <Panel title="example">
          <pre className="overflow-x-auto p-2 font-mono text-[10px] leading-[1.7]">{s.code}</pre>
        </Panel>
      </div>
    </div>
  )
}
