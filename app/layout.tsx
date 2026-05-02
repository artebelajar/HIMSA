import type { Metadata } from 'next'
import { Space_Grotesk, Poppins } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { AppProvider } from '@/providers/app-provider'
import { CursorTrailWrapper } from '@/components/cursor-trail-wrapper'
import { AuthGuard } from '@/components/auth-guard'

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
        <script dangerouslySetInnerHTML={{
          __html: `
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', () => {
                navigator.serviceWorker.register('/service-worker.js').then(
                  (registration) => console.log('SW registered'),
                  (err) => console.log('SW failed:', err)
                );
              });
            }
          `
        }} />
         <meta name="application-name" content="HIMSA" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="default" />
  <meta name="apple-mobile-web-app-title" content="HIMSA" />
  <meta name="mobile-web-app-capable" content="yes" />
  <meta name="theme-color" content="#00d9ff" />
  <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={`${poppins.variable} ${spaceGrotesk.variable} font-sans antialiased bg-background text-foreground overflow-x-hidden`}>
  <AppProvider>
    <CursorTrailWrapper />
    {children}
  </AppProvider>
  {process.env.NODE_ENV === 'production' && <Analytics />}
</body>
    </html>
  )
}