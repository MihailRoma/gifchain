import Link from 'next/link'
import { LiveHeight } from '@/components/live/live-tip'
import { CHAIN } from '@/lib/chain/constants'
import { measuredBlockTime, networkStats } from '@/lib/chain/data'
import { dec } from '@/lib/chain/format'
import { EXPLORER_DOMAIN, ROOT_DOMAIN, explorerHome } from '@/lib/site'
import { ExplorerNav } from './explorer-nav'
import { SearchBox } from './search-box'

/**
 * Chrome for explorer.claudechain.ai. Deliberately unlike the protocol site: no
 * marketing copy, search promoted to the top, and the network readout carrying
 * the live head.
 */
export function ExplorerHeader({ onExplorerHost }: { onExplorerHost: boolean }) {
  const stats = networkStats()
  const home = explorerHome(onExplorerHost)
  const protocolHref = onExplorerHost ? `https://${ROOT_DOMAIN}` : '/'

  return (
    <header className="mb-2">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5 border border-line bg-ink px-2 py-0.5 font-mono text-[10px] text-foreground">
        <span className="flex flex-wrap items-center gap-x-3">
          <span className="text-clay">{CHAIN.networkId}</span>
          <span>
            CLAUDE <span className="text-clay">${dec(CHAIN.claudePriceUsd)}</span>
          </span>
          <span>
            head{' '}
            <span className="text-clay">
              #<LiveHeight />
            </span>
          </span>
          <span>{measuredBlockTime(1000).toFixed(2)}s block</span>
          <span>{stats.gasPrice} ncl</span>
        </span>
        <span className="flex flex-wrap items-center gap-x-3">
          <span className="flex items-center gap-1">
            <span aria-hidden className="inline-block h-[7px] w-[7px] bg-clay" />
            indexer synced
          </span>
          <a href={protocolHref} className="text-foreground">
            {ROOT_DOMAIN}
          </a>
        </span>
      </div>

      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-2 border border-line bg-surface px-2 py-2">
        <div>
          <Link href={home} className="block no-underline hover:bg-transparent">
            <span className="block font-mono text-[22px] font-bold leading-none tracking-[-0.03em] text-foreground">
              CLAUDE<span className="bg-clay px-0.5 text-clay-foreground">SCAN</span>
            </span>
          </Link>
          <p className="mt-1 font-mono text-[10px] text-muted-foreground">{EXPLORER_DOMAIN}</p>
        </div>
        <div className="min-w-[260px] flex-1">
          <SearchBox big />
          <p className="mt-1 font-mono text-[10px] text-muted-foreground">
            search by block height, transaction hash, account address, agent name or swarm
          </p>
        </div>
      </div>

      <ExplorerNav homeHref={home} />
    </header>
  )
}
