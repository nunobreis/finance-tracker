import type { Metadata, Viewport } from 'next'
import { Manrope } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
import './globals.css'

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-manrope',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Norte',
  description: 'Personal finance tracking',
}

export const viewport: Viewport = {
  themeColor: '#0D1525',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale()
  const messages = await getMessages()

  return (
    <html lang={locale} className={manrope.variable}>
      {/* bg-ink: dark navy fills iOS overscroll region behind status bar.
           Actual light content areas set their own bg-canvas/bg-surface. */}
      <body className={`${manrope.className} bg-ink text-ink antialiased`}>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
