import Image from 'next/image'
import Link from 'next/link'
import { CHAIN } from '@/lib/chain/constants'
import { networkStats } from '@/lib/chain/data'
import { num } from '@/lib/chain/format'
import { MainNav } from './main-nav'
import { SearchBox } from './search-box'

export function SiteHeader() {
  const stats = networkStats()
  return (
    <header className="mb-2">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5 border border-line bg-foreground px-2 py-0.5 font-mono text-[10px] text-white">
        <span className="flex flex-wrap items-center gap-x-3">
          <span className="text-lime">{CHAIN.networkId}</span>
          <span>chain id {CHAIN.chainId}</span>
          <span>
            head <span className="text-lime">#{num(stats.height)}</span>
          </span>
          <span>gas {stats.gasPrice} ngif</span>
          <span>block {stats.avgBlockTime}s</span>
        </span>
        <span className="flex flex-wrap items-center gap-x-3">
          <span className="flex items-center gap-1">
            <span aria-hidden className="inline-block h-[7px] w-[7px] bg-lime" />
            all systems operational
          </span>
          <Link href="/developers" className="text-white">
            rpc
          </Link>
          <Link href="/stats" className="text-white">
            status
          </Link>
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
          <Link href="/" className="block no-underline hover:bg-transparent">
            <span className="block font-mono text-[26px] font-bold leading-none tracking-[-0.03em] text-foreground">
              GIF<span className="bg-lime px-0.5">CHAIN</span>
            </span>
          </Link>
          <p className="mt-1 font-mono text-[11px] text-muted-foreground">
            the blockchain for NFTs &nbsp;{'\u00b7'}&nbsp; objects, not just balances
          </p>
        </div>
        <SearchBox />
      </div>

      <MainNav />
    </header>
  )
}
