import type { Metadata } from 'next'
import Link from 'next/link'
import { Bars, Btn, Panel, PanelNote, Sprite, Stat, TabNav } from '@/components/kit'
import { CollectionsTable } from '@/components/tables'
import { collectionStats, trendingCollections } from '@/lib/chain/data'
import { dec, num } from '@/lib/chain/format'
import { buildHref, one, type SP } from '@/lib/paging'

export const metadata: Metadata = {
  title: 'Collections',
  description: 'Verified and unverified object collections deployed on GIFCHAIN.',
}

export default async function CollectionsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams
  const cat = one(sp, 'cat') ?? 'all'
  const sort = one(sp, 'sort') ?? 'volume'

  const all = trendingCollections()
  const categories = Array.from(new Set(all.map((c) => c.category)))
  let rows = cat === 'all' ? all : all.filter((c) => c.category === cat)
  rows = [...rows].sort((a, b) => {
    switch (sort) {
      case 'floor':
        return b.stats.floor - a.stats.floor
      case 'supply':
        return b.supply - a.supply
      case 'owners':
        return b.stats.owners - a.stats.owners
      case 'oldest':
        return a.deployHeight - b.deployHeight
      default:
        return b.stats.volume24h - a.stats.volume24h
    }
  })

  const totalSupply = all.reduce((a, c) => a + c.supply, 0)
  const totalVolume = all.reduce((a, c) => a + c.stats.volume24h, 0)
  const maxVol = Math.max(...all.map((c) => c.stats.volumeTotal))

  return (
    <div className="flex flex-col gap-2">
      <div className="panel">
        <div className="grid grid-cols-2 md:grid-cols-4">
          <Stat label="collections" value={String(all.length)} sub={`${all.filter((c) => c.verified).length} verified`} />
          <Stat label="objects issued" value={num(totalSupply)} sub="across all standards" />
          <Stat label="24h volume" value={`${dec(totalVolume)} GIF`} sub="settled on the market module" />
          <Stat label="median floor" value={`${dec(all.map((c) => c.stats.floor).sort((a, b) => a - b)[Math.floor(all.length / 2)])} GIF`} sub="lowest active listing" />
        </div>
      </div>

      <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
        {all.slice(0, 4).map((c) => (
          <Panel key={c.slug} title={c.symbol.toLowerCase()} right={c.verified ? <span className="chip chip-ok">verified</span> : null}>
            <div className="flex gap-2 p-2">
              <Link href={`/collections/${c.slug}`} className="shrink-0 no-underline hover:bg-transparent">
                <Sprite sheet={c.sheet} cell={0} filter={c.filter} size={56} title={c.name} />
              </Link>
              <div className="min-w-0">
                <Link href={`/collections/${c.slug}`} className="block truncate font-mono text-[12px]">
                  {c.name}
                </Link>
                <p className="mt-1 font-mono text-[10px] leading-[1.5] text-muted-foreground">
                  floor {dec(c.stats.floor)} GIF {'\u00b7'} {c.stats.owners} owners
                  <br />
                  {c.supply} supply {'\u00b7'} {c.standard}
                </p>
              </div>
            </div>
          </Panel>
        ))}
      </div>

      <Panel title="all collections">
        <TabNav
          items={[
            { label: 'all', href: buildHref('/collections', sp, { cat: undefined }), active: cat === 'all', count: all.length },
            ...categories.map((c) => ({
              label: c,
              href: buildHref('/collections', sp, { cat: c }),
              active: cat === c,
              count: all.filter((x) => x.category === c).length,
            })),
          ]}
        />
        <div className="flex flex-wrap items-center gap-1 border-b border-line bg-surface px-2 py-1">
          <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-muted-foreground">sort</span>
          {[
            ['volume', '24h volume'],
            ['floor', 'floor price'],
            ['supply', 'supply'],
            ['owners', 'owners'],
            ['oldest', 'deploy height'],
          ].map(([key, label]) => (
            <Link
              key={key}
              href={buildHref('/collections', sp, { sort: key })}
              className="btn no-underline"
              data-on={sort === key ? 'true' : undefined}
            >
              {label}
            </Link>
          ))}
        </div>
        <CollectionsTable rows={rows} />
        <PanelNote>
          Floor is derived from live escrowed listings only. A collection with no active listing
          falls back to its last settled sale, which is marked by the indexer rather than the
          protocol.
        </PanelNote>
      </Panel>

      <div className="grid gap-2 lg:grid-cols-2">
        <Panel title="lifetime settled volume">
          <Bars
            rows={all.map((c) => ({
              label: (
                <Link href={`/collections/${c.slug}`} className="font-mono">
                  {c.symbol}
                </Link>
              ),
              value: c.stats.volumeTotal,
              max: maxVol,
              right: `${num(Math.round(c.stats.volumeTotal))} GIF`,
            }))}
          />
        </Panel>
        <Panel title="holder concentration" right={<Btn href="/wallets">wallet leaderboard</Btn>}>
          <Bars
            rows={all.map((c) => {
              const s = collectionStats(c.slug)
              return {
                label: (
                  <Link href={`/collections/${c.slug}`} className="font-mono">
                    {c.symbol}
                  </Link>
                ),
                value: Math.round((s.owners / s.supply) * 100),
                max: 100,
                right: `${Math.round((s.owners / s.supply) * 100)}% unique`,
              }
            })}
          />
          <PanelNote>
            Unique owners divided by supply. Lower numbers mean the supply is concentrated in fewer
            wallets, which usually shows up as a thin floor.
          </PanelNote>
        </Panel>
      </div>
    </div>
  )
}
