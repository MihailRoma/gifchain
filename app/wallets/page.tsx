import type { Metadata } from 'next'
import { AddressLink, Chip, ObjectThumbLink, Panel, PanelNote, Stat, Table } from '@/components/kit'
import { ObjectGrid } from '@/components/tables'
import { topWallets, walletHoldings } from '@/lib/chain/data'
import { dec, num, shortAge } from '@/lib/chain/format'

export const metadata: Metadata = {
  title: 'Wallets',
  description: 'The largest object holders on GIFCHAIN, ranked by estimated portfolio value.',
}

export default function WalletsPage() {
  const top = topWallets(40)
  const totalHeld = top.reduce((a, w) => a + w.count, 0)
  const totalValue = top.reduce((a, w) => a + w.value, 0)
  const whale = top[0]

  return (
    <div className="flex flex-col gap-2">
      <div className="panel">
        <div className="grid grid-cols-2 md:grid-cols-4">
          <Stat label="ranked wallets" value={String(top.length)} sub="holders with at least one object" />
          <Stat label="objects held by top 40" value={num(totalHeld)} sub="of all live objects" />
          <Stat label="estimated value" value={`${num(Math.round(totalValue))} GIF`} sub="last price, floor fallback" />
          <Stat
            label="largest holder"
            value={`${whale.count} objects`}
            sub={whale.wallet.handle ?? whale.wallet.address.slice(0, 10)}
          />
        </div>
      </div>

      <Panel title="holder leaderboard">
        <Table>
          <thead>
            <tr>
              <th>#</th>
              <th>wallet</th>
              <th>kind</th>
              <th>objects</th>
              <th>est. value</th>
              <th>share</th>
              <th>first seen</th>
              <th>holdings</th>
            </tr>
          </thead>
          <tbody>
            {top.map((row, i) => {
              const holdings = walletHoldings(row.wallet.address).slice(0, 8)
              return (
                <tr key={row.wallet.address}>
                  <td className="num text-muted-foreground">{i + 1}</td>
                  <td>
                    <AddressLink address={row.wallet.address} len={12} />
                  </td>
                  <td>
                    <Chip kind={row.wallet.kind === 'system' ? 'BURN' : row.wallet.kind === 'contract' ? 'LIST' : 'TRANSFER'}>
                      {row.wallet.kind}
                    </Chip>
                  </td>
                  <td className="num">{row.count}</td>
                  <td className="num">{dec(row.value)}</td>
                  <td className="num text-muted-foreground">
                    {((row.value / totalValue) * 100).toFixed(1)}%
                  </td>
                  <td className="text-muted-foreground">{shortAge(row.wallet.firstSeen)}</td>
                  <td className="p-[2px]">
                    <span className="flex items-center gap-[2px]">
                      {holdings.map((o) => (
                        <ObjectThumbLink key={o.key} object={o} size={18} />
                      ))}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </Table>
        <PanelNote>
          Value is estimated from the last settled price of each held object, falling back to the
          collection floor. System accounts such as the market escrow are included because
          they genuinely custody objects while listings are open.
        </PanelNote>
      </Panel>

      <Panel title={`inside ${whale.wallet.handle ?? 'the largest wallet'}`}>
        <ObjectGrid objects={walletHoldings(whale.wallet.address).slice(0, 48)} size={64} />
      </Panel>
    </div>
  )
}
