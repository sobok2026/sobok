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
            { name: 'shop-data', test: /data[\\/]shop[\\/]/ },
            {
              name: 'recipe-drinks',
              test: /data[\\/]recipes[\\/]drinks[\\/]/,
            },
            {
              name: 'recipe-preparations',
              test: /data[\\/]recipes[\\/]preparations[\\/]/,
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
