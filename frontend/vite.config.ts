import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Must match the backend listen port (`PORT` in backend/.env). Default 3000.
const devBackendOrigin =
  process.env.VITE_DEV_BACKEND_ORIGIN?.replace(/\/$/, '') ||
  `http://127.0.0.1:${process.env.VITE_BACKEND_PORT || '3000'}`

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: devBackendOrigin,
        changeOrigin: true,
      },
      '/uploads': {
        target: devBackendOrigin,
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rolldownOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('react') && !id.includes('react-query')) return 'react';
          if (id.includes('react-router-dom')) return 'router';
          if (id.includes('@tanstack/react-query')) return 'query';
          if (id.includes('leaflet') || id.includes('react-leaflet')) return 'map';
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
})
