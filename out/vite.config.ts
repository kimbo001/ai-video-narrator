// vite.config.ts
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    base: '/',
    define: {
      'process.env.API_KEY': JSON.stringify(env.VITE_GOOGLE_API_KEY),
      'process.env.API_KEY_PRO': JSON.stringify(env.VITE_GOOGLE_API_KEY_PRO),
    },
    resolve: {
      alias: { '@': path.resolve(__dirname, './src') },
    },
    server: {
      port: 5173, // or whatever you use
      proxy: {
        '/api': {
          target: 'http://localhost:5173', // ← CHANGE THIS to your actual backend port
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
