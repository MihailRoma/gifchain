import type { Metadata } from 'next'
import { Pager, Panel, PanelNote, Stat } from '@/components/kit'
import { BlocksTable } from '@/components/tables'
import { CHAIN } from '@/lib/chain/constants'
import { latestBlocks, networkStats } from '@/lib/chain/data'
import { dec, num } from '@/lib/chain/format'
import { buildHref, pageOf, type SP } from '@/lib/paging'

export const metadata: Metadata = {
  title: 'Blocks',
  description: 'Every block produced by the GIFCHAIN sequencer set, with object operations included.',
}

const PER_PAGE = 25

export default async function BlocksPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams
  const pages = Math.ceil(CHAIN.indexWindow / PER_PAGE)
  const page = pageOf(sp, pages)
  const blocks = latestBlocks(PER_PAGE, (page - 1) * PER_PAGE)
  const stats = networkStats()

  const windowBlocks = latestBlocks(120)
  const avgTx = windowBlocks.reduce((a, b) => a + b.txCount, 0) / windowBlocks.length
  const avgGas = windowBlocks.reduce((a, b) => a + b.gasUsed, 0) / windowBlocks.length

  return (
    <div className="flex flex-col gap-2">
      <div className="panel">
        <div className="grid grid-cols-2 md:grid-cols-5">
          <Stat label="head" value={num(stats.height)} sub="latest sealed block" />
          <Stat label="block time" value={`${stats.avgBlockTime}s`} sub="p50, last 1000 blocks" />
          <Stat label="avg txs / block" value={avgTx.toFixed(2)} sub="last 120 blocks" />
          <Stat label="avg gas used" value={num(Math.round(avgGas))} sub={`limit ${num(30_000_000)}`} />
          <Stat label="sequencers" value="8 / 8" sub="round robin, 1 epoch" />
        </div>
      </div>

      <Panel
        title="blocks"
        right={
          <form action="/search" method="get" className="flex items-center gap-1">
            <label className="sr-only" htmlFor="jump">
              Jump to block height
            </label>
            <input id="jump" name="q" placeholder="jump to height" className="w-[130px]" inputMode="numeric" />
            <button className="btn" type="submit">
              go
            </button>
          </form>
        }
      >
        <BlocksTable blocks={blocks} />
        <Pager
          page={page}
          pages={pages}
          total={CHAIN.indexWindow}
          unit="blocks in the hot window"
          build={(p) => buildHref('/blocks', sp, { p: String(p) })}
        />
        <PanelNote>
          The object indexer keeps the last {num(CHAIN.indexWindow)} blocks hot. Older blocks are
          still reachable by height, for example{' '}
          <a href={`/block/${CHAIN.headHeight - 1_000_000}`}>#{num(CHAIN.headHeight - 1_000_000)}</a>
          , they are just served from cold storage. Fees are shown in GIF and include the object
          storage surcharge ({dec(0.0004, 4)} GIF per KB written).
        </PanelNote>
      </Panel>
    </div>
  )
}
