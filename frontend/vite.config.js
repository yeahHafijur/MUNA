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
        enabled: false,
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
        display_override: ['window-controls-overlay', 'standalone', 'minimal-ui'],
        orientation: 'portrait',
        categories: ['shopping', 'groceries', 'food'],
        lang: 'en',
        dir: 'ltr',
        iarc_rating_id: 'e84b072d-71b3-4d3e-86ae-31a8ce4e53b7',
        related_applications: [
          {
            platform: 'play',
            url: 'https://play.google.com/store/apps/details?id=com.muna.app',
            id: 'com.muna.app'
          }
        ],
        shortcuts: [
          {
            name: "Open Cart",
            short_name: "Cart",
            description: "View your shopping cart",
            url: "/cart",
            icons: [{ src: "/icon-192x192.png", sizes: "192x192" }]
          },
          {
            name: "Vendor Dashboard",
            short_name: "Vendor",
            description: "Manage your shop",
            url: "/vendor-dashboard",
            icons: [{ src: "/icon-192x192.png", sizes: "192x192" }]
          }
        ],
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
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'vendor';
            }
            if (id.includes('firebase')) {
              return 'firebase';
            }
            if (id.includes('@tanstack')) {
              return 'query';
            }
            return 'vendor-other';
          }
        }
      }
    }
  },
  server: {
    host: true,
    proxy: {
      '/api': 'http://127.0.0.1:5000',
      '/uploads': 'http://127.0.0.1:5000'
    }
  }
})
