import Link from 'next/link'
import { SearchBox } from '@/components/chrome/search-box'
import { CopyButton } from '@/components/copy-button'
import { BarChart, Btn, ObjectSprite, Panel, PanelNote, Stat } from '@/components/kit'
import { LiveBlocks } from '@/components/live/live-blocks'
import { LiveHeight } from '@/components/live/live-tip'
import { LiveTxs } from '@/components/live/live-txs'
import { CollectionsTable, ObjectGrid } from '@/components/tables'
import { CHAIN } from '@/lib/chain/constants'
import {
  dailySeries,
  networkStats,
  objects,
  recentMints,
  spritePool,
  trendingCollections,
  liveHead,
} from '@/lib/chain/data'
import { dec, num } from '@/lib/chain/format'

export default function HomePage() {
  const stats = networkStats()
  const mints = recentMints(24)
  const trending = trendingCollections().slice(0, 8)
  const series = dailySeries()
  const mosaic = objects.filter((o) => !o.burned).slice(0, 36)

  return (
    <div className="flex flex-col gap-2">
      {/* intro ---------------------------------------------------------- */}
      <Panel
        tone="lime"
        title="GIFCHAIN / mainnet"
        right={
          <span className="font-mono text-[10px] normal-case">
            genesis 2024-11-02 {'\u00b7'} {num(liveHead())} blocks produced
          </span>
        }
      >
        <div className="flex flex-col gap-2 p-2 md:flex-row">
          <div className="md:w-[54%]">
            <h1 className="font-mono text-[22px] font-bold leading-tight tracking-[-0.02em]">
              The blockchain for NFTs.
            </h1>
            <p className="mt-2 max-w-[62ch] text-[12px] leading-relaxed">
              GIFCHAIN is a layer-1 network where the <strong>object</strong> is the primary unit of
              state. Balances exist, but they are a side effect. Every block commits an object root
              alongside the state root, so transfers, mints and burns of digital objects are settled
              by the protocol rather than tracked by an indexer bolted on afterwards.
            </p>
            <p className="mt-2 max-w-[62ch] text-[12px] leading-relaxed">
              Media lives on chain. A GIF-721 object carries its own frames, palette and dimensions
              in the object trie, which is why every page of this explorer can show you the artwork
              without asking a server somewhere else for it.
            </p>
            <div className="mt-3 flex flex-wrap gap-1">
              <Btn href="/explorer">open explorer</Btn>
              <Btn href="/objects">browse objects</Btn>
              <Btn href="/mint">deploy a collection</Btn>
              <Btn href="/developers">rpc + api</Btn>
              <Btn href="/docs">read the docs</Btn>
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-x-4 font-mono text-[11px]">
              <div className="flex justify-between border-b border-hair py-[2px]">
                <dt className="text-muted-foreground">consensus</dt>
                <dd>proof of custody</dd>
              </div>
              <div className="flex justify-between border-b border-hair py-[2px]">
                <dt className="text-muted-foreground">object standard</dt>
                <dd>GIF-721 / GIF-1155</dd>
              </div>
              <div className="flex justify-between border-b border-hair py-[2px]">
                <dt className="text-muted-foreground">block time</dt>
                <dd>{stats.avgBlockTime}s</dd>
              </div>
              <div className="flex justify-between border-b border-hair py-[2px]">
                <dt className="text-muted-foreground">finality</dt>
                <dd>2 blocks</dd>
              </div>
              <div className="flex justify-between border-b border-hair py-[2px]">
                <dt className="text-muted-foreground">gas token</dt>
                <dd>GIF</dd>
              </div>
              <div className="flex justify-between border-b border-hair py-[2px]">
                <dt className="text-muted-foreground">max object size</dt>
                <dd>64 KB</dd>
              </div>
            </dl>
          </div>
          <div className="flex-1 border border-line bg-surface-2">
            <div className="panel-hd panel-hd--plain">
              <span>objects on chain</span>
              <Link href="/objects" className="font-mono text-[10px] normal-case">
                view all {stats.objects}
              </Link>
            </div>
            <ObjectGrid objects={mosaic} size={44} showLabels={false} />
          </div>
        </div>
      </Panel>

      {/* search --------------------------------------------------------- */}
      <Panel title="universal search" tone="dark">
        <div className="p-2">
          <SearchBox big />
          <p className="mt-1 font-mono text-[10px] text-muted-foreground">
            accepts: block height {'\u00b7'} block hash {'\u00b7'} transaction hash {'\u00b7'} wallet
            address {'\u00b7'} contract address {'\u00b7'} collection name {'\u00b7'} object name
            {'  '}
            <Link href="/search?q=gifcats">try GIFCATS</Link> {'\u00b7'}{' '}
            <Link href={`/search?q=${liveHead()}`}>try {num(liveHead())}</Link>
          </p>
        </div>
      </Panel>

      {/* stats ---------------------------------------------------------- */}
      <div className="panel">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5">
          <Stat label="latest block" value={<LiveHeight />} sub="5s target slot" href="/blocks" />
          <Stat label="objects on chain" value={num(stats.objects)} sub={`${stats.burned} burned`} href="/objects" />
          <Stat label="collections" value={num(stats.collections)} sub="8 verified" href="/collections" />
          <Stat label="transfers (24h)" value={num(stats.transfers24h)} sub="object layer only" href="/activity" />
          <Stat label="mints (24h)" value={num(stats.mints24h)} sub="all standards" href="/activity?type=MINT" />
          <Stat label="24h volume" value={`${dec(stats.volume24h)} GIF`} sub={`$${num(Math.round(stats.volume24h * CHAIN.gifPriceUsd))}`} href="/stats" />
          <Stat label="active wallets" value={num(stats.activeWallets)} sub="24h, unique senders" href="/wallets" />
          <Stat label="total transactions" value={num(stats.txTotal)} sub="since genesis" href="/txs" />
          <Stat label="gas price" value={`${stats.gasPrice} ngif`} sub="p50, last 100 blocks" href="/stats" />
          <Stat label="network" value="operational" sub="8/8 sequencers" href="/stats" />
        </div>
      </div>

      {/* blocks + activity ---------------------------------------------- */}
      <div className="grid gap-2 lg:grid-cols-2">
        <Panel
          title="latest blocks"
          right={
            <Link href="/blocks" className="font-mono text-[10px] normal-case">
              all blocks
            </Link>
          }
        >
          <LiveBlocks pool={spritePool()} limit={8} compact />
          <PanelNote>
            Every block commits an object root. Blocks with no object operations still produce a
            root, they just repeat the previous one.
          </PanelNote>
        </Panel>

        <Panel
          title="latest object activity"
          right={
            <Link href="/activity" className="font-mono text-[10px] normal-case">
              full feed
            </Link>
          }
        >
          <LiveTxs pool={spritePool()} limit={8} showBlock={false} />
        </Panel>
      </div>

      {/* trending ------------------------------------------------------- */}
      <Panel
        title="trending collections"
        right={
          <span className="flex gap-1">
            <Link href="/collections" className="font-mono text-[10px] normal-case">
              all collections
            </Link>
          </span>
        }
      >
        <CollectionsTable rows={trending} />
        <PanelNote>
          Ranked by 24h settled volume on the native market module. Floor is the lowest active
          listing held in escrow, not an off-chain quote.
        </PanelNote>
      </Panel>

      {/* mints + charts -------------------------------------------------- */}
      <div className="grid gap-2 lg:grid-cols-[1.35fr_1fr]">
        <Panel
          title="recent mints"
          right={
            <Link href="/activity?type=MINT" className="font-mono text-[10px] normal-case">
              mint feed
            </Link>
          }
        >
          <div className="flex flex-wrap gap-[3px] p-2">
            {mints.map(({ object, event }) => (
              <Link
                key={event.hash}
                href={`/object/${object.slug}/${object.tokenId}`}
                className="block shrink-0 border border-line bg-surface p-[2px] no-underline hover:bg-[#f6ffd0]"
                title={`${object.name} minted in block ${event.height}`}
              >
                <ObjectSprite object={object} size={62} className="block border-0" />
                <span className="mt-[2px] block text-center font-mono text-[9px] leading-[11px] text-muted-foreground">
                  #{String(object.tokenId).padStart(4, '0')}
                  <br />
                  blk {num(event.height)}
                </span>
              </Link>
            ))}
          </div>
        </Panel>

        <div className="flex flex-col gap-2">
          <Panel title="object transfers / day (30d)" tone="plain">
            <BarChart data={series.map((d) => d.transfers)} labels={series.map((d) => d.day)} />
          </Panel>
          <Panel title="mints / day (30d)" tone="plain">
            <BarChart data={series.map((d) => d.mints)} labels={series.map((d) => d.day)} color="var(--link)" />
          </Panel>
          <Panel title="settled volume / day (GIF)" tone="plain">
            <BarChart data={series.map((d) => d.volume)} labels={series.map((d) => d.day)} />
          </Panel>
        </div>
      </div>

      {/* connect --------------------------------------------------------- */}
      <div className="grid gap-2 lg:grid-cols-[1fr_1fr]">
        <Panel title="connect to the network">
          <table className="tbl">
            <tbody>
              <tr>
                <th scope="row" className="w-[120px] bg-surface-2">
                  network name
                </th>
                <td>GIFCHAIN Mainnet</td>
              </tr>
              <tr>
                <th scope="row" className="bg-surface-2">
                  rpc http
                </th>
                <td className="flex items-center justify-between gap-2">
                  <span>{CHAIN.rpcHttp}</span>
                  <CopyButton value={CHAIN.rpcHttp} />
                </td>
              </tr>
              <tr>
                <th scope="row" className="bg-surface-2">
                  rpc websocket
                </th>
                <td className="flex items-center justify-between gap-2">
                  <span>{CHAIN.rpcWs}</span>
                  <CopyButton value={CHAIN.rpcWs} />
                </td>
              </tr>
              <tr>
                <th scope="row" className="bg-surface-2">
                  chain id
                </th>
                <td>{CHAIN.chainId}</td>
              </tr>
              <tr>
                <th scope="row" className="bg-surface-2">
                  currency
                </th>
                <td>GIF (18 decimals)</td>
              </tr>
              <tr>
                <th scope="row" className="bg-surface-2">
                  object endpoint
                </th>
                <td className="flex items-center justify-between gap-2">
                  <span>{CHAIN.restBase}/objects</span>
                  <CopyButton value={`${CHAIN.restBase}/objects`} />
                </td>
              </tr>
            </tbody>
          </table>
          <PanelNote>
            Endpoints are illustrative. This site runs on a deterministic simulated dataset, so
            nothing you see here settles on a real network.
          </PanelNote>
        </Panel>

        <Panel title="read an object in three lines">
          <pre className="overflow-x-auto p-2 font-mono text-[11px] leading-relaxed">
            <code>{`import { GifChain } from "@gifchain/sdk"

const chain = new GifChain("${CHAIN.rpcHttp}")
const object = await chain.object("gifcats", 12)

object.owner      // 0x8f2c...
object.frames     // 4
object.mintBlock  // ${num(liveHead() - 900_000)}
object.media()    // Uint8Array, straight from the object trie`}</code>
          </pre>
          <PanelNote>
            <Link href="/developers/sdk">SDK reference</Link> {'\u00b7'}{' '}
            <Link href="/developers/graphql">indexer queries</Link> {'\u00b7'}{' '}
            <Link href="/docs/standards">GIF-721 specification</Link>
          </PanelNote>
        </Panel>
      </div>
    </div>
  )
}
