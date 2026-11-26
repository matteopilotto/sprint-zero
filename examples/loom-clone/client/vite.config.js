import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: { port: 5173, strictPort: true },
  // Prepare this at startup. It is loaded only when a recording stops, and
  // Vite would otherwise reload the page at that moment the first time.
  optimizeDeps: { include: ['mediabunny'] },
})
