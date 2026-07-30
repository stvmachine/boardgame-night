import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': resolve(__dirname, 'app/frontend') }
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['tests/vitest/setup.ts'],
    include: ['app/frontend/**/*.spec.{ts,tsx}', 'tests/vitest/**/*.spec.{ts,tsx}']
  }
})
