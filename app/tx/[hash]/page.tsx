import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CopyButton } from '@/components/copy-button'
import { AddressLink, Btn, Chip, DetailList, ObjectSprite, Panel, PanelNote } from '@/components/kit'
import { CHAIN } from '@/lib/chain/constants'
import { getCollection, getEvent, getObjectByKey, walletName } from '@/lib/chain/data'
import { age, dec, gif, num, utc } from '@/lib/chain/format'
import { hexFrom } from '@/lib/chain/rng'

type Props = { params: Promise<{ hash: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { hash } = await params
  return { title: `Transaction ${hash.slice(0, 12)}\u2026` }
}

const METHOD: Record<string, string> = {
  MINT: 'mintObject(address,bytes)',
  SALE: 'fillListing(uint256,uint256)',
  TRANSFER: 'transferObject(address,address,uint256)',
  LIST: 'createListing(uint256,uint256)',
  BID: 'placeBid(uint256,uint256)',
  BURN: 'burnObject(uint256)',
  DEPLOY: 'deployCollection(string,string,uint16)',
}

const SENTENCE: Record<string, (a: string, b: string, o: string, p: string) => string> = {
  MINT: (a, b, o) => `${b} minted ${o} from the mint module`,
  SALE: (a, b, o, p) => `${b} bought ${o} from ${a} for ${p}`,
  TRANSFER: (a, b, o) => `${a} transferred ${o} to ${b}`,
  LIST: (a, b, o, p) => `${a} listed ${o} for ${p}`,
  BID: (a, b, o, p) => `${a} bid ${p} on ${o}`,
  BURN: (a, b, o) => `${a} burned ${o}`,
  DEPLOY: (a, b, o) => `${a} deployed the ${o} contract`,
}

export default async function TxPage({ params }: Props) {
  const { hash } = await params
  const tx = getEvent(decodeURIComponent(hash))
  if (!tx) notFound()

  const object = tx.objectKey ? getObjectByKey(tx.objectKey) : null
  const collection = tx.slug ? getCollection(tx.slug) : null
  const input = '0x' + hexFrom(`input:${tx.hash}`, 8) + hexFrom(`calldata:${tx.hash}`, 192)
  const sentence = SENTENCE[tx.type](
    walletName(tx.from),
    walletName(tx.to),
    object?.name ?? collection?.name ?? 'an object',
    tx.price !== null ? gif(tx.price) : 'nothing',
  )

  return (
    <div className="flex flex-col gap-2">
      <Panel
        tone="lime"
        title="transaction"
        right={
          <span className="flex items-center gap-1">
            <Btn href={`/block/${tx.height}`}>block #{num(tx.height)}</Btn>
            <Btn href="/txs">all transactions</Btn>
          </span>
        }
      >
        <div className="flex flex-col gap-2 p-2 md:flex-row md:items-center">
          {object ? (
            <Link href={`/object/${object.slug}/${object.tokenId}`} className="shrink-0 no-underline hover:bg-transparent">
              <ObjectSprite object={object} size={72} />
            </Link>
          ) : null}
          <div>
            <p className="font-mono text-[13px]">{sentence}</p>
            <p className="mt-1 font-mono text-[11px] text-muted-foreground">
              {utc(tx.ts)} {'\u00b7'} {age(tx.ts)} {'\u00b7'} {METHOD[tx.type]}
            </p>
          </div>
          <span className="md:ml-auto">
            <Chip kind={tx.status === 'failed' ? 'FAILED' : 'OK'}>
              {tx.status === 'failed' ? 'reverted' : 'success'}
            </Chip>
          </span>
        </div>
      </Panel>

      <Panel title="overview">
        <DetailList
          rows={[
            [
              'tx hash',
              <span key="h" className="flex items-center gap-2">
                <span className="font-mono">{tx.hash}</span>
                <CopyButton value={tx.hash} />
              </span>,
            ],
            [
              'status',
              <span key="s" className="flex items-center gap-2">
                <Chip kind={tx.status === 'failed' ? 'FAILED' : 'OK'}>
                  {tx.status === 'failed' ? 'reverted' : 'success'}
                </Chip>
                <span className="text-muted-foreground">
                  {num(CHAIN.headHeight - tx.height)} block confirmations
                </span>
              </span>,
            ],
            [
              'block',
              <span key="b">
                <Link href={`/block/${tx.height}`} className="font-mono">
                  {num(tx.height)}
                </Link>{' '}
                <span className="text-muted-foreground">position {tx.index}</span>
              </span>,
            ],
            ['timestamp', `${utc(tx.ts)} (${age(tx.ts)})`],
            ['action', <Chip key="a" kind={tx.type} />],
            ['method', <span key="m" className="font-mono">{METHOD[tx.type]}</span>],
            [
              'from',
              <span key="f" className="flex items-center gap-2">
                <AddressLink address={tx.from} len={42} showLabel={false} />
                {walletName(tx.from) !== tx.from ? (
                  <span className="text-muted-foreground">({walletName(tx.from)})</span>
                ) : null}
              </span>,
            ],
            [
              'to',
              <span key="t" className="flex items-center gap-2">
                <AddressLink address={tx.to} len={42} showLabel={false} />
                {walletName(tx.to) !== tx.to ? (
                  <span className="text-muted-foreground">({walletName(tx.to)})</span>
                ) : null}
              </span>,
            ],
            object
              ? [
                  'object',
                  <span key="o" className="flex items-center gap-2">
                    <ObjectSprite object={object} size={20} />
                    <Link href={`/object/${object.slug}/${object.tokenId}`} className="font-mono">
                      {object.name}
                    </Link>
                    <span className="text-muted-foreground">token id {object.tokenId}</span>
                  </span>,
                ]
              : null,
            collection
              ? [
                  'collection',
                  <span key="c">
                    <Link href={`/collections/${collection.slug}`} className="font-mono">
                      {collection.name}
                    </Link>{' '}
                    <span className="font-mono text-muted-foreground">{collection.contract}</span>
                  </span>,
                ]
              : null,
            tx.price !== null ? ['value', `${gif(tx.price)} ($${dec(tx.price * CHAIN.gifPriceUsd)})`] : null,
            ['transaction fee', `${dec(tx.fee, 4)} GIF`],
            ['gas used', `${num(tx.gasUsed)} (${((tx.gasUsed / 30_000_000) * 100).toFixed(2)}% of block limit)`],
            ['nonce', String(tx.nonce)],
            [
              'input data',
              <span key="i" className="block">
                <span className="block break-all font-mono text-[10px] leading-[1.5]">{input}</span>
                <span className="mt-1 block text-muted-foreground">
                  function selector {input.slice(0, 10)} {'\u00b7'} {METHOD[tx.type]}
                </span>
              </span>,
            ],
          ]}
        />
      </Panel>

      <Panel title="event log">
        <table className="tbl">
          <tbody>
            <tr>
              <th scope="row" className="w-[168px] bg-surface-2 align-top">
                0
              </th>
              <td className="whitespace-normal">
                <div className="font-mono">
                  {tx.type === 'DEPLOY' ? 'CollectionDeployed' : 'ObjectMoved'}(address indexed from,
                  address indexed to, uint256 indexed tokenId)
                </div>
                <div className="mt-1 grid gap-[2px] font-mono text-[10px] text-muted-foreground">
                  <span>topic0 {'\u00b7'} 0x{hexFrom(`topic0:${tx.type}`, 64)}</span>
                  <span>topic1 {'\u00b7'} {tx.from}</span>
                  <span>topic2 {'\u00b7'} {tx.to}</span>
                  <span>data {'\u00b7'} 0x{hexFrom(`logdata:${tx.hash}`, 64)}</span>
                </div>
              </td>
            </tr>
            {tx.price !== null ? (
              <tr>
                <th scope="row" className="bg-surface-2 align-top">
                  1
                </th>
                <td className="whitespace-normal">
                  <div className="font-mono">
                    PriceSettled(uint256 indexed tokenId, uint256 amount, uint16 royaltyBps)
                  </div>
                  <div className="mt-1 grid gap-[2px] font-mono text-[10px] text-muted-foreground">
                    <span>amount {'\u00b7'} {gif(tx.price)}</span>
                    <span>
                      royalty {'\u00b7'} {collection ? collection.royaltyBps / 100 : 0}% {'\u2192'}{' '}
                      {gif((tx.price * (collection?.royaltyBps ?? 0)) / 10000)}
                    </span>
                  </div>
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
        <PanelNote>
          Logs are emitted by the object module itself, not by the collection contract, which is why
          every collection produces identically shaped events.
        </PanelNote>
      </Panel>
    </div>
  )
}
