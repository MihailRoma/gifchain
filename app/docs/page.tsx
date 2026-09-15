import type { Metadata } from 'next'
import Link from 'next/link'
import { Panel, PanelNote, Stat, Table } from '@/components/kit'
import { CHAIN } from '@/lib/chain/constants'
import { liveHead } from '@/lib/chain/data'
import { num } from '@/lib/chain/format'

export const metadata: Metadata = {
  title: 'Docs',
  description: 'How GIFCHAIN stores animated objects on chain, and how the rest of the system follows from that.',
}

const GLOSSARY: Array<[string, string]> = [
  ['object', 'An animated image stored directly in chain state. Frames, palette and traits all live in the object trie.'],
  ['object root', 'A merkle root over every object leaf, committed in each block header. It is what makes ownership provable.'],
  ['leaf', 'One object plus its owner. Transfers rewrite the leaf in place, they never copy the frames.'],
  ['slot', 'A reserved position in a collection. Supply is sealed at deploy, so slots cannot be created later.'],
  ['escrow', 'The market module account that custodies an object while a listing is open.'],
  ['mirror', 'A token on another chain that points at a locked GIFCHAIN leaf. Burning the mirror releases the lock.'],
  ['epoch', '4096 blocks. Sequencer order is fixed for an epoch and reshuffled at the boundary.'],
  ['hot index', 'The recent window the explorer keeps fully denormalised. Older data is still queryable, just not listed.'],
]

export default function DocsPage() {
  return (
    <div className="flex flex-col gap-2">
      <Panel tone="lime" title="documentation">
        <div className="grid gap-3 p-2 md:grid-cols-[1.4fr_1fr]">
          <div>
            <h1 className="font-mono text-[13px]">Animated objects, stored on chain</h1>
            <p className="mt-2 max-w-[70ch] font-mono text-[11px] leading-relaxed">
              Most object networks store a pointer and hope the file outlives the link. GIFCHAIN
              stores the frames themselves. Every object is a leaf in a merkle trie, every block
              commits a root over that trie, and ownership is a field on the leaf rather than a row
              in somebody else{'\u2019'}s database. That single decision explains the fixed mint
              price, the sealed supply, the frozen object module and the way the bridge works.
            </p>
          </div>
          <div className="grid grid-cols-2">
            <Stat label="height" value={num(liveHead())} sub="current head" />
            <Stat label="block time" value="3-7s" sub="2 block finality" />
            <Stat label="object limit" value="16 KB" sub="per object, hard cap" />
            <Stat label="standards" value="721 / 1155" sub="plus 165 and 2981" />
          </div>
        </div>
      </Panel>

      <div className="grid gap-2 md:grid-cols-2">
        <Panel title="object standard">
          <div className="p-2">
            <p className="font-mono text-[11px] leading-relaxed text-muted-foreground">
              The encoding of frames, palettes and traits, and the two token standards built on top
              of it.
            </p>
            <Link href="/docs/standards" className="mt-2 inline-block font-mono text-[11px]">
              read the standard {'\u2192'}
            </Link>
          </div>
        </Panel>
        <Panel title="node operators">
          <div className="p-2">
            <p className="font-mono text-[11px] leading-relaxed text-muted-foreground">
              Hardware, sync modes, bonding as a sequencer and what gets you slashed.
            </p>
            <Link href="/docs/nodes" className="mt-2 inline-block font-mono text-[11px]">
              run a node {'\u2192'}
            </Link>
          </div>
        </Panel>
      </div>

      <div className="grid gap-2 lg:grid-cols-2">
        <Panel title="lifecycle of an object">
          <ol className="flex flex-col gap-2 p-2 font-mono text-[11px] leading-relaxed text-muted-foreground">
            <li>
              <span className="text-foreground">deploy</span> {'\u2014'} a collection reserves N
              slots and fixes its royalty. Supply can never grow.
            </li>
            <li>
              <span className="text-foreground">mint</span> {'\u2014'} frames are written into the
              trie, traits are derived from the mint hash, and a leaf appears.
            </li>
            <li>
              <span className="text-foreground">hold</span> {'\u2014'} the leaf resolves at every
              height. Nothing expires, nothing needs renewing.
            </li>
            <li>
              <span className="text-foreground">list and sell</span> {'\u2014'} escrow holds the
              object, the market module pays seller and creator atomically.
            </li>
            <li>
              <span className="text-foreground">bridge</span> {'\u2014'} the leaf freezes, a mirror
              appears elsewhere, and the frames stay exactly where they were.
            </li>
            <li>
              <span className="text-foreground">burn</span> {'\u2014'} the leaf is cleared. The
              frames stay in history forever, but the slot is never reissued.
            </li>
          </ol>
        </Panel>

        <Panel title="glossary">
          <Table>
            <thead>
              <tr>
                <th>term</th>
                <th>meaning</th>
              </tr>
            </thead>
            <tbody>
              {GLOSSARY.map(([term, meaning]) => (
                <tr key={term}>
                  <td className="w-[110px] font-mono align-top">{term}</td>
                  <td className="leading-relaxed">{meaning}</td>
                </tr>
              ))}
            </tbody>
          </Table>
          <PanelNote>
            Everything on this site is simulated: the heights, the wallets, the prices and the
            sequencers. The behaviour is modelled carefully, but no value moves anywhere.
          </PanelNote>
        </Panel>
      </div>
    </div>
  )
}
