import type { Metadata } from 'next'
import Link from 'next/link'
import { Chip, Pager, Panel, PanelNote, Stat, Table, TabNav } from '@/components/kit'
import { ObjectGrid } from '@/components/tables'
import { AddressLink, ObjectSprite } from '@/components/kit'
import { collections, collectionStats, objects as allObjects } from '@/lib/chain/data'
import { dec, num, shortAge } from '@/lib/chain/format'
import { buildHref, one, pageOf, type SP } from '@/lib/paging'

export const metadata: Metadata = {
  title: 'Objects',
  description: 'Every digital object stored in the GIFCHAIN object trie.',
}

const PER_PAGE = 96

const SORTS: Array<{ key: string; label: string }> = [
  { key: 'recent', label: 'newest mint' },
  { key: 'oldest', label: 'oldest mint' },
  { key: 'rarity', label: 'rarity rank' },
  { key: 'price', label: 'last price' },
  { key: 'id', label: 'token id' },
]

export default async function ObjectsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams
  const slug = one(sp, 'c')
  const sort = one(sp, 'sort') ?? 'recent'
  const view = one(sp, 'view') === 'table' ? 'table' : 'grid'
  const state = one(sp, 'state') ?? 'all'

  let rows = allObjects.filter((o) => (slug ? o.slug === slug : true))
  if (state === 'listed') rows = rows.filter((o) => o.listPrice !== null)
  if (state === 'burned') rows = rows.filter((o) => o.burned)
  if (state === 'live') rows = rows.filter((o) => !o.burned)

  rows = [...rows].sort((a, b) => {
    switch (sort) {
      case 'oldest':
        return a.mintHeight - b.mintHeight
      case 'rarity':
        return a.rarityRank - b.rarityRank || a.tokenId - b.tokenId
      case 'price':
        return (b.lastPrice ?? 0) - (a.lastPrice ?? 0)
      case 'id':
        return a.slug.localeCompare(b.slug) || a.tokenId - b.tokenId
      default:
        return b.mintHeight - a.mintHeight
    }
  })

  const pages = Math.max(1, Math.ceil(rows.length / PER_PAGE))
  const page = pageOf(sp, pages)
  const slice = rows.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  const listed = allObjects.filter((o) => o.listPrice !== null).length
  const burned = allObjects.filter((o) => o.burned).length

  return (
    <div className="flex flex-col gap-2">
      <div className="panel">
        <div className="grid grid-cols-2 md:grid-cols-4">
          <Stat label="objects indexed" value={num(allObjects.length)} sub="across 8 collections" />
          <Stat label="live" value={num(allObjects.length - burned)} sub="not burned" />
          <Stat label="listed" value={num(listed)} sub="escrowed on the market module" />
          <Stat label="burned" value={num(burned)} sub="owned by the null address" />
        </div>
      </div>

      <Panel
        title="object explorer"
        right={
          <span className="flex gap-1">
            <Link
              href={buildHref('/objects', sp, { view: 'grid' })}
              className="btn no-underline"
              data-on={view === 'grid' ? 'true' : undefined}
            >
              grid
            </Link>
            <Link
              href={buildHref('/objects', sp, { view: 'table' })}
              className="btn no-underline"
              data-on={view === 'table' ? 'true' : undefined}
            >
              table
            </Link>
          </span>
        }
      >
        <TabNav
          items={[
            { label: 'all collections', href: buildHref('/objects', sp, { c: undefined, p: undefined }), active: !slug },
            ...collections.map((c) => ({
              label: c.symbol.toLowerCase(),
              href: buildHref('/objects', sp, { c: c.slug, p: undefined }),
              active: slug === c.slug,
              count: c.supply,
            })),
          ]}
        />
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-line bg-surface px-2 py-1">
          <span className="flex items-center gap-1">
            <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-muted-foreground">
              sort
            </span>
            {SORTS.map((s) => (
              <Link
                key={s.key}
                href={buildHref('/objects', sp, { sort: s.key, p: undefined })}
                className="btn no-underline"
                data-on={sort === s.key ? 'true' : undefined}
              >
                {s.label}
              </Link>
            ))}
          </span>
          <span className="flex items-center gap-1">
            <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-muted-foreground">
              state
            </span>
            {['all', 'live', 'listed', 'burned'].map((s) => (
              <Link
                key={s}
                href={buildHref('/objects', sp, { state: s, p: undefined })}
                className="btn no-underline"
                data-on={state === s ? 'true' : undefined}
              >
                {s}
              </Link>
            ))}
          </span>
        </div>

        {view === 'grid' ? (
          <ObjectGrid objects={slice} size={72} />
        ) : (
          <Table>
            <thead>
              <tr>
                <th aria-label="preview" />
                <th>object</th>
                <th>collection</th>
                <th>owner</th>
                <th>rarity</th>
                <th>last price</th>
                <th>listed</th>
                <th>minted</th>
                <th>state</th>
              </tr>
            </thead>
            <tbody>
              {slice.map((o) => (
                <tr key={o.key}>
                  <td className="w-[26px] p-[2px]">
                    <Link href={`/object/${o.slug}/${o.tokenId}`} className="inline-block shrink-0 no-underline hover:bg-transparent">
                      <ObjectSprite object={o} size={22} />
                    </Link>
                  </td>
                  <td>
                    <Link href={`/object/${o.slug}/${o.tokenId}`} className="font-mono">
                      {o.name}
                    </Link>
                  </td>
                  <td>
                    <Link href={`/collections/${o.slug}`} className="font-mono">
                      {o.slug}
                    </Link>
                  </td>
                  <td>
                    <AddressLink address={o.owner} />
                  </td>
                  <td className="num">
                    #{o.rarityRank}{' '}
                    <span className="text-muted-foreground">/ {collectionStats(o.slug).supply}</span>
                  </td>
                  <td className="num">
                    {o.lastPrice !== null ? dec(o.lastPrice) : <span className="text-muted-foreground">{'\u2014'}</span>}
                  </td>
                  <td className="num">
                    {o.listPrice !== null ? dec(o.listPrice) : <span className="text-muted-foreground">{'\u2014'}</span>}
                  </td>
                  <td className="text-muted-foreground">{shortAge(o.mintTs)}</td>
                  <td>
                    {o.burned ? <Chip kind="BURN">burned</Chip> : o.listPrice !== null ? <Chip kind="LIST">listed</Chip> : <Chip kind="TRANSFER">held</Chip>}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}

        <Pager
          page={page}
          pages={pages}
          total={rows.length}
          unit="objects"
          build={(p) => buildHref('/objects', sp, { p: String(p) })}
        />
        <PanelNote>
          Previews are rendered from the frames stored in the object trie. Palette variants
          (original, shifted, monochrome) are a property of the object itself, not a rendering
          option applied by this explorer.
        </PanelNote>
      </Panel>
    </div>
  )
}
