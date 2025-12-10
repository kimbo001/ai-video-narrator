import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '')

  return {
    plugins: [react()],
    base: '/', // ← ADD THIS LINE (critical for Vercel)
    define: {
      'process.env.API_KEY': JSON.stringify(env.VITE_GOOGLE_API_KEY),
      'process.env.API_KEY_PRO': JSON.stringify(env.VITE_GOOGLE_API_KEY_PRO),
    },
  }
})
