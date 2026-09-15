import type { Metadata } from 'next'
import Link from 'next/link'
import { CopyButton } from '@/components/copy-button'
import { AddressLink, Chip, DetailList, Panel, PanelNote, Sprite, Stat, Table, TabNav } from '@/components/kit'
import { EventsTable } from '@/components/tables'
import { CHAIN, heightToTs } from '@/lib/chain/constants'
import { collectionActivity, collectionStats, collections, getCollection } from '@/lib/chain/data'
import { dec, num, utc } from '@/lib/chain/format'
import { hexFrom } from '@/lib/chain/rng'
import { buildHref, one, type SP } from '@/lib/paging'

export const metadata: Metadata = {
  title: 'Contracts',
  description: 'Deployed object contracts and protocol modules on GIFCHAIN.',
}

const MODULES = [
  ['market', 'listings, bids, escrow and royalty settlement', 'gif1qmarket0000000000000000000000000000mkt'],
  ['objects', 'the object trie, frame storage and root commitments', 'gif1qobjects00000000000000000000000000obj'],
  ['bridge', 'lock and release of objects mirrored to other chains', 'gif1qbridge000000000000000000000000000brg'],
  ['staking', 'sequencer bonds and slashing for missed epochs', 'gif1qstaking00000000000000000000000000stk'],
  ['treasury', 'fee sink, funds indexer grants and public goods', 'gif1qtreasury0000000000000000000000000trs'],
] as const

export default async function ContractsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams
  const selected = one(sp, 'c')
  const active = selected ? getCollection(selected) : null
  const stats = active ? collectionStats(active.slug) : null

  return (
    <div className="flex flex-col gap-2">
      <div className="panel">
        <div className="grid grid-cols-2 md:grid-cols-4">
          <Stat label="object contracts" value={String(collections.length)} sub="deployed by accounts" />
          <Stat label="protocol modules" value={String(MODULES.length)} sub="native, not deployed bytecode" />
          <Stat label="verified sources" value={String(collections.filter((c) => c.verified).length)} sub="matched against on-chain hash" />
          <Stat label="standards" value="GIF-721 / 1155" sub="plus GIF-165 and GIF-2981" />
        </div>
      </div>

      <Panel title="object contracts">
        <TabNav
          items={[
            { label: 'all', href: buildHref('/contracts', sp, { c: undefined }), active: !selected },
            ...collections.map((c) => ({
              label: c.symbol.toLowerCase(),
              href: buildHref('/contracts', sp, { c: c.slug }),
              active: selected === c.slug,
            })),
          ]}
        />
        {active && stats ? (
          <>
            <div className="flex items-center gap-2 border-b border-line p-2">
              <Sprite sheet={active.sheet} cell={0} filter={active.filter} size={48} title={active.name} />
              <div>
                <Link href={`/collections/${active.slug}`} className="font-mono text-[12px]">
                  {active.name}
                </Link>
                <p className="font-mono text-[10px] text-muted-foreground">
                  {active.standard} {'\u00b7'} {active.supply} supply {'\u00b7'} {stats.owners} owners
                </p>
              </div>
            </div>
            <DetailList
              rows={[
                [
                  'address',
                  <span key="a" className="flex items-center gap-2">
                    <span className="font-mono">{active.contract}</span>
                    <CopyButton value={active.contract} />
                  </span>,
                ],
                ['creator', <AddressLink key="c" address={active.creator} len={42} />],
                [
                  'deployed',
                  <span key="d">
                    block <Link href={`/block/${active.deployHeight}`}>#{num(active.deployHeight)}</Link>{' '}
                    <span className="text-muted-foreground">{utc(heightToTs(active.deployHeight))}</span>
                  </span>,
                ],
                [
                  'source',
                  <span key="s" className="flex items-center gap-2">
                    <Chip kind={active.verified ? 'OK' : 'FAILED'}>
                      {active.verified ? 'verified' : 'unverified'}
                    </Chip>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      0x{hexFrom(`code:${active.slug}`, 40)}
                    </span>
                  </span>,
                ],
                ['royalty', `${active.royaltyBps / 100}% enforced by the market module`],
                ['lifetime volume', `${num(Math.round(stats.volumeTotal))} GIF`],
                ['floor', `${dec(stats.floor)} GIF`],
                [
                  'abi',
                  <pre key="abi" className="whitespace-pre-wrap font-mono text-[10px] leading-[1.6]">
{`totalSupply() -> u32
ownerOf(id: u32) -> address
objectOf(id: u32) -> bytes
traitsOf(id: u32) -> (string, string)[]
transfer(to: address, id: u32)
burn(id: u32)
royaltyInfo(id: u32, price: u128) -> (address, u128)`}
                  </pre>,
                ],
              ]}
            />
            <EventsTable events={collectionActivity(active.slug).slice(0, 12)} />
          </>
        ) : (
          <Table>
            <thead>
              <tr>
                <th>contract</th>
                <th>symbol</th>
                <th>standard</th>
                <th>supply</th>
                <th>deployed</th>
                <th>creator</th>
                <th>source</th>
              </tr>
            </thead>
            <tbody>
              {collections.map((c) => (
                <tr key={c.slug}>
                  <td>
                    <Link href={buildHref('/contracts', sp, { c: c.slug })} className="font-mono">
                      {c.contract.slice(0, 22)}
                      {'\u2026'}
                    </Link>
                  </td>
                  <td className="font-mono">{c.symbol}</td>
                  <td>
                    <Chip kind={c.standard === 'GIF-721' ? 'OK' : 'LIST'}>{c.standard}</Chip>
                  </td>
                  <td className="num">{c.supply}</td>
                  <td className="num">
                    <Link href={`/block/${c.deployHeight}`}>#{num(c.deployHeight)}</Link>
                  </td>
                  <td>
                    <AddressLink address={c.creator} />
                  </td>
                  <td>
                    <Chip kind={c.verified ? 'OK' : 'FAILED'}>{c.verified ? 'verified' : 'unverified'}</Chip>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
        <PanelNote>
          Source verification compares a rebuilt artifact against the code hash stored at the
          contract address. Unverified contracts still work, you just have to trust the bytes.
        </PanelNote>
      </Panel>

      <Panel title="protocol modules">
        <Table>
          <thead>
            <tr>
              <th>module</th>
              <th>address</th>
              <th>responsibility</th>
              <th>upgradeable</th>
            </tr>
          </thead>
          <tbody>
            {MODULES.map(([name, what, addr]) => (
              <tr key={name}>
                <td className="font-mono">{name}</td>
                <td className="font-mono text-muted-foreground">{addr.slice(0, 26)}{'\u2026'}</td>
                <td>{what}</td>
                <td>
                  <Chip kind={name === 'objects' ? 'BURN' : 'OK'}>
                    {name === 'objects' ? 'frozen' : 'governed'}
                  </Chip>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
        <PanelNote>
          Modules live at reserved addresses on {CHAIN.networkId} and are part of the node binary. The
          object module is frozen: changing how objects are stored would invalidate every historical
          object root.
        </PanelNote>
      </Panel>
    </div>
  )
}
