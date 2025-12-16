// vite.config.ts
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    base: '/',
    define: {
      'process.env.API_KEY': JSON.stringify(env.VITE_GOOGLE_API_KEY),
      'process.env.API_KEY_PRO': JSON.stringify(env.VITE_GOOGLE_API_KEY_PRO),
    },
    // dev-server fallback for React-Router
    server: {
      historyApiFallback: true,
    },
    build: {
      rollupOptions: {
        // keep your external if you need it
        external: ['../generated/prisma/index.js'],
        // ensure single entry point (Vercel needs this)
        input: '/index.html',
      },
    },
  }
})
