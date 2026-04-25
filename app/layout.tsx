import type { Metadata } from 'next'
import { Space_Grotesk, Poppins } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { AppProvider } from '@/providers/app-provider'
import { CursorTrail } from '@/components/cursor-trail'

const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: '--font-space-grotesk' });
const poppins = Poppins({ subsets: ["latin"], weight: ['400', '500', '600', '700'], variable: '--font-poppins' });

export const metadata: Metadata = {
  title: 'HIMSA - Himpunan Santri Almahir',
  description: 'Web app organisasi HIMSA dengan fitur posting, chat, dan manajemen konten',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icon.svg" />
        <style>{`
          :root {
            --primary: #098dd8;
            --background-start: #0f172a;
            --background-end: #098dd8;
          }
        `}</style>
      </head>
      <body className={`${poppins.variable} ${spaceGrotesk.variable} font-sans antialiased bg-background text-foreground overflow-x-hidden`}>
        <AppProvider>
          <CursorTrail />
          {children}
          {process.env.NODE_ENV === 'production' && <Analytics />}
        </AppProvider>
      </body>
    </html>
  )
}