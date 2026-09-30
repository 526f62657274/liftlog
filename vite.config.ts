import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vitest/config'

// Relative base so the same build works on a web host, in a sub-folder, and inside Capacitor.
export default defineConfig({
  base: './',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Liftlog',
        short_name: 'Liftlog',
        description: 'A dead-simple gym tracker. Log sets, see numbers go up.',
        theme_color: '#09090b',
        background_color: '#09090b',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '.',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Precache the exercise photos too, so the app works fully offline in the gym.
        globPatterns: ['**/*.{js,css,html,svg,png,jpg,webmanifest}'],
      },
    }),
  ],
  server: { host: true },
  test: { environment: 'node' },
})
