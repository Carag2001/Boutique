import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Si tu héberges sur GitHub Pages avec un repo nommé "crg-internal",
// décommente la ligne base ci-dessous et remplace par le nom de ton repo :
// base: '/crg-internal/',

export default defineConfig({
  plugins: [react()],
  // base: '/nom-de-ton-repo/',  // ← décommente pour GitHub Pages
})
