import { build } from 'vite'
import react from '@vitejs/plugin-react'
import { chefPlugin } from '@pmndrs/vite-chef'
import { esmshPlugin } from '@pmndrs/vite-esmsh'
import { loadRecipe } from '@react-three/create'
import { Volume } from 'memfs'

const fs = Volume.fromJSON({}, "/")
fs.writeFileSync(
  '/recipe.json',
  JSON.stringify({
    name: 'example-app',
    version: '1.0.0',
    requirements: {
      base: '0.0.0',
      drei: '0.0.0',
      xr: '0.0.0',
      'spinning-boxes': '0.0.0',
    },
    edits: {
      '@projectName': 'vite-plugin-example',
      '@packageManager': 'npm',
    },
  }),
)

async function runBuild() {
  await build({
    plugins: [
      react(),
      await chefPlugin({
        fs: fs.promises as any,
        recipe: 'recipe.json',
        resolve: loadRecipe,
        baseDir: '/',
      }),
      esmshPlugin({
        packages: ['react', 'react-dom', '@react-three/*'],
      }),
    ],
    build: {
      outDir: '/dist',
      rollupOptions: {
        fs: fs.promises as any,
        input: 'index.html',
      },
    },
  })
  console.log(fs.readdirSync('/dist', { recursive: true, withFileTypes: true }))
}

runBuild().catch(console.error)
