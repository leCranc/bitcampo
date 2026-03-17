import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/bitcampo/', // nombre del repositorio
  plugins: [react()],
})
