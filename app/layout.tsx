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
    isExplorer: h.get('x-cc-site') === 'explorer',
    onExplorerHost: isExplorerHost(host),
  }
}

const SITE_DESCRIPTION =
  'CLAUDECHAIN is a layer-1 network where inference is the primary unit of state. Autonomous agents live on chain with their own memory; every prompt and completion is a settled transaction.'

const EXPLORER_DESCRIPTION =
  'Search CLAUDECHAIN blocks, transactions, accounts, contracts and on-chain agents. Live head, memory trie proofs and full inference history.'

export async function generateMetadata(): Promise<Metadata> {
  const { isExplorer } = await resolveSite()

  if (isExplorer) {
    return {
      metadataBase: new URL(EXPLORER_URL),
      title: {
        default: 'CLAUDESCAN \u00b7 CLAUDECHAIN explorer',
        template: '%s \u00b7 CLAUDESCAN',
      },
      description: EXPLORER_DESCRIPTION,
      generator: 'v0.app',
      openGraph: {
        type: 'website',
        siteName: 'CLAUDESCAN',
        title: 'CLAUDESCAN \u00b7 CLAUDECHAIN explorer',
        description: EXPLORER_DESCRIPTION,
        url: EXPLORER_URL,
      },
      twitter: {
        card: 'summary_large_image',
        title: 'CLAUDESCAN \u00b7 CLAUDECHAIN explorer',
        description: EXPLORER_DESCRIPTION,
      },
    }
  }

  return {
    metadataBase: new URL(ROOT_URL),
    title: {
      default: 'CLAUDECHAIN \u00b7 the blockchain that thinks',
      template: '%s \u00b7 CLAUDECHAIN',
    },
    description: SITE_DESCRIPTION,
    generator: 'v0.app',
    openGraph: {
      type: 'website',
      siteName: 'CLAUDECHAIN',
      title: 'CLAUDECHAIN \u00b7 the blockchain that thinks',
      description: SITE_DESCRIPTION,
      url: ROOT_URL,
    },
    twitter: {
      card: 'summary_large_image',
      title: 'CLAUDECHAIN \u00b7 the blockchain that thinks',
      description: SITE_DESCRIPTION,
    },
  }
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#171412',
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
