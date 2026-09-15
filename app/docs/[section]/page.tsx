import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Panel, PanelNote, TabNav, Table } from '@/components/kit'

type Doc = {
  title: string
  intro: string
  sections: Array<{ heading: string; body: string }>
  table: { columns: [string, string, string]; rows: Array<[string, string, string]> }
  code: string
  note: string
}

const DOCS: Record<string, Doc> = {
  standards: {
    title: 'Object standard',
    intro:
      'GIF-721 and GIF-1155 describe ownership. The object encoding underneath them describes the pixels. Both are part of consensus, which is why a node can reject a malformed object instead of storing garbage.',
    sections: [
      {
        heading: 'encoding',
        body: 'An object is a header, a palette of up to 256 colours, and between one and 64 frames of indexed pixel data. Frames are delta encoded against the previous frame, so a mostly-static animation costs little more than a still. The whole payload is capped at 16 KB; a mint that exceeds it fails at validation rather than being truncated.',
      },
      {
        heading: 'traits',
        body: 'Traits are derived, not supplied. The mint hash seeds a deterministic function defined by the collection at deploy time, which means anyone can recompute every trait in the collection from public data. Rarity scores are the sum of inverse trait frequencies and are recomputed whenever supply changes, which in practice means only on burns.',
      },
      {
        heading: 'ownership',
        body: 'GIF-721 gives each slot a unique leaf. GIF-1155 lets one object leaf carry a balance map, which is how edition collections work without storing the same frames a thousand times. Both expose the same read interface, so an explorer does not need to care which one it is looking at.',
      },
      {
        heading: 'royalties',
        body: 'GIF-2981 royalties are enforced by the market module, not by good manners. A fill that does not pay the creator is not a valid fill, so it never reaches a block. Private transfers with no price attached are, of course, still just transfers.',
      },
    ],
    table: {
      columns: ['field', 'size', 'meaning'],
      rows: [
        ['magic', '4 B', '0x47494658, marks an object payload'],
        ['version', '1 B', 'encoding version, currently 2'],
        ['dims', '2 B', 'width and height, max 128 each'],
        ['frames', '1 B', 'frame count, 1 to 64'],
        ['delay', '2 B', 'frame delay in milliseconds'],
        ['palette', '3\u2013768 B', 'RGB triples, up to 256 entries'],
        ['data', 'variable', 'delta encoded indexed pixels'],
        ['checksum', '4 B', 'crc32 over header and data'],
      ],
    },
    code: `// validate before broadcasting
import { encodeObject, validate } from '@gifchain/sdk'

const payload = encodeObject({
  dims: [64, 64],
  delay: 80,
  palette,
  frames,
})

validate(payload)        // throws if > 16 KB or malformed
payload.byteLength       // 5312`,
    note: 'Version 1 objects still exist in history and still render. Nodes accept them on read and reject them on write, which is the only kind of deprecation a chain can actually perform.',
  },
  nodes: {
    title: 'Node operators',
    intro:
      'Running a full node is unremarkable: one binary, one data directory, no external database. Becoming a sequencer means bonding GIF and accepting that missed slots cost money.',
    sections: [
      {
        heading: 'sync modes',
        body: 'Snapshot sync downloads a recent object root and its state, then follows the head; it is what you want for an explorer or a wallet backend. Archive sync replays from genesis and keeps every historical object root, which is what you need to serve proofs at arbitrary heights. Archive is roughly nine times the disk for the same head state.',
      },
      {
        heading: 'hardware',
        body: 'Objects are small but numerous, so the bottleneck is random reads rather than raw capacity. An NVMe drive with decent IOPS matters far more than core count. Eight cores and 32 GB of RAM will keep up with the head comfortably; sequencers should double the RAM to hold the mempool and proof cache.',
      },
      {
        heading: 'bonding',
        body: 'A sequencer bonds 250,000 GIF into the staking module and joins the set at the next epoch boundary. Slots are assigned in a fixed order within the epoch. Missing a slot produces an empty block and a small penalty; signing two blocks at the same height is equivocation and costs the whole bond.',
      },
      {
        heading: 'exiting',
        body: 'Unbonding takes one full epoch plus 4096 blocks, during which the bond is still slashable. This is deliberately boring: the delay exists so that a sequencer cannot sign a bad block and withdraw before anyone notices.',
      },
    ],
    table: {
      columns: ['profile', 'requirements', 'notes'],
      rows: [
        ['snapshot node', '4 cores, 16 GB, 400 GB NVMe', 'follows head, no historical proofs'],
        ['archive node', '8 cores, 32 GB, 3.5 TB NVMe', 'serves proofs at any height'],
        ['indexer', '8 cores, 64 GB, 4 TB NVMe', 'archive plus denormalised views'],
        ['sequencer', '16 cores, 64 GB, 4 TB NVMe', 'requires a 250,000 GIF bond'],
        ['bandwidth', '~40 Mbit sustained', 'higher during mint waves'],
        ['ports', '30333 p2p, 9933 rpc', 'p2p must be reachable'],
      ],
    },
    code: `$ gifd init --network gifchain-1
$ gifd sync --mode snapshot --peers 64

> fetching object root 0x9be4...0f21
> state 2.1 GB / 2.1 GB ....... ok
> following head at 4128733

$ gifd stake bond --amount 250000 --from ~/.gifd/key
> bond accepted, active at epoch 1008`,
    note: 'There is no separate consensus client and no beacon chain. One process, one config file. Most of the operational work is making sure the disk does not fill up during a mint wave.',
  },
}

const ORDER = ['standards', 'nodes'] as const

type Props = { params: Promise<{ section: string }> }

export function generateStaticParams() {
  return ORDER.map((section) => ({ section }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { section } = await params
  const d = DOCS[section]
  return { title: d ? d.title : 'Docs', description: d?.intro }
}

export default async function DocsSectionPage({ params }: Props) {
  const { section } = await params
  const doc = DOCS[section]
  if (!doc) notFound()

  return (
    <div className="flex flex-col gap-2">
      <Panel tone="lime" title={doc.title}>
        <TabNav
          items={[
            { label: 'overview', href: '/docs' },
            ...ORDER.map((k) => ({
              label: DOCS[k].title.toLowerCase(),
              href: `/docs/${k}`,
              active: k === section,
            })),
          ]}
        />
        <p className="max-w-[80ch] p-2 font-mono text-[11px] leading-relaxed">{doc.intro}</p>
      </Panel>

      <div className="grid gap-2 lg:grid-cols-[1fr_380px]">
        <Panel title="reference">
          <div className="flex flex-col">
            {doc.sections.map((s) => (
              <section key={s.heading} className="border-b border-hair p-2 last:border-b-0">
                <h2 className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground">
                  {s.heading}
                </h2>
                <p className="mt-1 max-w-[78ch] font-mono text-[11px] leading-relaxed">{s.body}</p>
              </section>
            ))}
          </div>
          <PanelNote>{doc.note}</PanelNote>
        </Panel>

        <div className="flex flex-col gap-2">
          <Panel title="at a glance">
            <Table>
              <thead>
                <tr>
                  {doc.table.columns.map((c) => (
                    <th key={c}>{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {doc.table.rows.map(([a, b, c]) => (
                  <tr key={a}>
                    <td className="font-mono align-top">{a}</td>
                    <td className="font-mono text-muted-foreground align-top">{b}</td>
                    <td className="leading-relaxed">{c}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Panel>
          <Panel title="example">
            <pre className="overflow-x-auto p-2 font-mono text-[10px] leading-[1.7]">{doc.code}</pre>
          </Panel>
        </div>
      </div>
    </div>
  )
}
