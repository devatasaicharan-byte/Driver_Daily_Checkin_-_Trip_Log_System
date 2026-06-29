import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? '/Driver_Daily_Checkin_-_Trip_Log_System/' : '/',
  plugins: [react()],
})
