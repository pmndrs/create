import { build } from 'vite'
import react from '@vitejs/plugin-react'
import { chefPlugin } from '@pmndrs/vite-chef'
import { esmshPlugin } from '@pmndrs/vite-esmsh'
import { loadRecipe } from '@react-three/create'

async function runBuild() {
  await build({
    plugins: [
      react(),
      await chefPlugin({
        recipe: 'recipe.json',
        resolve: loadRecipe,
      }),
      esmshPlugin({
        packages: ['react', 'react-dom', '@react-three/*'],
      }),
    ],
    build: {
      outDir: 'dist',
      rollupOptions: {
        input: 'index.html',
      },
    },
  })
}

runBuild().catch(console.error)
