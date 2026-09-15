import Image from 'next/image'
import Link from 'next/link'
import { headers } from 'next/headers'
import { LiveHeight } from '@/components/live/live-tip'
import { CHAIN } from '@/lib/chain/constants'
import { measuredBlockTime, networkStats } from '@/lib/chain/data'
import { explorerLinkFor } from '@/lib/site'
import { MainNav } from './main-nav'
import { SearchBox } from './search-box'

export async function SiteHeader() {
  const stats = networkStats()
  const host = ((await headers()).get('host') ?? '').split(':')[0].toLowerCase()
  const explorerHref = explorerLinkFor(host)
  return (
    <header className="mb-2">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5 border border-line bg-foreground px-2 py-0.5 font-mono text-[10px] text-white">
        <span className="flex flex-wrap items-center gap-x-3">
          <span className="text-lime">{CHAIN.networkId}</span>
          <span>chain id {CHAIN.chainId}</span>
          <span>
            head{' '}
            <span className="text-lime">
              #<LiveHeight />
            </span>
          </span>
          <span>gas {stats.gasPrice} ngif</span>
          <span>block {measuredBlockTime(1000).toFixed(2)}s</span>
        </span>
        <span className="flex flex-wrap items-center gap-x-3">
          <span className="flex items-center gap-1">
            <span aria-hidden className="inline-block h-[7px] w-[7px] bg-lime" />
            all systems operational
          </span>
          <a
            href="https://ponsfamily.com/launchpad/0x7f166fb1b5bdd2e94e89d7bb35a13d85ec74850f"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-lime px-1 font-bold text-foreground no-underline hover:bg-lime"
          >
            $GIFCHAIN
          </a>
          <Link href="/developers" className="text-white">
            rpc
          </Link>
          <a
            href={explorerHref}
            target="_blank"
            rel="noopener noreferrer"
            className="text-white"
          >
            explorer
          </a>
          <Link href="/docs" className="text-white">
            docs
          </Link>
        </span>
      </div>

      <div className="mt-1 flex flex-wrap items-center gap-3 border border-line bg-surface px-2 py-2">
        <Link href="/" className="no-underline hover:bg-transparent" aria-label="GIFCHAIN home">
          <Image
            src="/gifchain-logo-nobg.png"
            alt="GIFCHAIN"
            width={58}
            height={58}
            className="block [image-rendering:pixelated]"
            priority
          />
        </Link>
        <div className="mr-auto">
          <h1 className="m-0">
            <Link href="/" className="block no-underline hover:bg-transparent">
              <span className="block font-mono text-[26px] font-bold leading-none tracking-[-0.03em] text-foreground">
                GIF<span className="bg-lime px-0.5">CHAIN</span>
              </span>
            </Link>
          </h1>
          <p className="mt-1 font-mono text-[11px] text-muted-foreground">
            the blockchain for NFTs &nbsp;{'\u00b7'}&nbsp; objects, not just balances
          </p>
        </div>
        <SearchBox />
      </div>

      <MainNav explorerHref={explorerHref} />
    </header>
  )
}
