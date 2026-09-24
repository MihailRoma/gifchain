import Link from 'next/link'
import type { ReactNode } from 'react'
import { swarms, getWallet, type Agent, type AgentStatus, type EventType, type Tier } from '@/lib/chain/data'
import { trunc } from '@/lib/chain/format'
import { Glyph } from '@/components/glyph'

/* ------------------------------------------------------------------ panels */

export function Panel({
  title,
  right,
  children,
  tone = 'dark',
  className = '',
  bodyClass = '',
}: {
  title?: ReactNode
  right?: ReactNode
  children: ReactNode
  tone?: 'dark' | 'clay' | 'plain'
  className?: string
  bodyClass?: string
}) {
  return (
    <section className={`panel ${className}`}>
      {title ? (
        <header
          className={`panel-hd ${tone === 'clay' ? 'panel-hd--clay' : ''} ${
            tone === 'plain' ? 'panel-hd--plain' : ''
          }`}
        >
          <span>{title}</span>
          {right ? <span className="flex items-center gap-2 normal-case">{right}</span> : null}
        </header>
      ) : null}
      <div className={bodyClass}>{children}</div>
    </section>
  )
}

export function PanelNote({ children }: { children: ReactNode }) {
  return (
    <p className="border-t px-2 py-1 font-mono text-[10px] text-muted-foreground">{children}</p>
  )
}

/* ------------------------------------------------------------- data tables */

export function Table({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className="overflow-x-auto">
      <table className={`tbl ${className}`}>{children}</table>
    </div>
  )
}

export function DetailList({ rows }: { rows: Array<[ReactNode, ReactNode] | null> }) {
  return (
    <table className="tbl">
      <tbody>
        {rows
          .filter((r): r is [ReactNode, ReactNode] => Boolean(r))
          .map(([label, value], i) => (
            <tr key={i}>
              <th scope="row" className="w-[168px] border-b border-hair bg-surface-2 align-top">
                {label}
              </th>
              <td className="whitespace-normal break-all">{value}</td>
            </tr>
          ))}
      </tbody>
    </table>
  )
}

/* -------------------------------------------------------------- primitives */

export const CHIP_TONE: Record<EventType | 'FAILED' | 'OK', string> = {
  SPAWN: 'bg-clay text-clay-foreground border-clay',
  PROMPT: 'bg-surface text-link border-link',
  COMPLETION: 'bg-foreground text-background border-foreground',
  MEMORY: 'bg-surface-2',
  TRANSFER: 'bg-surface text-muted-foreground',
  HALT: 'bg-ink text-muted-foreground',
  DEPLOY: 'bg-ink text-clay border-clay',
  FAILED: 'bg-surface text-destructive border-destructive',
  OK: 'bg-clay text-clay-foreground border-clay',
}

export function Chip({
  kind,
  children,
}: {
  kind?: EventType | 'FAILED' | 'OK'
  children?: ReactNode
}) {
  return <span className={`chip ${kind ? CHIP_TONE[kind] : ''}`}>{children ?? kind}</span>
}

const TIER_TONE: Record<Tier, string> = {
  opus: 'bg-clay text-clay-foreground border-clay',
  sonnet: 'bg-foreground text-background border-foreground',
  haiku: 'bg-surface-2',
}

export function TierChip({ tier }: { tier: Tier }) {
  return <span className={`chip ${TIER_TONE[tier]}`}>{tier}</span>
}

export function StatusDot({ status }: { status: AgentStatus }) {
  const tone =
    status === 'thinking'
      ? 'bg-clay blink'
      : status === 'idle'
        ? 'bg-foreground'
        : status === 'sleeping'
          ? 'bg-muted-foreground'
          : 'bg-hair'
  return (
    <span className="inline-flex items-center gap-1 font-mono text-[10px]">
      <span aria-hidden className={`inline-block h-[7px] w-[7px] ${tone}`} />
      {status}
    </span>
  )
}

export function Btn({
  href,
  children,
  on,
  disabled,
  title,
}: {
  href: string
  children: ReactNode
  on?: boolean
  disabled?: boolean
  title?: string
}) {
  if (disabled) {
    return (
      <span className="btn" data-disabled="true" title={title}>
        {children}
      </span>
    )
  }
  return (
    <Link className="btn no-underline" href={href} data-on={on ? 'true' : undefined} title={title}>
      {children}
    </Link>
  )
}

export function Stat({
  label,
  value,
  sub,
  href,
}: {
  label: string
  value: ReactNode
  sub?: ReactNode
  href?: string
}) {
  const body = (
    <>
      <div className="font-mono text-[9px] uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </div>
      <div className="num font-mono text-[15px] leading-tight">{value}</div>
      {sub ? <div className="font-mono text-[10px] text-muted-foreground">{sub}</div> : null}
    </>
  )
  if (href) {
    return (
      <Link href={href} className="block border-r border-hair px-2 py-1 text-foreground no-underline hover:bg-surface-2 hover:text-foreground">
        {body}
      </Link>
    )
  }
  return <div className="border-r border-hair px-2 py-1">{body}</div>
}

/* ------------------------------------------------------------------- links */

export function HashLink({
  href,
  value,
  head = 10,
  tail = 8,
}: {
  href: string
  value: string
  head?: number
  tail?: number
}) {
  return (
    <Link href={href} className="font-mono" title={value}>
      {trunc(value, head, tail)}
    </Link>
  )
}

