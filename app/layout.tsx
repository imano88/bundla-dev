import type { Metadata, Viewport } from 'next'
import { Familjen_Grotesk, Bricolage_Grotesque, Space_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const fontSans = Familjen_Grotesk({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-familjen',
})
const fontDisplay = Bricolage_Grotesque({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-bricolage',
})
const fontMono = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  display: 'swap',
  variable: '--font-space-mono',
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bundla.vercel.app'),
  title: {
    default: 'Bundla: Två bilder. En bundle.',
    template: '%s · Bundla',
  },
  description:
    'Bundla frilägger två produktbilder automatiskt och slår ihop dem till en färdig bundle-bild för e-handel.',
  applicationName: 'Bundla',
  openGraph: {
    type: 'website',
    locale: 'sv_SE',
    siteName: 'Bundla',
    title: 'Bundla: Två bilder. En bundle.',
    description: 'Automatisk friläggning och bundling-bilder för e-handel.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bundla: Två bilder. En bundle.',
    description: 'Automatisk friläggning och bundling-bilder för e-handel.',
  },
}

export const viewport: Viewport = {
  themeColor: '#f4f0e9',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="sv"
      className={`${fontSans.variable} ${fontDisplay.variable} ${fontMono.variable}`}
      suppressHydrationWarning
    >
      <body className="font-sans antialiased" suppressHydrationWarning>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
