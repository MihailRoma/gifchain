/**
 * Domain map. The protocol site and the explorer are two separate properties
 * that share one deployment; `proxy.ts` routes hosts to the right tree.
 *
 * Change ROOT_DOMAIN and everything else follows.
 */
export const ROOT_DOMAIN = 'claudechain.ai'
export const EXPLORER_SUBDOMAIN = 'explorer'
export const EXPLORER_DOMAIN = `${EXPLORER_SUBDOMAIN}.${ROOT_DOMAIN}`

export const ROOT_URL = `https://${ROOT_DOMAIN}`
export const EXPLORER_URL = `https://${EXPLORER_DOMAIN}`

/** Where the $CLAUDECHAIN token lives. Swap this when the launchpad moves. */
export const TOKEN_URL = 'https://ponsfamily.com/launchpad/0x7f166fb1b5bdd2e94e89d7bb35a13d85ec74850f'

/** The explorer's own home page, served at the root of the explorer domain. */
export const EXPLORER_HOME = '/explorer'

/**
 * Routes that belong to the explorer rather than the protocol site. Both trees
 * live in one deployment, so ownership is declared here and enforced by
 * `proxy.ts`: on the protocol domain these redirect to the explorer domain.
 *
 * Agent and swarm pages are deliberately absent — they are shared, and take
 * whichever chrome the current host implies.
 */
const EXPLORER_SEGMENTS = [
  'explorer',
  'blocks',
  'block',
  'txs',
  'tx',
  'wallets',
  'wallet',
  'activity',
  'contracts',
  'stats',
  'search',
]

export function isExplorerPath(pathname: string): boolean {
  const segment = pathname.split('/')[1] ?? ''
  return EXPLORER_SEGMENTS.includes(segment)
}

/**
 * Hosts that are not the real production domain (v0 previews, localhost,
 * *.vercel.app). On these there is no `explorer.` subdomain to send people to,
 * so the explorer stays reachable at its /explorer path instead.
 */
export function isCanonicalHost(hostname: string): boolean {
  return hostname === ROOT_DOMAIN || hostname.endsWith(`.${ROOT_DOMAIN}`)
}

export function isExplorerHost(hostname: string): boolean {
  return hostname === EXPLORER_DOMAIN || hostname.startsWith(`${EXPLORER_SUBDOMAIN}.`)
}

/**
 * Links stay relative everywhere. Explorer routes keep their real paths on both
 * hosts, so `/blocks` resolves on the explorer domain directly and redirects
 * there from the protocol domain. Only the explorer home needs a translation,
 * since it is `/` on the explorer host and `/explorer` in preview.
 */
export function explorerHome(onExplorerHost: boolean): string {
  return onExplorerHost ? '/' : EXPLORER_HOME
}

/**
 * Link from the protocol site to the explorer. On the real domain that is a
 * cross-origin URL; in preview there is no second host, so it stays a path.
 */
export function explorerLinkFor(host: string): string {
  return isCanonicalHost(host) ? EXPLORER_URL : EXPLORER_HOME
}