export function AddressLink({
  address,
  len = 6,
  showLabel = true,
}: {
  address: string
  len?: number
  showLabel?: boolean
}) {
  const w = getWallet(address)
  const label = showLabel ? w?.handle ?? w?.label : null
  return (
    <Link href={`/wallet/${address}`} className="font-mono" title={address}>
      {label ?? trunc(address, len, 4)}
    </Link>
  )
}

export function AgentLink({ agent }: { agent: Agent }) {
  return (
    <Link href={`/agent/${agent.swarm}/${agent.id}`} className="font-mono">
      {agent.name}
    </Link>
  )
}

export function SwarmLink({ slug }: { slug: string }) {
  const s = swarms.find((x) => x.slug === slug)
  if (!s) return <span className="font-mono text-muted-foreground">unknown</span>
  return (
    <Link href={`/swarms/${slug}`} className="font-mono">
      {s.name}
    </Link>
  )
}

/* ------------------------------------------------------------------- glyph */

export { Glyph }

export function AgentGlyph({
  agent,
  size = 32,
  fluid = false,
  className = '',
}: {
  agent: Agent
  size?: number
  fluid?: boolean
  className?: string
}) {
  return (
    <Glyph
      seed={agent.address}
      tier={agent.tier}
      halted={agent.halted}
      size={size}
      fluid={fluid}
      className={className}
      title={agent.name}
    />
  )
}

export function AgentThumbLink({ agent, size = 40 }: { agent: Agent; size?: number }) {
  return (
    <Link
      href={`/agent/${agent.swarm}/${agent.id}`}
      className="inline-block shrink-0 no-underline hover:bg-transparent"
      title={agent.name}
    >
      <AgentGlyph agent={agent} size={size} />
    </Link>
  )
}

/* -------------------------------------------------------------- navigation */

export function TabNav({
  items,
}: {
  items: Array<{ label: string; href: string; active?: boolean; count?: number }>
}) {
  return (
    <nav className="flex flex-wrap items-center gap-1 border-b border-line bg-surface-2 px-1 py-1">
      {items.map((t) => (
        <Link
          key={t.href + t.label}
          href={t.href}
          className="btn no-underline"
          data-on={t.active ? 'true' : undefined}
        >
          {t.label}
          {typeof t.count === 'number' ? (
            <span className="num opacity-70">({t.count})</span>
          ) : null}
        </Link>
      ))}
    </nav>
  )
}

export function Pager({
  page,
  pages,
  build,
  total,
  unit = 'rows',
}: {
  page: number
  pages: number
  build: (page: number) => string
  total: number
  unit?: string
}) {
  const window: number[] = []
  const start = Math.max(1, Math.min(page - 2, pages - 4))
  for (let i = start; i < start + 5 && i <= pages; i++) window.push(i)
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line bg-surface-2 px-2 py-1">
      <span className="num font-mono text-[10px] text-muted-foreground">
        {total.toLocaleString('en-US')} {unit} {'\u00b7'} page {page} of {pages}
      </span>
      <span className="flex items-center gap-1">
        <Btn href={build(1)} disabled={page === 1}>
          first
        </Btn>
        <Btn href={build(Math.max(1, page - 1))} disabled={page === 1}>
          prev
        </Btn>
        {window.map((p) => (
          <Btn key={p} href={build(p)} on={p === page}>
            {p}
          </Btn>
        ))}
        <Btn href={build(Math.min(pages, page + 1))} disabled={page === pages}>
          next
        </Btn>
        <Btn href={build(pages)} disabled={page === pages}>
          last
        </Btn>
      </span>
    </div>
  )
}

/* ------------------------------------------------------------------ charts */

export function BarChart({
  data,
  labels,
  height = 96,
  color = 'var(--foreground)',
  unit = '',
}: {
  data: number[]
  labels: string[]
  height?: number
  color?: string
  unit?: string
}) {
  const max = Math.max(...data, 1)
  const w = 4
  const gap = 2
  const total = data.length * (w + gap)
  return (
    <div className="px-2 py-2">
      <svg
        viewBox={`0 0 ${total} ${height}`}
        preserveAspectRatio="none"
        className="block h-24 w-full"
        role="img"
        aria-label={`chart, ${data.length} points, peak ${max}${unit}`}
      >
        <line x1="0" y1={height - 0.5} x2={total} y2={height - 0.5} stroke="var(--hair)" strokeWidth="1" />
        <line x1="0" y1={height / 2} x2={total} y2={height / 2} stroke="var(--hair)" strokeWidth="1" strokeDasharray="2 3" />
        {data.map((v, i) => {
          const h = Math.max(1, (v / max) * (height - 4))
          return <rect key={i} x={i * (w + gap)} y={height - h} width={w} height={h} fill={color} />
        })}
      </svg>
      <div className="mt-1 flex justify-between font-mono text-[9px] text-muted-foreground">
        <span>{labels[0]}</span>
        <span>
          peak {max.toLocaleString('en-US')}
          {unit}
        </span>
        <span>{labels[labels.length - 1]}</span>
      </div>
    </div>
  )
}

export function Bars({
  rows,
}: {
  rows: Array<{ label: ReactNode; value: number; max: number; right?: ReactNode }>
}) {
  return (
    <table className="tbl">
      <tbody>
        {rows.map((r, i) => (
          <tr key={i}>
            <td className="w-[150px]">{r.label}</td>
            <td className="w-full">
              <span className="block h-[9px] w-full border border-hair bg-ink">
                <span
                  className="block h-full bg-clay"
                  style={{ width: `${Math.max(2, (r.value / r.max) * 100)}%` }}
                />
              </span>
            </td>
            <td className="num text-right">{r.right}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
