import type { Metadata } from 'next'
import Link from 'next/link'
import { Bars, Pager, Panel, PanelNote, Stat, TabNav } from '@/components/kit'
import { EventsTable } from '@/components/tables'
import { collections, countEvents, latestEvents, type EventType } from '@/lib/chain/data'
import { dec, num } from '@/lib/chain/format'
import { buildHref, one, pageOf, type SP } from '@/lib/paging'

export const metadata: Metadata = {
  title: 'Activity',
  description: 'Live object activity across every GIFCHAIN collection.',
}

const PER_PAGE = 40
const TYPES: EventType[] = ['MINT', 'SALE', 'TRANSFER', 'LIST', 'BID', 'BURN', 'DEPLOY']

export default async function ActivityPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams
  const typeRaw = (one(sp, 'type') ?? 'all').toUpperCase()
  const slug = one(sp, 'c')
  const type = (TYPES as string[]).includes(typeRaw) ? (typeRaw as EventType) : undefined

  let rows = latestEvents(4000, 0, type ? [type] : undefined)
  if (slug) rows = rows.filter((e) => e.slug === slug)

  const pages = Math.max(1, Math.ceil(rows.length / PER_PAGE))
  const page = pageOf(sp, pages)

  const byType = TYPES.map((t) => ({ type: t, count: countEvents([t]) }))
  const maxType = Math.max(...byType.map((b) => b.count))
  const sales = latestEvents(4000, 0, ['SALE'])
  const volume = sales.reduce((a, e) => a + (e.price ?? 0), 0)

  return (
    <div className="flex flex-col gap-2">
      <div className="panel">
        <div className="grid grid-cols-2 md:grid-cols-4">
          <Stat label="indexed operations" value={num(countEvents())} sub="hot window" />
          <Stat label="settled volume" value={`${dec(volume)} GIF`} sub={`${sales.length} sales`} />
          <Stat
            label="average sale"
            value={`${dec(volume / Math.max(1, sales.length))} GIF`}
            sub="mean, not median"
          />
          <Stat label="collections active" value={String(collections.length)} sub="all of them" />
        </div>
      </div>

      <div className="grid gap-2 lg:grid-cols-[1fr_320px]">
        <Panel title="object activity" tone="dark">
          <TabNav
            items={[
              { label: 'all', href: buildHref('/activity', sp, { type: undefined, p: undefined }), active: !type },
              ...TYPES.map((t) => ({
                label: t.toLowerCase(),
                href: buildHref('/activity', sp, { type: t, p: undefined }),
                active: type === t,
                count: countEvents([t]),
              })),
            ]}
          />
          <div className="flex flex-wrap items-center gap-1 border-b border-line bg-surface px-2 py-1">
            <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-muted-foreground">
              collection
            </span>
            <Link
              href={buildHref('/activity', sp, { c: undefined, p: undefined })}
              className="btn no-underline"
              data-on={!slug ? 'true' : undefined}
            >
              all
            </Link>
            {collections.map((c) => (
              <Link
                key={c.slug}
                href={buildHref('/activity', sp, { c: c.slug, p: undefined })}
                className="btn no-underline"
                data-on={slug === c.slug ? 'true' : undefined}
              >
                {c.symbol.toLowerCase()}
              </Link>
            ))}
          </div>
          <EventsTable events={rows.slice((page - 1) * PER_PAGE, page * PER_PAGE)} />
          <Pager
            page={page}
            pages={pages}
            total={rows.length}
            unit="operations"
            build={(p) => buildHref('/activity', sp, { p: String(p) })}
          />
        </Panel>

        <div className="flex flex-col gap-2">
          <Panel title="operations by type">
            <Bars
              rows={byType.map((b) => ({
                label: (
                  <Link href={buildHref('/activity', {}, { type: b.type })} className="font-mono">
                    {b.type.toLowerCase()}
                  </Link>
                ),
                value: b.count,
                max: maxType,
                right: num(b.count),
              }))}
            />
            <PanelNote>
              Transfers dominate because listings and bids settle through escrow, and each
              settlement emits a transfer of its own.
            </PanelNote>
          </Panel>

          <Panel title="how a sale settles">
            <ol className="flex flex-col gap-2 p-2 font-mono text-[10px] leading-relaxed text-muted-foreground">
              <li>
                <span className="text-foreground">1 list</span> {'\u2014'} the object moves into the
                market escrow account, still owned by the seller in the ownership index.
              </li>
              <li>
                <span className="text-foreground">2 bid</span> {'\u2014'} GIF is locked from the
                bidder, refundable until the listing is filled.
              </li>
              <li>
                <span className="text-foreground">3 fill</span> {'\u2014'} the protocol pays the
                seller, pays the royalty, and writes the new owner into the object trie.
              </li>
              <li>
                <span className="text-foreground">4 commit</span> {'\u2014'} the object root of the
                next block includes the mutated leaf, which is what makes the sale final.
              </li>
            </ol>
          </Panel>
        </div>
      </div>
    </div>
  )
}
