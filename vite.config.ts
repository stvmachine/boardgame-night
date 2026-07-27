import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'
import RubyPlugin from 'vite-plugin-ruby'

export default defineConfig({
  plugins: [RubyPlugin(), react(), tailwindcss()],
  resolve: {
    alias: { '@': resolve(__dirname, 'app/frontend') }
  },
  server: {
    port: 5173,
    proxy: {
      '/graphql': 'http://localhost:3000',
      '/cable': {
        target: 'http://localhost:3000',
        ws: true,
      },
    }
  }
})
