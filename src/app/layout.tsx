import type {Metadata} from 'next'
import {Geist, Geist_Mono} from 'next/font/google'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'hub',
  description: "bozzhik's hub and sandbox",
}

import {ConvexProvider} from '@/lib/convex/provider'

import YandexMetrika from '@/components/analytics'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <ConvexProvider>{children}</ConvexProvider>

        {process.env.NODE_ENV === 'production' && <YandexMetrika />}
      </body>
    </html>
  )
}
