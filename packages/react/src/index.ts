import * as chef from '@pmndrs/chef'
const { buildProject } = chef
import type { Recipe } from '@pmndrs/chef'

// Import all recipe files directly
import baseRecipe from './base.recipe.json' assert { type: 'json' }
import dreiRecipe from './libraries/drei.recipe.json' assert { type: 'json' }
import handleRecipe from './libraries/handle.recipe.json' assert { type: 'json' }
import kootaRecipe from './libraries/koota.recipe.json' assert { type: 'json' }
import levaRecipe from './libraries/leva.recipe.json' assert { type: 'json' }
import offscreenRecipe from './libraries/offscreen.recipe.json' assert { type: 'json' }
import postprocessingRecipe from './libraries/postprocessing.recipe.json' assert { type: 'json' }
import rapierRecipe from './libraries/rapier.recipe.json' assert { type: 'json' }
import uikitRecipe from './libraries/uikit.recipe.json' assert { type: 'json' }
import xrRecipe from './libraries/xr.recipe.json' assert { type: 'json' }
import zustandRecipe from './libraries/zustand.recipe.json' assert { type: 'json' }
import githubPagesRecipe from './hosting/github-pages.recipe.json' assert { type: 'json' }
import viverseRecipe from './hosting/viverse.recipe.json' assert { type: 'json' }
import triplexRecipe from './extensions/triplex.recipe.json' assert { type: 'json' }
import spinningBoxesRecipe from './examples/spinning-boxes.recipe.json' assert { type: 'json' }

export * from './utils.js'

export type GenerateOptions = {
  githubUserName?: string
  githubRepoName?: string
  name: string
  handle?: boolean
  drei?: boolean
  koota?: boolean
  leva?: boolean
  offscreen?: boolean
  postprocessing?: boolean
  rapier?: boolean
  triplex?: boolean
  viverse?: boolean
  uikit?: boolean
  xr?: boolean
  zustand?: boolean
  githubPages?: boolean
  packageManager?: string
}

// Recipe map for easy lookup
const recipes: Record<string, Recipe> = {
  base: baseRecipe as Recipe,
  drei: dreiRecipe as Recipe,
  handle: handleRecipe as Recipe,
  koota: kootaRecipe as Recipe,
  leva: levaRecipe as Recipe,
  offscreen: offscreenRecipe as Recipe,
  postprocessing: postprocessingRecipe as Recipe,
  rapier: rapierRecipe as Recipe,
  uikit: uikitRecipe as Recipe,
  xr: xrRecipe as Recipe,
  zustand: zustandRecipe as Recipe,
  'github-pages': githubPagesRecipe as Recipe,
  viverse: viverseRecipe as Recipe,
  triplex: triplexRecipe as Recipe,
  'spinning-boxes': spinningBoxesRecipe as Recipe,
}

export async function loadRecipe(name: string): Promise<Recipe> {
  const recipe = recipes[name]
  if (!recipe) {
    throw new Error(`Recipe "${name}" not found`)
  }
  return recipe
}

export function generate(options: GenerateOptions) {
  // Create the main recipe that declares its requirements based on options
  const mainRecipe: Recipe = {
    name: 'main',
    version: '0.0.0',
    requirements: {
      base: '0.0.0',
      ...(options.drei && { drei: '0.0.0' }),
      ...(options.handle && { handle: '0.0.0' }),
      ...(options.koota && { koota: '0.0.0' }),
      ...(options.leva && { leva: '0.0.0' }),
      ...(options.offscreen && { offscreen: '0.0.0' }),
      ...(options.postprocessing && { postprocessing: '0.0.0' }),
      ...(options.rapier && { rapier: '0.0.0' }),
      ...(options.triplex && { triplex: '0.0.0' }),
      ...(options.viverse && { viverse: '0.0.0' }),
      ...(options.uikit && { uikit: '0.0.0' }),
      ...(options.xr && { xr: '0.0.0' }),
      ...(options.zustand && { zustand: '0.0.0' }),
      ...(options.githubPages && { 'github-pages': '0.0.0' }),
    },
    edits: {
      '@projectName': options.name || 'react-three-app',
      '@packageManager': options.packageManager || 'npm',
    },
  }

  // Use chef's buildProject to process all recipes
  return buildProject([mainRecipe], loadRecipe)
}
