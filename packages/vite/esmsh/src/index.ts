import type { Plugin } from 'vite'

export interface EsmshPluginOptions {
  /**
   * Base URL for esm.sh CDN
   * @default 'https://esm.sh'
   */
  baseUrl?: string
  /**
   * Package patterns to resolve from esm.sh
   * @default ['react', 'react-dom', '@react-three/*', '@types/*']
   */
  packages?: string[]
  /**
   * Whether to prefer ESM modules
   * @default true
   */
  esm?: boolean
}

export function esmshPlugin(options: EsmshPluginOptions = {}): Plugin {
  const { baseUrl = 'https://esm.sh' } = options

  const cache = new Map<string, string>()

  function resolveModulePath(packageName: string, subpath: string): string {
    // esm.sh automatically serves ESM versions, no need for complex package.json parsing
    let url = `${baseUrl}/${packageName}`

    if (subpath) {
      url += `/${subpath}`
    }

    return url
  }

  function transformDynamicImports(code: string): string {
    // Regex to match dynamic imports: import('package-name') or import("package-name")
    const dynamicImportRegex = /import\s*\(\s*(['"`])([^'"`]+)\1\s*\)/g

    return code.replace(dynamicImportRegex, (match, quote, importPath) => {
      // Skip if already has a protocol (http://, https://, or esm.sh)
      if (importPath.startsWith('http://') || importPath.startsWith('https://') || importPath.startsWith('/')) {
        return match
      }

      // Skip relative imports
      if (importPath.startsWith('./') || importPath.startsWith('../')) {
        return match
      }
      return `import(${quote}${baseUrl}/${importPath}${quote})`
    })
  }

  async function fetchEsmContent(url: string): Promise<string> {
    if (cache.has(url)) {
      return cache.get(url)!
    }

    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`)
      }
      const content = await response.text()
      // Transform dynamic imports in the fetched content
      const transformedContent = transformDynamicImports(content)
      cache.set(url, transformedContent)
      return transformedContent
    } catch (error) {
      throw new Error(`Failed to fetch from esm.sh: ${error}`)
    }
  }

  return {
    name: 'esmsh',

    async resolveId(id: string, importer?: string) {
      // Skip if it's already a resolved esm.sh URL
      if (id.startsWith(`${baseUrl}/`)) {
        return null
      }

      // Handle relative imports from esm.sh modules
      if ((id.startsWith('/') || id.startsWith('./') || id.startsWith('../')) && importer?.startsWith(`${baseUrl}/`)) {
        return new URL(id, importer).href
      }

      // Skip other relative imports
      if (id.startsWith('./') || id.startsWith('../')) {
        return null
      }

      // Skip node and vite built-ins
      if (id.startsWith('node:') || id.startsWith('\0') || ['fs', 'path', 'url', 'util'].includes(id)) {
        return null
      }

      // Parse package name and subpath correctly for scoped packages
      let packageName = id
      let subpath = ''

      if (id.startsWith('@')) {
        const parts = id.split('/')
        if (parts.length >= 2) {
          packageName = parts[0] + '/' + parts[1]
          subpath = parts.slice(2).join('/')
        }
      } else {
        const parts = id.split('/')
        packageName = parts[0]
        subpath = parts.slice(1).join('/')
      }

      const url = resolveModulePath(packageName, subpath)
      return url
    },

    async load(id: string) {
      if (id.startsWith(baseUrl)) {
        return await fetchEsmContent(id)
      }
      return null
    },
  }
}

export default esmshPlugin
