import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, '.', '');
  
  // Vercel injects environment variables into process.env, 
  // but loadEnv only reads from .env files. We need to fallback to process.env.
  const apiKey = env.API_KEY || process.env.API_KEY;

  return {
    plugins: [react()],
    define: {
      // This ensures 'process.env.API_KEY' in your code is replaced with the actual value during build
      'process.env.API_KEY': JSON.stringify(apiKey),
    },
  }
})