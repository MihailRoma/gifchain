import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CopyButton } from '@/components/copy-button'
import { AddressLink, Bars, Btn, Chip, DetailList, Pager, Panel, PanelNote, Sprite, Stat, TabNav } from '@/components/kit'
import { EventsTable, ObjectGrid } from '@/components/tables'
import {
  collectionActivity,
  collectionStats,
  collections,
  getCollection,
  objects as allObjects,
} from '@/lib/chain/data'
import { heightToTs } from '@/lib/chain/constants'
import { dec, num, utc } from '@/lib/chain/format'
import { buildHref, one, pageOf, type SP } from '@/lib/paging'

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<SP> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const c = getCollection(slug)
  return { title: c ? c.name : 'Collection', description: c?.description }
}

export function generateStaticParams() {
  return collections.map((c) => ({ slug: c.slug }))
}

const TABS = ['objects', 'activity', 'traits', 'contract'] as const

export default async function CollectionPage({ params, searchParams }: Props) {
  const { slug } = await params
  const sp = await searchParams
  const collection = getCollection(slug)
  if (!collection) notFound()

  const stats = collectionStats(slug)
  const items = allObjects.filter((o) => o.slug === slug)
  const activity = collectionActivity(slug)
  const rawTab = one(sp, 'tab') ?? 'objects'
  const tab = (TABS as readonly string[]).includes(rawTab) ? rawTab : 'objects'

  const perPage = 48
  const pages = Math.max(1, Math.ceil(items.length / perPage))
  const page = pageOf(sp, pages)

  const traitMap = new Map<string, Map<string, number>>()
  for (const o of items) {
    for (const t of o.traits) {
      if (!traitMap.has(t.trait)) traitMap.set(t.trait, new Map())
      const inner = traitMap.get(t.trait)!
      inner.set(t.value, (inner.get(t.value) ?? 0) + 1)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Panel
        tone="lime"
        title={collection.name}
        right={
          <span className="flex items-center gap-1">
            {collection.verified ? <Chip kind="OK">verified</Chip> : null}
            <Chip kind="LIST">{collection.standard}</Chip>
            <Btn href={`/mint?c=${slug}`}>mint</Btn>
          </span>
        }
      >
        <div className="flex flex-col gap-3 p-2 md:flex-row">
          <Sprite sheet={collection.sheet} cell={0} filter={collection.filter} size={96} title={collection.name} />
          <div className="min-w-0 flex-1">
            <p className="max-w-[70ch] font-mono text-[11px] leading-relaxed">{collection.description}</p>
            <p className="mt-2 font-mono text-[10px] text-muted-foreground">
              deployed at block{' '}
              <Link href={`/block/${collection.deployHeight}`}>#{num(collection.deployHeight)}</Link>{' '}
              {'\u00b7'} category {collection.category} {'\u00b7'} media {collection.media} {'\u00b7'}{' '}
              royalty {collection.royaltyBps / 100}%
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 border-t border-line md:grid-cols-6">
          <Stat label="floor" value={`${dec(stats.floor)} GIF`} sub="lowest listing" />
          <Stat label="24h volume" value={dec(stats.volume24h)} sub={`${stats.sales} sales`} />
          <Stat label="lifetime volume" value={num(Math.round(stats.volumeTotal))} sub="GIF settled" />
          <Stat label="owners" value={String(stats.owners)} sub={`${Math.round((stats.owners / stats.supply) * 100)}% of supply`} />
          <Stat label="supply" value={String(stats.supply)} sub={`${stats.burned} burned`} />
          <Stat label="listed" value={String(stats.listed)} sub="escrowed now" />
        </div>
      </Panel>

      <Panel title={collection.symbol.toLowerCase()}>
        <TabNav
          items={TABS.map((t) => ({
            label: t,
            href: buildHref(`/collections/${slug}`, sp, { tab: t, p: undefined }),
            active: tab === t,
          }))}
        />

        {tab === 'objects' ? (
          <>
            <ObjectGrid objects={items.slice((page - 1) * perPage, page * perPage)} size={72} />
            <Pager
              page={page}
              pages={pages}
              total={items.length}
              unit="objects"
              build={(p) => buildHref(`/collections/${slug}`, sp, { p: String(p) })}
            />
          </>
        ) : null}

        {tab === 'activity' ? (
          <>
            <EventsTable events={activity.slice(0, 60)} />
            <PanelNote>
              Showing the most recent {Math.min(60, activity.length)} of {activity.length} indexed
              operations for this collection.
            </PanelNote>
          </>
        ) : null}

        {tab === 'traits' ? (
          <div className="grid gap-2 p-2 md:grid-cols-2">
            {Array.from(traitMap.entries()).map(([trait, values]) => (
              <div key={trait} className="border border-line">
                <div className="border-b border-line bg-surface-2 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.08em]">
                  {trait}
                </div>
                <Bars
                  rows={Array.from(values.entries())
                    .sort((a, b) => b[1] - a[1])
                    .map(([value, count]) => ({
                      label: <span className="font-mono">{value}</span>,
                      value: count,
                      max: items.length,
                      right: `${count} \u00b7 ${Math.round((count / items.length) * 100)}%`,
                    }))}
                />
              </div>
            ))}
          </div>
        ) : null}

        {tab === 'contract' ? (
          <DetailList
            rows={[
              [
                'contract address',
                <span key="c" className="flex items-center gap-2">
                  <span className="font-mono">{collection.contract}</span>
                  <CopyButton value={collection.contract} />
                </span>,
              ],
              ['standard', collection.standard],
              ['symbol', collection.symbol],
              ['creator', <AddressLink key="cr" address={collection.creator} len={42} />],
              [
                'deployed',
                <span key="d">
                  block <Link href={`/block/${collection.deployHeight}`}>#{num(collection.deployHeight)}</Link>{' '}
                  <span className="text-muted-foreground">{utc(heightToTs(collection.deployHeight))}</span>
                </span>,
              ],
              ['royalty', `${collection.royaltyBps} bps (${collection.royaltyBps / 100}%)`],
              ['max supply', `${collection.supply} (sealed)`],
              ['mint module', 'protocol default, no allowlist'],
              ['metadata', 'stored on chain in the object trie, no external URI'],
              [
                'interfaces',
                <span key="i" className="font-mono">
                  {collection.standard}, GIF-165 (introspection), GIF-2981 (royalties)
                </span>,
              ],
              [
                'read the collection',
                <pre key="p" className="whitespace-pre-wrap font-mono text-[10px] leading-[1.6]">
{`const c = chain.collection("${collection.slug}")
await c.totalSupply()   // ${collection.supply}
await c.ownerOf(1)      // 0x...
await c.objectOf(1)     // Uint8Array, raw frames`}
                </pre>,
              ],
            ]}
          />
        ) : null}
      </Panel>
    </div>
  )
}
