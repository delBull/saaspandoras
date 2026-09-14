import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // Telegram WebApp requires the app to be served from HTTPS with no mixed content.
  // In production (Vercel), set NEXT_PUBLIC_APP_URL accordingly.
  server: {
    port: 5173,
    host: true,
  },
  build: {
    // Optimize for Telegram's WebView (Chromium-based)
    target: 'es2020',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'vendor-react';
          }
          if (id.includes('node_modules/react-router-dom')) {
            return 'vendor-router';
          }
        },
      },
    },
  },
  define: {
    // Make the core API URL available at build time
    __NEXUS_API_URL__: JSON.stringify(
      process.env.VITE_NEXUS_API_URL || 'https://dash.pandoras.finance'
    ),
  },
})
