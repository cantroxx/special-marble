import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base:'./' → 같은 빌드가 Vercel(루트 /)과 퀴즈타운(/marble/) 양쪽에서 동작해요.
export default defineConfig({
  base: './',
  plugins: [react()],
})
