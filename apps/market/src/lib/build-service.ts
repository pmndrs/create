import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { prisma } from '@/lib/prisma'
import { build } from 'vite'
import react from '@vitejs/plugin-react'
import { Recipe, resolveRequirements } from '@pmndrs/chef'
import { chefPlugin } from '@pmndrs/vite-chef'
import { esmshPlugin } from '@pmndrs/vite-esmsh'
import { Volume } from 'memfs'
import path from 'path'
import Dirent from 'memfs/lib/node/Dirent'
import puppeteer from 'puppeteer'
import { setTimeout } from 'timers/promises'

// Initialize S3 client - configure with your S3-compatible service
const s3Client = new S3Client({
  endpoint: process.env.S3_ENDPOINT, // For S3-compatible services like MinIO, Cloudflare R2, etc.
  region: process.env.S3_REGION,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
  },
})

export interface BuildResult {
  success: boolean
  outputUrl?: string
  error?: string
  log: string
}

export class BuildService {
  static async buildRecipeVersion(recipe: Recipe) {
    if (recipe.name == null || recipe.version == null) {
      throw new Error('')
    }

    const memfs = Volume.fromJSON({}, '/')
    // Write recipe.json to memory for the chef plugin
    memfs.writeFileSync('/recipe.json', JSON.stringify(recipe))

    const cwd = process.cwd()
    process.chdir('/')

    // Build using Vite with Chef and ESMSH plugins
    await build({
      plugins: [
        react(),
        await chefPlugin({
          recipe: '/recipe.json',
          resolve: resolveRequirements,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          fs: memfs.promises as any,
          baseDir: '/',
        }),
        esmshPlugin({
          packages: ['react', 'react-dom', '@react-three/*', 'three', '@types/*'],
        }),
      ],
      resolve: { dedupe: ['three'] },
      build: {
        outDir: '/dist/',
        rollupOptions: {
          // Use memfs for file operations
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          fs: memfs.promises as any,
          input: 'index.html',
          output: {
            dir: '/dist/',
          },
        },
      },
      base: './',
      root: '/',
      configFile: false,
      logLevel: 'info',
    })

    process.chdir(cwd)

    // Read built files from memfs
    const distFiles = memfs.readdirSync('/dist', { recursive: true, withFileTypes: true })

    // Upload build output to S3
    const baseUrl = `${recipe.name}/${recipe.version}/`

    // Upload each file to S3
    for (const file of distFiles) {
      if (file instanceof Dirent && !file.isDirectory()) {
        const filePath = path.join(file.path + '/', file.name.toString())
        const relativePath = path.relative('/dist', filePath)
        const fileContent = memfs.readFileSync(filePath)
        const contentType = getContentType(file.name.toString())

        await s3Client.send(
          new PutObjectCommand({
            Bucket: process.env.S3_EXAMPLE_BUILD_BUCKET,
            Key: `${baseUrl}${relativePath}`,
            Body: fileContent,
            ContentType: contentType,
          }),
        )
      }
    }

    const thumbnailUrl = `https://pub-54e2a7dbf936490fae36efbdea022cba.r2.dev/${recipe.name}/${recipe.version}/index.html`

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })
    const page = await browser.newPage()
    await page.setViewport({ width: 1280, height: 720 })

    await page.goto(thumbnailUrl, {
      waitUntil: 'networkidle0',
    })
    // Wait a bit for any 3D content to load
    await setTimeout(1000)

    const screenshot = await page.screenshot({
      type: 'webp',
      quality: 80,
    })

    // Upload thumbnail to S3
    await s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.S3_EXAMPLE_THUMBNAIL_BUCKET!,
        Key: `${recipe.name}/${recipe.version}/thumbnail.webp`,
        Body: screenshot,
        ContentType: 'image/webp'
      }),
    )
  }
}

function getContentType(filename: string): string {
  const ext = path.extname(filename).toLowerCase()
  switch (ext) {
    case '.html':
      return 'text/html'
    case '.js':
      return 'application/javascript'
    case '.css':
      return 'text/css'
    case '.json':
      return 'application/json'
    case '.png':
      return 'image/png'
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg'
    case '.svg':
      return 'image/svg+xml'
    case '.woff':
      return 'font/woff'
    case '.woff2':
      return 'font/woff2'
    default:
      return 'application/octet-stream'
  }
}
