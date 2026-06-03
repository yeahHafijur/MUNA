import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      strategies: 'injectManifest',
      srcDir: 'public',
      filename: 'sw.js',
      devOptions: {
        enabled: true,
        type: 'module',
      },
      manifest: {
        id: '/',
        name: 'MUNA App',
        short_name: 'MUNA',
        description: 'Apne Gaon ki Har Dukan, Ek Jagah!',
        theme_color: '#f59e0b', // Amber/Yellow
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        categories: ['shopping', 'groceries', 'food'],
        lang: 'en',
        icons: [
          {
            src: '/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ],
        screenshots: [
          {
            src: '/icon-512x512.png', // Placeholder, we will update this later with real screenshot
            sizes: '512x512',
            type: 'image/png',
            form_factor: 'wide',
            label: 'MUNA Desktop View'
          },
          {
            src: '/icon-512x512.png', // Placeholder
            sizes: '512x512',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'MUNA Mobile View'
          }
        ]
      }
    })
  ],
  server: {
    host: true,
    proxy: {
      '/api': 'http://127.0.0.1:5000',
      '/uploads': 'http://127.0.0.1:5000'
    }
  }
})
