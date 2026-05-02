import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'HIMSA - Himpunan Santri Almahir',
    short_name: 'HIMSA',
    description: 'Web app organisasi HIMSA',
    start_url: '/',
    display: 'standalone',
    background_color: '#08080f',
    theme_color: '#00d9ff',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}