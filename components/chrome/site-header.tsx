import Link from 'next/link'
import { headers } from 'next/headers'
import { Glyph } from '@/components/glyph'
import { LiveHeight } from '@/components/live/live-tip'
import { CHAIN } from '@/lib/chain/constants'
import { measuredBlockTime, networkStats } from '@/lib/chain/data'
import { num } from '@/lib/chain/format'
import { TOKEN_URL, explorerLinkFor } from '@/lib/site'
import { MainNav } from './main-nav'
import { SearchBox } from './search-box'

export async function SiteHeader() {
  const stats = networkStats()
  const host = ((await headers()).get('host') ?? '').split(':')[0].toLowerCase()
  const explorerHref = explorerLinkFor(host)
  return (
    <header className="mb-2">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5 border border-line bg-ink px-2 py-0.5 font-mono text-[10px] text-foreground">
        <span className="flex flex-wrap items-center gap-x-3">
          <span className="text-clay">{CHAIN.networkId}</span>
          <span>chain id {CHAIN.chainId}</span>
          <span>
            head{' '}
            <span className="text-clay">
              #<LiveHeight />
            </span>
          </span>
          <span>gas {stats.gasPrice} ncl</span>
          <span>block {measuredBlockTime(1000).toFixed(2)}s</span>
          <span className="hidden sm:inline">{num(stats.thinking)} agents thinking</span>
        </span>
        <span className="flex flex-wrap items-center gap-x-3">
          <span className="flex items-center gap-1">
            <span aria-hidden className="inline-block h-[7px] w-[7px] bg-clay" />
            all sealers live
          </span>
          <a
            href={TOKEN_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-clay px-1 font-bold text-clay-foreground no-underline hover:bg-clay"
          >
            $CLAUDECHAIN
          </a>
          <Link href="/developers" className="text-foreground">
            rpc
          </Link>
          <a href={explorerHref} target="_blank" rel="noopener noreferrer" className="text-foreground">
            explorer
          </a>
          <Link href="/docs" className="text-foreground">
            docs
          </Link>
        </span>
      </div>

      <div className="mt-1 flex flex-wrap items-center gap-3 border border-line bg-surface px-2 py-2">
        <Link href="/" className="no-underline hover:bg-transparent" aria-label="CLAUDECHAIN home">
          <Glyph seed="claudechain-mainnet-1" tier="opus" size={52} title="CLAUDECHAIN" />
        </Link>
        <div className="mr-auto">
          <h1 className="m-0">
            <Link href="/" className="block no-underline hover:bg-transparent">
              <span className="block font-mono text-[26px] font-bold leading-none tracking-[-0.03em] text-foreground">
                CLAUDE<span className="bg-clay px-0.5 text-clay-foreground">CHAIN</span>
              </span>
            </Link>
          </h1>
          <p className="mt-1 font-mono text-[11px] text-muted-foreground">
            the blockchain that thinks &nbsp;{'\u00b7'}&nbsp; inference, not just balances
          </p>
        </div>
        <SearchBox />
      </div>

      <MainNav explorerHref={explorerHref} />
    </header>
  )
}
