import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { headers } from 'next/headers'
import { ExplorerFooter } from '@/components/chrome/explorer-footer'
import { ExplorerHeader } from '@/components/chrome/explorer-header'
import { SiteFooter } from '@/components/chrome/site-footer'
import { SiteHeader } from '@/components/chrome/site-header'
import { NowProvider } from '@/components/live/now-provider'
import { EXPLORER_URL, ROOT_URL, isExplorerHost } from '@/lib/site'
import './globals.css'

/** Which property this request belongs to. `proxy.ts` decides and tags it. */
async function resolveSite() {
  const h = await headers()
  const host = (h.get('host') ?? '').split(':')[0].toLowerCase()
  return {
    isExplorer: h.get('x-gif-site') === 'explorer',
    onExplorerHost: isExplorerHost(host),
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const { isExplorer } = await resolveSite()

  if (isExplorer) {
    return {
      metadataBase: new URL(EXPLORER_URL),
      title: {
        default: 'GIFSCAN \u00b7 GIFCHAIN explorer',
        template: '%s \u00b7 GIFSCAN',
      },
      description:
        'Search GIFCHAIN blocks, transactions, accounts, contracts and on-chain objects. Live head, object trie proofs and full transaction history.',
      generator: 'v0.app',
    }
  }

  return {
    metadataBase: new URL(ROOT_URL),
    title: {
      default: 'GIFCHAIN \u00b7 the blockchain for NFTs',
      template: '%s \u00b7 GIFCHAIN',
    },
    description:
      'GIFCHAIN is an object-native network. Explore blocks, transactions, collections, wallets and every digital object on chain.',
    generator: 'v0.app',
  }
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#d2fd00',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const { isExplorer, onExplorerHost } = await resolveSite()

  return (
    <html lang="en" className="bg-background">
      <body className="antialiased">
        {/* Seeded on the server so the first client paint matches, then the
            provider takes over and drives every age and height on the page. */}
        <NowProvider initial={Date.now()}>
          <div className="mx-auto w-full max-w-[1200px] px-2 pb-10 pt-2">
            {isExplorer ? <ExplorerHeader onExplorerHost={onExplorerHost} /> : <SiteHeader />}
            <main>{children}</main>
            {isExplorer ? <ExplorerFooter onExplorerHost={onExplorerHost} /> : <SiteFooter />}
          </div>
        </NowProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
