import Link from 'next/link'
import { LiveHeight } from '@/components/live/live-tip'
import { CHAIN } from '@/lib/chain/constants'

const COLUMNS: Array<{ title: string; links: Array<[string, string]> }> = [
  {
    title: 'network',
    links: [
      ['Explorer', '/explorer'],
      ['Blocks', '/blocks'],
      ['Transactions', '/txs'],
      ['Stats', '/stats'],
      ['Bridge', '/bridge'],
    ],
  },
  {
    title: 'objects',
    links: [
      ['All objects', '/objects'],
      ['Collections', '/collections'],
      ['Activity feed', '/activity'],
      ['Mint / deploy', '/mint'],
      ['Contracts', '/contracts'],
    ],
  },
  {
    title: 'build',
    links: [
      ['RPC endpoint', '/developers'],
      ['REST API', '/developers/rest'],
      ['Indexer / GraphQL', '/developers/graphql'],
      ['SDK', '/developers/sdk'],
      ['Webhooks', '/developers/webhooks'],
    ],
  },
  {
    title: 'about',
    links: [
      ['Documentation', '/docs'],
      ['Object standard', '/docs/standards'],
      ['Node operators', '/docs/nodes'],
      ['Wallets', '/wallets'],
      ['Network config', '/developers#config'],
    ],
  },
]

export function SiteFooter() {
  return (
    <footer className="mt-2">
      <div className="grid grid-cols-2 border border-line bg-surface md:grid-cols-4">
        {COLUMNS.map((c) => (
          <div key={c.title} className="border-b border-r border-hair px-2 py-2 last:border-r-0">
            <h2 className="mb-1 font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground">
              {c.title}
            </h2>
            <ul className="font-mono text-[11px]">
              {c.links.map(([label, href]) => (
                <li key={href + label} className="leading-[1.6]">
                  <Link href={href}>{label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mt-1 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border border-line bg-surface px-2 py-1 font-mono text-[10px] text-muted-foreground">
        <span>
          GIFCHAIN {CHAIN.networkId} {'\u00b7'} head <LiveHeight /> {'\u00b7'} indexer node 04{' '}
          {'\u00b7'} objects served from the object layer
        </span>
        <span>
          simulated network data {'\u00b7'} nothing here settles anywhere {'\u00b7'} built for the fun
          of it
        </span>
      </div>
    </footer>
  )
}
