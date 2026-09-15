import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CopyButton } from '@/components/copy-button'
import { AddressLink, Btn, Chip, DetailList, Panel, PanelNote, Stat } from '@/components/kit'
import { ObjectViewer } from '@/components/object-viewer'
import { EventsTable, ObjectGrid } from '@/components/tables'
import { CHAIN } from '@/lib/chain/constants'
import {
  collectionStats,
  getCollection,
  getObject,
  objectHistory,
  relatedObjects,
} from '@/lib/chain/data'
import { bytes, dec, gif, num, utc } from '@/lib/chain/format'
import { hexFrom } from '@/lib/chain/rng'

type Props = { params: Promise<{ slug: string; id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, id } = await params
  const object = getObject(slug, parseInt(id, 10))
  return {
    title: object ? object.name : 'Object',
    description: object ? `${object.name} on GIFCHAIN, rarity rank ${object.rarityRank}.` : undefined,
  }
}

export default async function ObjectPage({ params }: Props) {
  const { slug, id } = await params
  const object = getObject(slug, parseInt(id, 10))
  const collection = getCollection(slug)
  if (!object || !collection) notFound()

  const stats = collectionStats(slug)
  const history = objectHistory(object.key)
  const related = relatedObjects(object, 16)
  const dump = Array.from({ length: 6 }, (_, i) => hexFrom(`dump:${object.key}:${i}`, 48))

  return (
    <div className="flex flex-col gap-2">
      <div className="grid gap-2 lg:grid-cols-[400px_1fr]">
        <div className="flex flex-col gap-2">
          <Panel
            title={object.name}
            tone="lime"
            right={
              object.burned ? <Chip kind="BURN">burned</Chip> : object.listPrice !== null ? <Chip kind="LIST">listed</Chip> : null
            }
          >
            <ObjectViewer
              sheet={collection.sheet}
              cell={object.cell}
              filter={object.filter}
              name={object.name}
            />
            <div className="grid grid-cols-2">
              <Stat
                label="last price"
                value={object.lastPrice !== null ? gif(object.lastPrice) : '\u2014'}
                sub={object.lastPrice !== null ? `$${dec(object.lastPrice * CHAIN.gifPriceUsd)}` : 'never sold'}
              />
              <Stat
                label="list price"
                value={object.listPrice !== null ? gif(object.listPrice) : '\u2014'}
                sub={object.listPrice !== null ? 'escrowed on the market module' : 'not for sale'}
              />
            </div>
          </Panel>

          <Panel title="traits">
            <table className="tbl">
              <thead>
                <tr>
                  <th>trait</th>
                  <th>value</th>
                  <th>share</th>
                  <th aria-label="distribution" />
                </tr>
              </thead>
              <tbody>
                {object.traits.map((t) => (
                  <tr key={t.trait}>
                    <td className="text-muted-foreground">{t.trait}</td>
                    <td className="font-mono">{t.value}</td>
                    <td className="num">{t.share}%</td>
                    <td className="w-[90px]">
                      <span className="block h-[8px] w-full border border-hair bg-surface-2">
                        <span
                          className="block h-full bg-ink"
                          style={{ width: `${Math.max(3, Math.min(100, t.share))}%` }}
                        />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <PanelNote>
              Rarity score {dec(object.rarityScore, 2)} {'\u00b7'} rank #{object.rarityRank} of{' '}
              {num(stats.supply)}. Scores are the sum of inverse trait frequencies, recomputed by the
              indexer whenever supply changes.
            </PanelNote>
          </Panel>
        </div>

        <div className="flex flex-col gap-2">
          <Panel
            title="object record"
            right={
              <span className="flex gap-1">
                <Btn href={`/collections/${slug}`}>collection</Btn>
                <Btn href={`/objects?c=${slug}`}>siblings</Btn>
              </span>
            }
          >
            <DetailList
              rows={[
                [
                  'object key',
                  <span key="k" className="flex items-center gap-2">
                    <span className="font-mono">{object.key}</span>
                    <CopyButton value={object.key} />
                  </span>,
                ],
                ['token id', <span key="t" className="num font-mono">{object.tokenId}</span>],
                [
                  'collection',
                  <span key="c" className="flex items-center gap-2">
                    <Link href={`/collections/${slug}`} className="font-mono">
                      {collection.name}
                    </Link>
                    <Chip kind={collection.standard === 'GIF-721' ? 'OK' : 'LIST'}>
                      {collection.standard}
                    </Chip>
                    {collection.verified ? <Chip kind="OK">verified</Chip> : null}
                  </span>,
                ],
                [
                  'contract',
                  <Link key="ct" href={`/contracts?c=${slug}`} className="font-mono">
                    {collection.contract}
                  </Link>,
                ],
                [
                  'owner',
                  object.burned ? (
                    <span key="o" className="flex items-center gap-2">
                      <span className="font-mono text-muted-foreground">null / burn address</span>
                      <Chip kind="BURN">burned</Chip>
                    </span>
                  ) : (
                    <AddressLink key="o" address={object.owner} len={42} />
                  ),
                ],
                ['minter', <AddressLink key="m" address={object.minter} len={42} />],
                [
                  'minted',
                  <span key="mi">
                    <Link href={`/block/${object.mintHeight}`} className="font-mono">
                      #{num(object.mintHeight)}
                    </Link>{' '}
                    <span className="text-muted-foreground">{utc(object.mintTs)}</span>
                  </span>,
                ],
                [
                  'mint tx',
                  <Link key="mh" href={`/tx/${object.mintHash}`} className="font-mono">
                    {object.mintHash}
                  </Link>,
                ],
                ['palette variant', <span key="v" className="font-mono">{['original', 'shifted', 'inverted-hue', 'monochrome'][object.variant] ?? 'original'}</span>],
                ['media', `${collection.media} \u00b7 ${object.frames} frames \u00b7 ${object.dims}`],
                ['on-chain size', `${bytes(object.bytes)} stored in the object trie`],
                [
                  'metadata uri',
                  <span key="u" className="flex items-center gap-2">
                    <span className="font-mono">gifchain://{slug}/{object.tokenId}</span>
                    <CopyButton value={`gifchain://${slug}/${object.tokenId}`} />
                  </span>,
                ],
                [
                  'royalty',
                  `${collection.royaltyBps / 100}% to ${collection.creator.slice(0, 10)}\u2026 on every settled sale`,
                ],
              ]}
            />
          </Panel>

          <Panel title="provenance">
            <EventsTable events={history} showObject={false} />
            <PanelNote>
              Full lifecycle of this object, oldest transaction at the bottom. Every row is a state
              transition committed to an object root.
            </PanelNote>
          </Panel>

          <Panel title="raw object bytes">
            <pre className="overflow-x-auto p-2 font-mono text-[10px] leading-[1.6] text-muted-foreground">
              {dump
                .map((line, i) => `${(i * 24).toString(16).padStart(8, '0')}  ${line.match(/.{1,4}/g)?.join(' ')}`)
                .join('\n')}
              {'\n'}
              {'\u2026'} {bytes(object.bytes)} total, header + palette + {object.frames} frame
              {object.frames === 1 ? '' : 's'}
            </pre>
          </Panel>
        </div>
      </div>

      <Panel title={`more from ${collection.name}`} right={<Btn href={`/objects?c=${slug}`}>view all {stats.supply}</Btn>}>
        <ObjectGrid objects={related} size={64} />
      </Panel>
    </div>
  )
}
