import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vercel 배포 전용: base는 '/' 고정
export default defineConfig({
  plugins: [react()],
  base: '/',
})
