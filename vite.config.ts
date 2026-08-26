import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: true,
    // Babylon is intentionally isolated in one lazy engine chunk. The builder shell and
    // deterministic compiler worker remain separate and load first.
    chunkSizeWarningLimit: 1_500,
  },
})
