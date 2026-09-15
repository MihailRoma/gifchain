import type { Metadata } from 'next'
import { Btn, Panel, PanelNote, Stat } from '@/components/kit'
import { MintPanel, type MintTarget } from '@/components/mint-panel'
import { EventsTable } from '@/components/tables'
import { collectionStats, collections, latestEvents } from '@/lib/chain/data'
import { dec, num } from '@/lib/chain/format'
import { rngFor } from '@/lib/chain/rng'

export const metadata: Metadata = {
  title: 'Mint',
  description: 'Mint objects into a GIFCHAIN collection and watch the transaction settle.',
}

export default function MintPage() {
  const targets: MintTarget[] = collections.map((c) => {
    const s = collectionStats(c.slug)
    const r = rngFor(`mint:${c.slug}`)
    return {
      slug: c.slug,
      name: c.name,
      symbol: c.symbol,
      sheet: c.sheet,
      filter: c.filter,
      price: Math.round(Math.max(0.4, s.floor * 0.7) * 100) / 100,
      minted: Math.round(c.supply * (0.42 + r() * 0.55)),
      supply: c.supply,
    }
  })

  const mints = latestEvents(40, 0, ['MINT'])
  const totalMinted = targets.reduce((a, t) => a + t.minted, 0)
  const totalSupply = targets.reduce((a, t) => a + t.supply, 0)
  const cheapest = [...targets].sort((a, b) => a.price - b.price)[0]

  return (
    <div className="flex flex-col gap-2">
      <div className="panel">
        <div className="grid grid-cols-2 md:grid-cols-4">
          <Stat label="open mints" value={String(targets.length)} sub="collections with supply left" />
          <Stat label="minted" value={num(totalMinted)} sub={`of ${num(totalSupply)} total supply`} />
          <Stat label="cheapest mint" value={`${dec(cheapest.price)} GIF`} sub={cheapest.name} />
          <Stat label="mint gas" value="0.0021 GIF" sub="flat, regardless of frame count" />
        </div>
      </div>

      <div className="grid gap-2 lg:grid-cols-[1fr_340px]">
        <Panel title="mint an object" tone="lime" right={<Btn href="/collections">browse collections</Btn>}>
          <MintPanel targets={targets} />
        </Panel>

        <div className="flex flex-col gap-2">
          <Panel title="what a mint actually writes">
            <ol className="flex flex-col gap-2 p-2 font-mono text-[10px] leading-relaxed text-muted-foreground">
              <li>
                <span className="text-foreground">frames</span> {'\u2014'} the palette and every frame
                are written into the object trie, not to a URI. There is no off-chain file to lose.
              </li>
              <li>
                <span className="text-foreground">traits</span> {'\u2014'} derived deterministically
                from the mint hash, so the same hash always produces the same object.
              </li>
              <li>
                <span className="text-foreground">ownership</span> {'\u2014'} a single leaf in the
                ownership index, updated in place on every transfer.
              </li>
              <li>
                <span className="text-foreground">root</span> {'\u2014'} the block carries the new
                object root. Once a second block builds on it, the mint is irreversible.
              </li>
            </ol>
            <PanelNote>
              Mint cost is flat because storage is priced per object slot, not per byte. A 12-frame
              animation costs exactly what a single still frame costs.
            </PanelNote>
          </Panel>

          <Panel title="deploy your own collection">
            <pre className="overflow-x-auto p-2 font-mono text-[10px] leading-[1.7]">
{`$ gifd deploy \\
    --name "My Objects" \\
    --symbol MYOBJ \\
    --standard GIF-721 \\
    --supply 512 \\
    --royalty 500

> compiling sheet .............. ok
> object budget ....... 512 slots
> deploy tx .... 0x9c41..ae02
> contract ..... gif1qcollection...`}
            </pre>
            <PanelNote>
              Deploys are permissionless. Supply is sealed at deploy time and cannot be raised
              later, which is the only reason floor prices here mean anything.
            </PanelNote>
          </Panel>
        </div>
      </div>

      <Panel title="recent mints across the network" right={<Btn href="/activity?type=MINT">all mints</Btn>}>
        <EventsTable events={mints} />
      </Panel>
    </div>
  )
}
