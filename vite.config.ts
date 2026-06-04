import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // GitHub Pages serves the site from /<repo-name>/, not the domain root,
  // so asset URLs need this prefix in production builds. Dev stays at /.
  base: process.env.GITHUB_ACTIONS ? '/ai-agent-playground/' : '/',
})
