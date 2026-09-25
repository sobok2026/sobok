import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [tailwindcss(), react()],
  build: {
    target: 'es2022',
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'recipe-drinks',
              test: /data[\\/]recipes[\\/]drinks[\\/](?!(?:black-glazed-latte|hoji-glazed-tea-latte|pure-hojicha|pure-matcha|cold-brew)\.json)/,
            },
            {
              name: 'recipe-preparations',
              test: /data[\\/]recipes[\\/]preparations[\\/](?!(?:glazed-foam|mocha-sauce|hojicha-shot|matcha-shot|cold-brew-batch)\.json)/,
            },
            { name: 'react', test: /node_modules[\\/](?:react|react-dom|scheduler)[\\/]/ },
            // Capture the core first so the renderer's dependencies do not merge both Three.js modules.
            { name: 'three-core', test: /node_modules[\\/]three[\\/]build[\\/]three\.core\.js$/ },
            { name: 'three-renderer', test: /node_modules[\\/]three[\\/]build[\\/]three\.module\.js$/ },
          ],
        },
      },
    },
  },
})
