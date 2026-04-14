import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

export default defineConfig({
  plugins: [
    nodePolyfills({
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
      protocolImports: true,
    }),
    react(),
    tailwindcss(),
  ],
  optimizeDeps: {
    include: [
      'buffer',
      '@solana/web3.js',
      '@solana/spl-token',
    ],
  },
})
