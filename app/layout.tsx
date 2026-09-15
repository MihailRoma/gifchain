import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { SiteHeader } from '@/components/chrome/site-header'
import { SiteFooter } from '@/components/chrome/site-footer'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'GIFCHAIN \u00b7 the blockchain for NFTs',
    template: '%s \u00b7 GIFCHAIN',
  },
  description:
    'GIFCHAIN is an object-native network. Explore blocks, transactions, collections, wallets and every digital object on chain.',
  generator: 'v0.app',
  icons: {
    icon: [{ url: '/gifchain-logo-nobg.png', type: 'image/png' }],
    apple: '/gifchain-logo.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#d2fd00',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="bg-background">
      <body className="antialiased">
        <div className="mx-auto w-full max-w-[1200px] px-2 pb-10 pt-2">
          <SiteHeader />
          <main>{children}</main>
          <SiteFooter />
        </div>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
