import type { Metadata } from 'next'
import Link from 'next/link'
import { CopyButton } from '@/components/copy-button'
import { Bars, Btn, Chip, DetailList, Panel, PanelNote, Stat, TabNav } from '@/components/kit'
import { EventsTable, ObjectGrid } from '@/components/tables'
import {
  collections,
  getWallet,
  holdingsValue,
  walletActivity,
  walletHoldings,
  walletName,
} from '@/lib/chain/data'
import { dec, num, trunc, utc } from '@/lib/chain/format'
import { hexFrom, rngFor } from '@/lib/chain/rng'
import { buildHref, one, type SP } from '@/lib/paging'

type Props = { params: Promise<{ address: string }>; searchParams: Promise<SP> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { address } = await params
  return { title: `Wallet ${trunc(address, 8, 6)}` }
}

const TABS = ['holdings', 'activity', 'breakdown'] as const

export default async function WalletPage({ params, searchParams }: Props) {
  const { address } = await params
  const sp = await searchParams
  const addr = decodeURIComponent(address)
  const wallet = getWallet(addr)
  const holdings = walletHoldings(addr)
  const activity = walletActivity(addr)
  const value = holdingsValue(addr)
  const rawTab = one(sp, 'tab') ?? 'holdings'
  const tab = (TABS as readonly string[]).includes(rawTab) ? rawTab : 'holdings'

  const r = rngFor(`bal:${addr}`)
  const balance = Math.round((holdings.length * 18 + r() * 4200) * 100) / 100
  const bought = activity.filter((e) => e.type === 'SALE' && e.to.toLowerCase() === addr.toLowerCase())
  const sold = activity.filter((e) => e.type === 'SALE' && e.from.toLowerCase() === addr.toLowerCase())
  const spent = bought.reduce((a, e) => a + (e.price ?? 0), 0)
  const earned = sold.reduce((a, e) => a + (e.price ?? 0), 0)

  const perCollection = collections
    .map((c) => ({ c, n: holdings.filter((o) => o.slug === c.slug).length }))
    .filter((x) => x.n > 0)
    .sort((a, b) => b.n - a.n)

  return (
    <div className="flex flex-col gap-2">
      <Panel
        tone="lime"
        title={walletName(addr) !== addr ? walletName(addr) : 'wallet'}
        right={
          <span className="flex items-center gap-1">
            {wallet ? <Chip kind={wallet.kind === 'system' ? 'BURN' : 'OK'}>{wallet.kind}</Chip> : null}
            <Btn href="/wallets">leaderboard</Btn>
          </span>
        }
      >
        <DetailList
          rows={[
            [
              'address',
              <span key="a" className="flex items-center gap-2">
                <span className="font-mono">{addr}</span>
                <CopyButton value={addr} />
              </span>,
            ],
            wallet?.handle ? ['handle', <span key="h" className="font-mono">{wallet.handle}</span>] : null,
            wallet?.label ? ['label', wallet.label] : null,
            ['GIF balance', `${dec(balance)} GIF`],
            ['objects held', `${holdings.length} live object${holdings.length === 1 ? '' : 's'}`],
            ['portfolio value', `${dec(value)} GIF (estimated)`],
            ['first seen', wallet ? utc(wallet.firstSeen) : 'not in the hot index'],
            ['indexed operations', String(activity.length)],
            [
              'public key',
              <span key="p" className="font-mono text-[10px] break-all">
                0x04{hexFrom(`pub:${addr}`, 126)}
              </span>,
            ],
          ]}
        />
        <div className="grid grid-cols-2 border-t border-line md:grid-cols-4">
          <Stat label="bought" value={`${bought.length}`} sub={`${dec(spent)} GIF spent`} />
          <Stat label="sold" value={`${sold.length}`} sub={`${dec(earned)} GIF received`} />
          <Stat
            label="net"
            value={`${earned - spent >= 0 ? '+' : ''}${dec(earned - spent)} GIF`}
            sub="settled trades only"
          />
          <Stat label="collections" value={String(perCollection.length)} sub="with at least one object" />
        </div>
      </Panel>

      <Panel title="wallet">
        <TabNav
          items={TABS.map((t) => ({
            label: t,
            href: buildHref(`/wallet/${addr}`, sp, { tab: t }),
            active: tab === t,
          }))}
        />
        {tab === 'holdings' ? (
          holdings.length ? (
            <ObjectGrid objects={holdings} size={72} />
          ) : (
            <p className="p-3 font-mono text-[11px] text-muted-foreground">
              This wallet holds no objects right now. It may have sold or burned everything, or it
              may only ever have been a counterparty.{' '}
              <Link href={buildHref(`/wallet/${addr}`, sp, { tab: 'activity' })}>
                Check its activity
              </Link>
              .
            </p>
          )
        ) : null}
        {tab === 'activity' ? <EventsTable events={activity.slice(0, 80)} /> : null}
        {tab === 'breakdown' ? (
          perCollection.length ? (
            <Bars
              rows={perCollection.map(({ c, n }) => ({
                label: (
                  <Link href={`/collections/${c.slug}`} className="font-mono">
                    {c.name}
                  </Link>
                ),
                value: n,
                max: holdings.length,
                right: `${n} \u00b7 ${Math.round((n / holdings.length) * 100)}%`,
              }))}
            />
          ) : (
            <p className="p-3 font-mono text-[11px] text-muted-foreground">Nothing to break down.</p>
          )
        ) : null}
        <PanelNote>
          Balances and portfolio values are derived from indexed state at height{' '}
          {num(activity[0]?.height ?? 0)}. Objects sitting in market escrow are still counted as
          held by their seller.
        </PanelNote>
      </Panel>
    </div>
  )
}
