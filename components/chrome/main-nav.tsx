'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

/**
 * Protocol-site navigation. Chain browsing (blocks, transactions, accounts,
 * analytics) belongs to the explorer property and is reached through the single
 * outbound link at the end rather than duplicated here.
 */
const LINKS: Array<{ href: string; label: string; match?: string[] }> = [
  { href: '/', label: 'home' },
  { href: '/objects', label: 'objects', match: ['/object'] },
  { href: '/collections', label: 'collections' },
  { href: '/mint', label: 'mint' },
  { href: '/bridge', label: 'bridge' },
  { href: '/wallets', label: 'wallets' },
  { href: '/developers', label: 'developers' },
  { href: '/docs', label: 'docs' },
]

export function MainNav({ explorerHref }: { explorerHref: string }) {
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
              active
                ? 'bg-foreground text-lime hover:bg-foreground hover:text-lime'
                : 'text-foreground'
            }`}
          >
            {l.label}
          </Link>
        )
      })}
      <a
        href={explorerHref}
        className="ml-auto border-l border-hair bg-lime px-2 py-[3px] font-bold text-foreground no-underline hover:bg-lime"
      >
        explorer {'\u2197'}
      </a>
    </nav>
  )
}
