import type { Plugin, ResolvedConfig } from 'vite'
import { readFileSync, existsSync } from 'fs'
import { resolve, dirname, join } from 'path'
import * as chef from '@pmndrs/chef'
import type { Recipe } from '@pmndrs/chef'

const { buildProject } = chef

export type ResolveFunction = (name: string, versionQuery: string) => Recipe

export interface ChefPluginOptions {
  /**
   * Path to the main recipe file
   * @default 'recipe.json'
   */
  recipe?: string
  /**
   * Base directory for resolving recipe paths
   * @default process.cwd()
   */
  baseDir?: string
  /**
   * Whether to enable hot module replacement for recipe changes
   * @default true
   */
  hmr?: boolean
  /**
   * Custom resolve function for recipe dependencies
   * If not provided, will try to resolve from filesystem
   */
  resolve?: ResolveFunction
}

export async function chefPlugin(options: ChefPluginOptions = {}): Promise<Plugin> {
  const { recipe = 'recipe.json', baseDir = process.cwd(), hmr = true, resolve: customResolve } = options

  let config: ResolvedConfig

  // Resolve the main recipe path
  const recipePath = resolve(baseDir, recipe)

  function loadRecipe(recipePath: string): Recipe {
    if (!existsSync(recipePath)) {
      throw new Error(`Recipe file not found: ${recipePath}`)
    }

    const content = readFileSync(recipePath, 'utf-8')
    return JSON.parse(content)
  }

  function resolveRequirements(name: string, versionQuery: string): Recipe {
    // Use custom resolve function if provided
    if (customResolve) {
      return customResolve(name, versionQuery)
    }

    // Fallback to filesystem resolution
    const recipeDir = dirname(recipePath)
    const candidatePaths = [
      join(recipeDir, `${name}.json`),
      join(recipeDir, `${name}.recipe.json`),
      join(recipeDir, 'recipes', `${name}.json`),
      join(recipeDir, 'recipes', `${name}.recipe.json`),
    ]

    for (const candidatePath of candidatePaths) {
      if (existsSync(candidatePath)) {
        return loadRecipe(candidatePath)
      }
    }

    throw new Error(`Could not resolve recipe: ${name}`)
  }

  function getDependencies(recipePath: string): string[] {
    const dependencies = [recipePath]
    const visited = new Set<string>()

    function collectDeps(path: string) {
      if (visited.has(path)) return
      visited.add(path)

      try {
        const recipe = loadRecipe(path)
        if (recipe.requirements) {
          const recipeDir = dirname(path)
          for (const [name] of Object.entries(recipe.requirements)) {
            // Skip dependency tracking if using custom resolve function
            if (customResolve) continue

            const candidatePaths = [
              join(recipeDir, `${name}.json`),
              join(recipeDir, `${name}.recipe.json`),
              join(recipeDir, 'recipes', `${name}.json`),
              join(recipeDir, 'recipes', `${name}.recipe.json`),
            ]

            for (const candidatePath of candidatePaths) {
              if (existsSync(candidatePath)) {
                dependencies.push(candidatePath)
                collectDeps(candidatePath)
                break
              }
            }
          }
        }
      } catch (error) {
        // Ignore errors for dependency collection
      }
    }

    collectDeps(recipePath)
    return dependencies
  }

  // Build the project using chef
  let files!: Record<string, Uint8Array<ArrayBufferLike>>

  return {
    name: 'chef',
    configResolved(resolvedConfig) {
      config = resolvedConfig
    },

    async buildStart() {
      const mainRecipe = loadRecipe(recipePath)
      const dependencies = getDependencies(recipePath)
      const timestamp = Date.now()
      files = await buildProject([mainRecipe], resolveRequirements)
    },

    resolveId(id: string, importer?: string) {
      // Handle relative imports from chef-generated files
      if (id.startsWith('./') && importer) {
        const importerDir = importer.split('/').slice(0, -1).join('/')
        let resolvedPath = importerDir ? `${importerDir}/${id.slice(2)}` : id.slice(2)

        // Try with different extensions
        const extensions = ['', '.tsx', '.ts', '.jsx', '.js']
        for (const ext of extensions) {
          const tryPath = resolvedPath + ext
          if (tryPath in files) {
            return tryPath
          }
        }

        // Try without .js extension and with .tsx
        if (resolvedPath.endsWith('.js')) {
          const withoutJs = resolvedPath.slice(0, -3)
          for (const ext of ['.tsx', '.ts', '.jsx']) {
            const tryPath = withoutJs + ext
            if (tryPath in files) {
              return tryPath
            }
          }
        }
      }

      // Normalize the id by removing leading ./
      let normalizedId = id.startsWith('./') ? id.slice(2) : id

      if (normalizedId in files) {
        return normalizedId
      }

      if (id in files) {
        return id
      }

      // Check for absolute paths that might match generated files
      const rootPath = config?.root || process.cwd()
      const relativePath = id.replace(rootPath + '/', '')
      if (relativePath in files) {
        return relativePath
      }

      return null
    },

    load(id: string) {
      if (id in files) {
        const content = files[id]
        return new TextDecoder().decode(content)
      }

      return null
    },
  }
}

export default chefPlugin
