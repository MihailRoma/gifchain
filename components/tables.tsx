import Link from 'next/link'
import {
  getObjectByKey,
  type Block,
  type ChainEvent,
  type Collection,
  type CollectionStats,
  type GifObject,
} from '@/lib/chain/data'
import { dec, gif, num, shortAge, trunc } from '@/lib/chain/format'
import {
  AddressLink,
  Chip,
  CollectionLink,
  HashLink,
  ObjectSprite,
  ObjectThumbLink,
  Sprite,
  Table,
} from './kit'

export function BlocksTable({ blocks, compact = false }: { blocks: Block[]; compact?: boolean }) {
  return (
    <Table>
      <thead>
        <tr>
          <th>block</th>
          <th>age</th>
          <th>txs</th>
          <th>mints</th>
          <th>xfers</th>
          <th>burns</th>
          {!compact && <th>gas used</th>}
          {!compact && <th>size</th>}
          <th>fees</th>
          <th>sequencer</th>
          <th>objects</th>
        </tr>
      </thead>
      <tbody>
        {blocks.map((b) => (
          <tr key={b.height}>
            <td>
              <Link href={`/block/${b.height}`} className="font-mono">
                {num(b.height)}
              </Link>
            </td>
            <td className="text-muted-foreground">{shortAge(b.ts)}</td>
            <td className="num">{b.txCount}</td>
            <td className="num">{b.mints}</td>
            <td className="num">{b.transfers}</td>
            <td className="num">{b.burns}</td>
            {!compact && <td className="num">{num(b.gasUsed)}</td>}
            {!compact && <td className="num">{num(b.size)} B</td>}
            <td className="num">{dec(b.fees, 4)}</td>
            <td className="text-muted-foreground">{b.sequencer}</td>
            <td>
              <span className="flex items-center gap-[2px]">
                {b.events
                  .filter((e) => e.objectKey)
                  .slice(0, 6)
                  .map((e) => {
                    const o = getObjectByKey(e.objectKey!)
                    return o ? <ObjectThumbLink key={e.hash} object={o} size={18} /> : null
                  })}
                {b.events.filter((e) => e.objectKey).length === 0 ? (
                  <span className="text-muted-foreground">{'\u2014'}</span>
                ) : null}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  )
}

export function EventsTable({
  events,
  showBlock = true,
  showObject = true,
  showThumb = true,
  showHash = true,
}: {
  events: ChainEvent[]
  showBlock?: boolean
  showObject?: boolean
  showThumb?: boolean
  showHash?: boolean
}) {
  return (
    <Table>
      <thead>
        <tr>
          <th>action</th>
          {showHash && <th>tx hash</th>}
          {showThumb && <th aria-label="preview" />}
          {showObject && <th>object</th>}
          <th>collection</th>
          <th>from</th>
          <th>to</th>
          <th>price</th>
          {showBlock && <th>block</th>}
          <th>age</th>
        </tr>
      </thead>
      <tbody>
        {events.map((e) => {
          const o = e.objectKey ? getObjectByKey(e.objectKey) : null
          return (
            <tr key={e.hash}>
              <td>
                <Chip kind={e.status === 'failed' ? 'FAILED' : e.type}>
                  {e.status === 'failed' ? `${e.type} !` : e.type}
                </Chip>
              </td>
              {showHash && (
                <td>
                  <HashLink href={`/tx/${e.hash}`} value={e.hash} head={10} tail={6} />
                </td>
              )}
              {showThumb && (
                <td className="w-[26px] p-[2px]">
                  {o ? <ObjectThumbLink object={o} size={22} /> : null}
                </td>
              )}
              {showObject && (
                <td>
                  {o ? (
                    <Link href={`/object/${o.slug}/${o.tokenId}`} className="font-mono">
                      #{String(o.tokenId).padStart(4, '0')}
                    </Link>
                  ) : (
                    <span className="text-muted-foreground">{'\u2014'}</span>
                  )}
                </td>
              )}
              <td>{e.slug ? <CollectionLink slug={e.slug} /> : <span>{'\u2014'}</span>}</td>
              <td>
                <AddressLink address={e.from} />
              </td>
              <td>
                <AddressLink address={e.to} />
              </td>
              <td className="num">{e.price !== null ? gif(e.price) : <span className="text-muted-foreground">{'\u2014'}</span>}</td>
              {showBlock && (
                <td>
                  <Link href={`/block/${e.height}`} className="font-mono">
                    {num(e.height)}
                  </Link>
                </td>
              )}
              <td className="text-muted-foreground">{shortAge(e.ts)}</td>
            </tr>
          )
        })}
      </tbody>
    </Table>
  )
}

export function CollectionsTable({
  rows,
  offset = 0,
}: {
  rows: Array<Collection & { stats: CollectionStats }>
  offset?: number
}) {
  return (
    <Table>
      <thead>
        <tr>
          <th>#</th>
          <th aria-label="preview" />
          <th>collection</th>
          <th>standard</th>
          <th>floor</th>
          <th>24h vol</th>
          <th>24h</th>
          <th>owners</th>
          <th>supply</th>
          <th>listed</th>
          <th>burned</th>
          <th>contract</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((c, i) => (
          <tr key={c.slug}>
            <td className="num text-muted-foreground">{offset + i + 1}</td>
            <td className="w-[26px] p-[2px]">
              <Link href={`/collections/${c.slug}`} className="inline-block no-underline hover:bg-transparent">
                <Sprite sheet={c.sheet} cell={0} filter={c.filter} size={22} title={c.name} />
              </Link>
            </td>
            <td>
              <Link href={`/collections/${c.slug}`} className="font-mono">
                {c.name}
              </Link>{' '}
              {c.verified ? (
                <span className="chip bg-lime" title="verified by the object registry">
                  v
                </span>
              ) : null}
            </td>
            <td className="text-muted-foreground">{c.standard}</td>
            <td className="num">{dec(c.stats.floor)}</td>
            <td className="num">{dec(c.stats.volume24h)}</td>
            <td className={`num ${c.stats.change24h < 0 ? 'text-[#a81111]' : ''}`}>
              {c.stats.change24h > 0 ? '+' : ''}
              {c.stats.change24h}%
            </td>
            <td className="num">{c.stats.owners}</td>
            <td className="num">{c.supply}</td>
            <td className="num">{c.stats.listed}</td>
            <td className="num">{c.stats.burned}</td>
            <td>
              <HashLink href={`/collections/${c.slug}?tab=contract`} value={c.contract} head={8} tail={4} />
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  )
}

export function ObjectGrid({
  objects,
  size = 56,
  showLabels = true,
}: {
  objects: GifObject[]
  size?: number
  showLabels?: boolean
}) {
  return (
    <div className="flex flex-wrap gap-[3px] p-2">
      {objects.map((o) => (
        <Link
          key={o.key}
          href={`/object/${o.slug}/${o.tokenId}`}
          className="block shrink-0 no-underline hover:bg-transparent"
          title={`${o.name}${o.burned ? ' (burned)' : ''}`}
        >
          <span className="block border border-line bg-surface p-[1px]">
            <ObjectSprite object={o} size={size} className={o.burned ? 'opacity-40' : ''} />
            {showLabels ? (
              <span className="block text-center font-mono text-[9px] leading-[12px] text-muted-foreground">
                #{String(o.tokenId).padStart(4, '0')}
              </span>
            ) : null}
          </span>
        </Link>
      ))}
      {objects.length === 0 ? (
        <p className="font-mono text-[11px] text-muted-foreground">no objects</p>
      ) : null}
    </div>
  )
}

export function AddressCell({ address }: { address: string }) {
  return <span className="font-mono">{trunc(address, 8, 6)}</span>
}
