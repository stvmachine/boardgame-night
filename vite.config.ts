import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'
import RubyPlugin from 'vite-plugin-ruby'

export default defineConfig({
  plugins: [RubyPlugin(), vue(), tailwindcss()],
  resolve: {
    alias: { '@': resolve(__dirname, 'app/frontend') }
  },
  server: {
    port: 5173,
    // Fallback proxy (not needed if skipProxy: true + rack-cors, but kept as safety net)
    proxy: {
      '/graphql': 'http://localhost:3000',
      '/cable': {
        target: 'http://localhost:3000',
        ws: true,
      },
    }
  }
})
