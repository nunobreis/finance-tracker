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

// iOS home-screen launch images (public/splash/, rendered from <SplashScreen />).
// iOS only uses an image whose size exactly matches the device, so there is one per
// iPhone screen size: [CSS width, CSS height, pixel ratio], portrait.
const IOS_SPLASH_SIZES: Array<[number, number, number]> = [
  [440, 956, 3], [430, 932, 3], [428, 926, 3], [420, 912, 3], [414, 896, 3], [414, 896, 2],
  [402, 874, 3], [393, 852, 3], [390, 844, 3], [375, 812, 3], [375, 667, 2], [320, 568, 2],
]

export const metadata: Metadata = {
  title: 'Norte',
  description: 'Personal finance tracking',
  appleWebApp: {
    capable: true,
    title: 'Norte',
    startupImage: IOS_SPLASH_SIZES.map(([w, h, r]) => ({
      url: `/splash/iphone-${w}x${h}@${r}x.png`,
      media: `(device-width: ${w}px) and (device-height: ${h}px) and (-webkit-device-pixel-ratio: ${r}) and (orientation: portrait)`,
    })),
  },
  // Next.js only emits the newer `mobile-web-app-capable`; iOS still requires the
  // Apple-prefixed tag before it will show apple-touch-startup-image launch images.
  other: { 'apple-mobile-web-app-capable': 'yes' },
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
