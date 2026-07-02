import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: { '@': resolve(__dirname, 'app/frontend') }
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['app/frontend/**/*.spec.ts', 'tests/vitest/**/*.spec.ts']
  }
})
