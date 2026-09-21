import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  preview: {
    headers: { 'Cache-Control': 'no-cache' },
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png', 'icons/larga-short-apple-touch.png'],
      manifest: {
        name: 'Larga — Real-Time Jeepney Tracking',
        short_name: 'Larga',
        description:
          'Track jeepneys in real time along the Santa Fe–Solano corridor in Nueva Vizcaya.',
        id: '/',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#ffffff',
        theme_color: '#f57c1f',
        categories: ['travel', 'navigation', 'utilities'],
        icons: [
          { src: '/icons/larga-short-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/larga-short-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          {
            src: '/icons/larga-short-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        navigateFallback: '/index.html',
        globPatterns: ['**/*.{js,css,html,png,svg,webp,woff2}', 'maplibre/*.mjs'],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.hostname === 'tile.openstreetmap.org',
            handler: 'CacheFirst',
            options: {
              cacheName: 'osm-tiles',
              expiration: { maxEntries: 400, maxAgeSeconds: 60 * 60 * 24 * 14 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: ({ url }) => url.hostname === 'fonts.gstatic.com',
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: ({ url }) => url.hostname === 'fonts.googleapis.com',
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts-css' },
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
});
