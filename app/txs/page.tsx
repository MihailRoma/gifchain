import type { Metadata } from 'next'
import { Pager, Panel, PanelNote, Stat, TabNav } from '@/components/kit'
import { LiveTxs } from '@/components/live/live-txs'
import { EventsTable } from '@/components/tables'
import { countEvents, latestEvents, spritePool, type EventType } from '@/lib/chain/data'
import { num } from '@/lib/chain/format'
import { buildHref, one, pageOf, type SP } from '@/lib/paging'

export const metadata: Metadata = {
  title: 'Transactions',
  description: 'Object transactions on GIFCHAIN: mints, sales, transfers, listings, bids and burns.',
}

const PER_PAGE = 30
const TYPES: Array<EventType | 'ALL'> = ['ALL', 'MINT', 'SALE', 'TRANSFER', 'LIST', 'BID', 'BURN', 'DEPLOY']

export default async function TxsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams
  const raw = (one(sp, 'type') ?? 'ALL').toUpperCase()
  const active = (TYPES as string[]).includes(raw) ? (raw as EventType | 'ALL') : 'ALL'
  const filter = active === 'ALL' ? undefined : [active]
  const total = countEvents(filter)
  const pages = Math.max(1, Math.ceil(total / PER_PAGE))
  const page = pageOf(sp, pages)
  const events = latestEvents(PER_PAGE, (page - 1) * PER_PAGE, filter)

  return (
    <div className="flex flex-col gap-2">
      <div className="panel">
        <div className="grid grid-cols-2 md:grid-cols-4">
          <Stat label="indexed transactions" value={num(countEvents())} sub="hot window" />
          <Stat label="mints" value={num(countEvents(['MINT']))} sub="all standards" />
          <Stat label="sales" value={num(countEvents(['SALE']))} sub="native market module" />
          <Stat label="burns" value={num(countEvents(['BURN']))} sub="sent to null address" />
        </div>
      </div>

      <Panel title="transactions" tone="dark">
        <TabNav
          items={TYPES.map((t) => ({
            label: t.toLowerCase(),
            href: buildHref('/txs', sp, { type: t === 'ALL' ? undefined : t, p: undefined }),
            active: active === t,
            count: t === 'ALL' ? countEvents() : countEvents([t as EventType]),
          }))}
        />
        {/* Unfiltered page one is the tip of the chain and streams. Any filter
            or deeper page is a history query and stays server-rendered. */}
        {page === 1 && active === 'ALL' ? (
          <LiveTxs pool={spritePool()} limit={PER_PAGE} />
        ) : (
          <EventsTable events={events} />
        )}
        <Pager
          page={page}
          pages={pages}
          total={total}
          unit="transactions"
          build={(p) => buildHref('/txs', sp, { p: String(p) })}
        />
        <PanelNote>
          Every row is a real state transition on the object trie. Fungible GIF transfers are
          settled in the same blocks but are not object operations, so they are excluded from this
          view.
        </PanelNote>
      </Panel>
    </div>
  )
}
