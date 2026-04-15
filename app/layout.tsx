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
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
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
