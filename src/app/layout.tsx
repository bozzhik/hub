export {metadata} from '@/lib/layout.config'
import {geistSans, geistMono} from '@/lib/layout.config'
import './globals.css'

import {cn} from '@/lib/utils'

import {ConvexProvider} from '@/lib/convex/provider'

import YandexMetrika from '@/components/analytics'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={cn([geistSans.variable, geistMono.variable], 'dark', 'h-full antialiased', 'font-sans')}>
      <body className="min-h-full flex flex-col">
        <ConvexProvider>{children}</ConvexProvider>

        {process.env.NODE_ENV === 'production' && <YandexMetrika />}
      </body>
    </html>
  )
}
