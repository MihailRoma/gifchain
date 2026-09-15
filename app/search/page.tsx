import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Chip, Panel, PanelNote, Table } from '@/components/kit'
import { search } from '@/lib/chain/data'
import { one, type SP } from '@/lib/paging'

export const metadata: Metadata = { title: 'Search' }

const HREF = {
  block: (r: { height: number }) => `/block/${r.height}`,
  tx: (r: { hash: string }) => `/tx/${r.hash}`,
  object: (r: { slug: string; tokenId: number }) => `/object/${r.slug}/${r.tokenId}`,
  collection: (r: { slug: string }) => `/collections/${r.slug}`,
  wallet: (r: { address: string }) => `/wallet/${r.address}`,
} as const

export default async function SearchPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams
  const q = (one(sp, 'q') ?? '').trim()
  const results = search(q)

  if (results.length === 1) {
    const r = results[0]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    redirect((HREF[r.kind] as (x: any) => string)(r))
  }

  return (
    <div className="flex flex-col gap-2">
      <Panel title={`search \u00b7 ${q || 'empty query'}`} tone="lime">
        <form action="/search" method="get" className="flex gap-1 p-2">
          <label className="sr-only" htmlFor="q">
            Search GIFCHAIN
          </label>
          <input
            id="q"
            name="q"
            defaultValue={q}
            placeholder="block height / tx hash / wallet / object / collection"
            className="flex-1"
          />
          <button className="btn" type="submit">
            search
          </button>
        </form>
        <PanelNote>
          The indexer resolves exact identifiers as well as partial names. Try{' '}
          <Link href="/search?q=gifcats">gifcats</Link>, <Link href="/search?q=4128700">4128700</Link>{' '}
          or <Link href="/search?q=whale">whale</Link>.
        </PanelNote>
      </Panel>

      <Panel title={`${results.length} result${results.length === 1 ? '' : 's'}`}>
        {results.length ? (
          <Table>
            <thead>
              <tr>
                <th>type</th>
                <th>result</th>
                <th>detail</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => (
                <tr key={i}>
                  <td>
                    <Chip kind={r.kind === 'block' ? 'OK' : r.kind === 'tx' ? 'TRANSFER' : 'LIST'}>
                      {r.kind}
                    </Chip>
                  </td>
                  <td>
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    <Link href={(HREF[r.kind] as (x: any) => string)(r)} className="font-mono">
                      {r.label}
                    </Link>
                  </td>
                  <td className="text-muted-foreground">{r.sub}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        ) : (
          <p className="p-3 font-mono text-[11px] text-muted-foreground">
            {q
              ? 'Nothing matched. Identifiers outside the hot index window are not searchable, only directly addressable.'
              : 'Type something above to search blocks, transactions, objects, collections and wallets.'}
          </p>
        )}
      </Panel>
    </div>
  )
}
