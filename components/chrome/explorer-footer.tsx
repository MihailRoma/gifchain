import Link from 'next/link'
import { LiveHeight } from '@/components/live/live-tip'
import { CHAIN } from '@/lib/chain/constants'
import { EXPLORER_DOMAIN, ROOT_DOMAIN } from '@/lib/site'

const COLUMNS: Array<{ title: string; links: Array<[string, string]> }> = [
  {
    title: 'chain',
    links: [
      ['Blocks', '/blocks'],
      ['Transactions', '/txs'],
      ['Accounts', '/wallets'],
      ['Contracts', '/contracts'],
    ],
  },
  {
    title: 'agents',
    links: [
      ['Inference feed', '/activity'],
      ['All agents', '/agents'],
      ['Swarms', '/swarms'],
      ['Analytics', '/stats'],
    ],
  },
]

/** Chrome for explorer.claudechain.ai. Utility links only; no marketing surface. */
export function ExplorerFooter({ onExplorerHost }: { onExplorerHost: boolean }) {
  const root = onExplorerHost ? `https://${ROOT_DOMAIN}` : '/'
  const prefix = root === '/' ? '' : root

  return (
    <footer className="mt-2">
      <div className="grid grid-cols-2 border border-line bg-surface md:grid-cols-4">
        {COLUMNS.map((c) => (
          <div key={c.title} className="border-b border-r border-hair px-2 py-2">
            <h2 className="mb-1 font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground">
              {c.title}
            </h2>
            <ul className="font-mono text-[11px]">
              {c.links.map(([label, href]) => (
                <li key={href} className="leading-[1.6]">
                  <Link href={href}>{label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <div className="border-b border-r border-hair px-2 py-2">
          <h2 className="mb-1 font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground">
            developers
          </h2>
          <ul className="font-mono text-[11px]">
            <li className="leading-[1.6]">
              <a href={`${prefix}/developers`}>RPC endpoint</a>
            </li>
            <li className="leading-[1.6]">
              <a href={`${prefix}/developers/rest`}>REST API</a>
            </li>
            <li className="leading-[1.6]">
              <a href={`${prefix}/developers/graphql`}>GraphQL</a>
            </li>
            <li className="leading-[1.6]">
              <a href={`${prefix}/docs`}>Documentation</a>
            </li>
          </ul>
        </div>
        <div className="border-b border-hair px-2 py-2">
          <h2 className="mb-1 font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground">
            network
          </h2>
          <ul className="font-mono text-[11px] text-muted-foreground">
            <li className="leading-[1.6]">chain id {CHAIN.chainId}</li>
            <li className="leading-[1.6]">{CHAIN.networkId}</li>
            <li className="leading-[1.6]">
              head <LiveHeight />
            </li>
            <li className="leading-[1.6]">
              <a href={root}>{ROOT_DOMAIN}</a>
            </li>
          </ul>
        </div>
      </div>
      <div className="mt-1 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border border-line bg-surface px-2 py-1 font-mono text-[10px] text-muted-foreground">
        <span>
          {EXPLORER_DOMAIN} {'\u00b7'} indexer node 04 {'\u00b7'} memory trie proofs verified against
          block headers
        </span>
        <span>
          simulated network data {'\u00b7'} nothing here settles anywhere {'\u00b7'} not affiliated
          with Anthropic
        </span>
      </div>
    </footer>
  )
}
