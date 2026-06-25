import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bundla.vercel.app'),
  title: {
    default: 'Bundla — Två produktbilder. En färdig bundle.',
    template: '%s · Bundla',
  },
  description:
    'Bundla friställer två produktbilder automatiskt och slår ihop dem till en färdig bundle-bild för e-handel.',
  applicationName: 'Bundla',
  openGraph: {
    type: 'website',
    locale: 'sv_SE',
    siteName: 'Bundla',
    title: 'Bundla — Två produktbilder. En färdig bundle.',
    description: 'Automatisk friläggning och bundling-bilder för e-handel.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bundla — Två produktbilder. En färdig bundle.',
    description: 'Automatisk friläggning och bundling-bilder för e-handel.',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="sv" suppressHydrationWarning>
      <body className="font-sans antialiased" suppressHydrationWarning>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
