import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import viteImagemin from 'vite-plugin-imagemin'

// https://vitejs.dev/config/ 
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '')

  return {
    plugins: [
      react(),
      viteImagemin({
        webp: { quality: 75 },
        mozjpeg: { quality: 80 },
        pngquant: { quality: [0.6, 0.8] }
      })
    ],
    base: '/', // ← ADD THIS LINE (critical for Vercel)
    define: {
      'process.env.API_KEY': JSON.stringify(env.VITE_GOOGLE_API_KEY),
      'process.env.API_KEY_PRO': JSON.stringify(env.VITE_GOOGLE_API_KEY_PRO),
    },
  }
})
