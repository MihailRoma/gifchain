'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const LINKS: Array<{ href: string; label: string; match?: string[] }> = [
  { href: '/blocks', label: 'blocks', match: ['/block'] },
  { href: '/txs', label: 'transactions', match: ['/tx'] },
  { href: '/wallets', label: 'accounts', match: ['/wallet'] },
  { href: '/activity', label: 'inference feed' },
  { href: '/contracts', label: 'contracts' },
  { href: '/stats', label: 'analytics' },
]

const ACTIVE = 'bg-clay text-clay-foreground hover:bg-clay'

export function ExplorerNav({ homeHref }: { homeHref: string }) {
  const pathname = usePathname() || '/'
  // The explorer root is `/` on its own domain and `/explorer` in preview.
  const onHome = pathname === '/' || pathname === '/explorer'

  return (
    <nav
      aria-label="Explorer"
      className="mt-1 flex flex-wrap items-stretch border border-line bg-surface font-mono text-[11px]"
    >
      <Link
        href={homeHref}
        aria-current={onHome ? 'page' : undefined}
        className={`border-r border-hair px-2 py-[3px] no-underline ${onHome ? ACTIVE : 'text-foreground'}`}
      >
        overview
      </Link>
      {LINKS.map((l) => {
        const active =
          pathname === l.href ||
          pathname.startsWith(l.href + '/') ||
          (l.match ?? []).some((m) => pathname.startsWith(m + '/'))
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? 'page' : undefined}
            className={`border-r border-hair px-2 py-[3px] no-underline ${active ? ACTIVE : 'text-foreground'}`}
          >
            {l.label}
          </Link>
        )
      })}
    </nav>
  )
}
