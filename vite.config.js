import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Get repository name from environment variable (set by GitHub Actions)
// For GitHub Pages project sites, we need to set the base to the repo name
const repoName = process.env.GITHUB_REPOSITORY?.split('/')[1] || ''
const base = repoName ? `/${repoName}/` : '/'

export default defineConfig({
  plugins: [react()],
  base: base,
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  }
})

