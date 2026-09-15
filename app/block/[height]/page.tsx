import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CopyButton } from '@/components/copy-button'
import { Btn, Chip, DetailList, Panel, PanelNote } from '@/components/kit'
import { EventsTable } from '@/components/tables'
import { CHAIN } from '@/lib/chain/constants'
import { getBlock } from '@/lib/chain/data'
import { age, bytes, dec, num, utc } from '@/lib/chain/format'

type Props = { params: Promise<{ height: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { height } = await params
  return { title: `Block #${height}` }
}

export default async function BlockPage({ params }: Props) {
  const { height } = await params
  const h = parseInt(height, 10)
  const block = getBlock(h)
  if (!block) notFound()

  const fill = Math.round((block.gasUsed / block.gasLimit) * 1000) / 10

  return (
    <div className="flex flex-col gap-2">
      <Panel
        tone="lime"
        title={`block #${num(block.height)}`}
        right={
          <span className="flex items-center gap-1">
            <Btn href={`/block/${block.height - 1}`} disabled={block.height <= 1}>
              {'\u2190'} prev
            </Btn>
            <Btn href={`/block/${block.height + 1}`} disabled={block.height >= CHAIN.headHeight}>
              next {'\u2192'}
            </Btn>
            <Btn href="/blocks">all blocks</Btn>
          </span>
        }
      >
        <DetailList
          rows={[
            [
              'height',
              <span key="h" className="flex items-center gap-2">
                <span className="num font-mono">{num(block.height)}</span>
                <Chip kind="OK">finalized</Chip>
                <span className="text-muted-foreground">
                  {num(CHAIN.headHeight - block.height)} confirmations
                </span>
              </span>,
            ],
            ['timestamp', `${utc(block.ts)} (${age(block.ts)})`],
            [
              'block hash',
              <span key="bh" className="flex items-center gap-2">
                <span className="font-mono">{block.hash}</span>
                <CopyButton value={block.hash} />
              </span>,
            ],
            [
              'parent hash',
              <Link key="ph" href={`/block/${block.height - 1}`} className="font-mono">
                {block.parentHash}
              </Link>,
            ],
            ['state root', <span key="sr" className="font-mono">{block.stateRoot}</span>],
            [
              'object root',
              <span key="or" className="font-mono">
                {block.objectRoot}{' '}
                <span className="text-muted-foreground">
                  {'\u2190'} commitment over every object mutated in this block
                </span>
              </span>,
            ],
            [
              'sequencer',
              <span key="sq">
                <span className="font-mono">{block.sequencer}</span>{' '}
                <span className="text-muted-foreground">proof of custody, epoch {Math.floor(block.height / 4096)}</span>
              </span>,
            ],
            [
              'transactions',
              <span key="tx">
                {block.txCount} total {'\u00b7'} {block.mints} mint {'\u00b7'} {block.sales} sale{' '}
                {'\u00b7'} {block.transfers - block.sales} transfer {'\u00b7'} {block.burns} burn
              </span>,
            ],
            [
              'gas used',
              <span key="g">
                {num(block.gasUsed)} / {num(block.gasLimit)}{' '}
                <span className="text-muted-foreground">({fill}%)</span>
                <span className="mt-1 block h-[8px] w-[240px] border border-hair bg-surface-2">
                  <span className="block h-full bg-lime" style={{ width: `${Math.max(1, fill)}%` }} />
                </span>
              </span>,
            ],
            ['base fee', `${block.baseFee} ngif`],
            ['fees collected', `${dec(block.fees, 4)} GIF`],
            ['size', bytes(block.size)],
            [
              'collections touched',
              block.collections.length ? (
                <span key="c" className="flex flex-wrap gap-1">
                  {block.collections.map((slug) => (
                    <Link key={slug} href={`/collections/${slug}`} className="font-mono">
                      {slug}
                    </Link>
                  ))}
                </span>
              ) : (
                <span className="text-muted-foreground">none</span>
              ),
            ],
          ]}
        />
      </Panel>

      <Panel title={`transactions in block #${num(block.height)}`}>
        {block.events.length ? (
          <EventsTable events={block.events} showBlock={false} />
        ) : (
          <p className="p-3 font-mono text-[11px] text-muted-foreground">
            This block contains no object operations. The object root is carried over unchanged from
            block{' '}
            <Link href={`/block/${block.height - 1}`}>#{num(block.height - 1)}</Link>.
          </p>
        )}
        <PanelNote>
          Transactions are listed in execution order. Object state is applied after the whole block
          is validated, so a failed transaction still consumes gas but never touches the object
          trie.
        </PanelNote>
      </Panel>
    </div>
  )
}
