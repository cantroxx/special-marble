import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vercel 정적 배포와 호환되는 기본 설정입니다.
export default defineConfig({
  plugins: [react()],
})
