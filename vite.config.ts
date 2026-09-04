import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Saves belong to an origin. Do not silently switch to another port.
  server: { port: 5173, strictPort: true },
  preview: { port: 4173, strictPort: true },
})
