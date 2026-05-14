import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Set base to './' for GitHub Pages compatibility
// Change to '/your-repo-name/' if deploying to a GitHub Pages project site
export default defineConfig({
  plugins: [react()],
  base: './',

  server: {
    allowedHosts: [
      'toya-chronometrical-scrawnily.ngrok-free.dev'
    ]
  },

  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
})