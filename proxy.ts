import { NextResponse, type NextRequest } from 'next/server'
import {
  EXPLORER_HOME,
  EXPLORER_URL,
  isCanonicalHost,
  isExplorerHost,
  isExplorerPath,
} from '@/lib/site'

/**
 * Splits one deployment into two properties.
 *
 *   gif.com          protocol site   /, /objects, /collections, /mint, /docs
 *   explore.gif.com  block explorer  /, /blocks, /tx, /wallet, /stats
 *
 * Chain routes keep their real paths on both hosts, so the only rewrite needed
 * is the explorer's root. Everything else is a redirect from the protocol
 * domain to the explorer domain, plus an `x-gif-site` hint the root layout uses
 * to pick which chrome to render.
 *
 * Preview and localhost have no `explore.` subdomain, so there the explorer is
 * identified by path and nothing is redirected — both properties stay reachable
 * from a single origin.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const hostname = (request.headers.get('host') ?? '').split(':')[0].toLowerCase()

  const onExplorerHost = isExplorerHost(hostname)
  const onProtocolHost = isCanonicalHost(hostname) && !onExplorerHost

  // Send explorer traffic that landed on the protocol domain to its own domain,
  // but only where that domain actually exists.
  if (onProtocolHost && isExplorerPath(pathname)) {
    const target = pathname === EXPLORER_HOME ? '/' : pathname
    return NextResponse.redirect(`${EXPLORER_URL}${target}${search}`, 308)
  }

  const site = onExplorerHost || (!isCanonicalHost(hostname) && isExplorerPath(pathname))
    ? 'explorer'
    : 'main'

  const headers = new Headers(request.headers)
  headers.set('x-gif-site', site)

  // The explorer's landing page lives at /explorer in the tree but is the root
  // of its own domain.
  if (onExplorerHost && pathname === '/') {
    const url = request.nextUrl.clone()
    url.pathname = EXPLORER_HOME
    return NextResponse.rewrite(url, { request: { headers } })
  }

  return NextResponse.next({ request: { headers } })
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|objects/.*\\.png|.*\\.png$).*)'],
}
