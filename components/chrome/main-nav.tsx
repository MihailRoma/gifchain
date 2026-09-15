'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const LINKS: Array<{ href: string; label: string; match?: string[] }> = [
  { href: '/', label: 'home' },
  { href: '/explorer', label: 'explorer' },
  { href: '/blocks', label: 'blocks', match: ['/block'] },
  { href: '/txs', label: 'transactions', match: ['/tx'] },
  { href: '/objects', label: 'objects', match: ['/object'] },
  { href: '/collections', label: 'collections' },
  { href: '/activity', label: 'activity' },
  { href: '/mint', label: 'mint' },
  { href: '/wallets', label: 'wallets', match: ['/wallet'] },
  { href: '/contracts', label: 'contracts' },
  { href: '/stats', label: 'stats' },
  { href: '/bridge', label: 'bridge' },
  { href: '/developers', label: 'developers' },
  { href: '/docs', label: 'docs' },
]

export function MainNav() {
  const pathname = usePathname() || '/'
  return (
    <nav
      aria-label="Main"
      className="mt-1 flex flex-wrap items-stretch border border-line bg-surface font-mono text-[11px]"
    >
      {LINKS.map((l) => {
        const active =
          l.href === '/'
            ? pathname === '/'
            : pathname === l.href ||
              pathname.startsWith(l.href + '/') ||
              (l.match ?? []).some((m) => pathname.startsWith(m + '/'))
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? 'page' : undefined}
            className={`border-r border-hair px-2 py-[3px] no-underline ${
              active ? 'bg-foreground text-lime hover:bg-foreground hover:text-lime' : 'text-foreground'
            }`}
          >
            {l.label}
          </Link>
        )
      })}
    </nav>
  )
}
