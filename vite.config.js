import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
  ],
  define: {
    global: 'window',
    'process.env': {},
  },
  resolve: {
    alias: {
      events: 'events',
      stream: 'stream-browserify',
      util: 'util',
      process: 'process/browser',
      buffer: 'buffer',
    },
  },
  server: {
    proxy: {
      '/api/issues': { target: 'http://localhost:4000', changeOrigin: true },
      '/api/projects': { target: 'http://localhost:4000', changeOrigin: true },
      '/api/sprints': { target: 'http://localhost:4000', changeOrigin: true },
      '/api/blockers': { target: 'http://localhost:4000', changeOrigin: true },
      '/api/pull-requests': { target: 'http://localhost:4000', changeOrigin: true },
      '/api/bug-reports': { target: 'http://localhost:4000', changeOrigin: true },
      '/api/tester-hub': { target: 'http://localhost:4000', changeOrigin: true },
      '/api/releases': { target: 'http://localhost:4000', changeOrigin: true },
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
