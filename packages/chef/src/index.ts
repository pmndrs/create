import * as semver from 'semver'

export type Json = string | boolean | null | number | Array<Json> | { [Key in string]: Json }

export class VariableResolutionError extends Error {
  constructor(variableName: string) {
    super(`Variable "${variableName}" not found or not yet resolved`)
    this.name = 'VariableResolutionError'
  }
}

export type Recipe = {
  name?: string
  /**
   * @default "0.0.0"
   */
  version?: string
  /**
   * Allows referencing other recipes through a semver string e.g.
   * ```json
   * { "vite-recipe": "0.0.0" }
   * ```
   * which declares the vite-recipe to be a requirement for this recipe.
   * NOT to be confused with package.json dependencies!
   */
  requirements?: Record<string, string>
  /**
   * List of edits.
   * Keys are either files or variables with optional subpaths into those files and variables,
   * possible only if those files and variables are JSONs e.g.
   * ```json
   * {
   *   // write file and define variable
   *   "index.js": "console.log(...{{@messages}})",
   *   // write variable
   *   "@messages": [],
   *   // modify variable
   *   "@messages": {
   *     "push": "Hello"
   *   },
   *   // modify variable with code
   *   "@messages": {
   *     "pushRaw": "'Wo' + 'rld'"
   *   },
   *   // modify file
   *   "package.json/dependencies/vite": "latest"
   * }
   * ```
   */
  edits?: Record<string, RecipeEditOperation>
}

export type RecipeEditOperation =
  | string
  | { set?: Json; push?: Json; pushAll?: Array<Json>; append?: string; prepend?: string; description?: string }

export function buildProject(
  recipes: Array<Recipe>,
  resolveRequirements?: (name: string, versionQuery: string) => Recipe,
): Record<string, string> {
  const resolvedRecipes: Array<Recipe> = []
  const addRecipe = (recipe: Recipe): number => {
    const insertLocation =
      Math.max(
        -1,
        ...Object.entries(recipe.requirements ?? {}).map(([name, versionQuery]) => {
          const index = resolvedRecipes.findIndex(
            (recipe) => recipe.name === name && semver.satisfies(recipe.version ?? '0.0.0', versionQuery),
          )
          if (index != -1) {
            return index
          }
          if (resolveRequirements == null) {
            throw new Error(`Recipe "${name}" requires a resolveRequirements function to resolve dependencies`)
          }
          return addRecipe(resolveRequirements(name, versionQuery))
        }),
      ) + 1
    resolvedRecipes.splice(insertLocation, 0, recipe)
    return insertLocation
  }
  recipes.forEach(addRecipe)
  const files: Record<string, Json> = {}
  const variables: Record<string, Json> = {}
  for (const recipe of resolvedRecipes) {
    if (recipe.edits == null) {
      continue
    }
    applyRecipeEdits(files, variables, recipe.edits)
  }
  const resolvedVariables: Record<string, Json> = {}

  // Resolve all variables: replace variable references with their values
  const variableQueue = Object.keys(variables)
  const resolvedVariableNames = new Set<string>()

  while (variableQueue.length > 0) {
    let madeProgress = false

    for (let i = variableQueue.length - 1; i >= 0; i--) {
      const variableName = variableQueue[i]!
      const variableValue = variables[variableName]!

      try {
        const resolved = resolveVariableReferences(variableValue, resolvedVariables)
        resolvedVariables[variableName] = resolved
        resolvedVariableNames.add(variableName)
        variableQueue.splice(i, 1)
        madeProgress = true
      } catch (error) {
        if (error instanceof VariableResolutionError) {
          // Variable has unresolved dependencies, continue to next iteration
        } else {
          throw error
        }
      }
    }

    if (!madeProgress && variableQueue.length > 0) {
      throw new Error(`Circular dependency or missing variables detected for: ${variableQueue.join(', ')}`)
    }
  }

  // Convert files from Record<string, Json> to Record<string, string> and return them
  const result: Record<string, string> = {}
  for (const [fileName, fileValue] of Object.entries(files)) {
    result[fileName] = jsonToOutputString(resolveVariableReferences(fileValue, resolvedVariables))
  }
  return result
}

export function applyRecipeEdits(
  files: Record<string, Json>,
  variables: Record<string, Json>,
  edits: Exclude<Recipe['edits'], undefined>,
): void {
  if (edits == null) {
    return
  }
  for (const [path, operation] of Object.entries(edits)) {
    applyRecipeEditOperation(files, variables, path, operation)
  }
}

export function applyRecipeEditOperation(
  files: Record<string, Json>,
  variables: Record<string, Json>,
  path: string,
  operation: string | RecipeEditOperation,
): void {
  if (typeof operation === 'string') {
    operation = {
      set: operation,
    }
  }
  if (operation.set != null) {
    setAtPath(files, variables, path, inputJsonToJson(operation.set))
    if (Object.keys(operation).length === 1) {
      return
    }
  }
  let current = getAtPath(files, variables, path)
  if (current === undefined) {
    throw new Error(`unkown value at path "${path}"`)
  }
  if (operation.append != null) {
    if (typeof current != 'string') {
      current = jsonToOutputString(current)
    }
    setAtPath(files, variables, path, `${current}${operation.append}`)
  }
  if (operation.prepend != null) {
    if (typeof current != 'string') {
      current = jsonToOutputString(current)
    }
    setAtPath(files, variables, path, `${operation.prepend}${current}`)
  }
  if (operation.push != null) {
    if (!Array.isArray(current)) {
      throw new Error(`Cannot push to non-array value at path "${path}"`)
    }
    setAtPath(files, variables, path, [...current, inputJsonToJson(operation.push)])
  }
  if (operation.pushAll != null) {
    if (!Array.isArray(current)) {
      throw new Error(`Cannot pushAll to non-array value at path "${path}"`)
    }
    setAtPath(files, variables, path, [...current, ...operation.pushAll.map(inputJsonToJson)])
  }
}

function setAtPath(files: Record<string, Json>, variables: Record<string, Json>, path: string, value: Json) {
  const { isFile, name, valuePath } = parsePath(path)
  let object: any = isFile ? files : variables
  let key = name
  for (const valuePathPart of valuePath) {
    if (object[key] == null) {
      object[key] = isNaN(parseInt(key)) ? {} : []
    }
    if (Array.isArray(object[key]) && isNaN(parseInt(key))) {
      throw new Error(`unable to write to array with key "${key}" (full path "${path}")`)
    }
    object = object[key]
    key = valuePathPart
  }
  object[key] = value
}

function getAtPath(files: Record<string, Json>, variables: Record<string, Json>, path: string): Json | undefined {
  const { isFile, name, valuePath } = parsePath(path)
  let value = isFile ? files[name] : variables[name]
  for (const valuePathPart of valuePath) {
    if (value == null) {
      return undefined
    }
    if (typeof value !== 'object') {
      return undefined
    }
    value = value[valuePathPart as never]
  }
  return value
}

function parsePath(path: string): { isFile: boolean; name: string; valuePath: Array<string> } {
  const isFile = !path.startsWith('@')
  let searchStartIndex: number | undefined
  if (isFile) {
    searchStartIndex = path.indexOf('.')
    if (searchStartIndex === -1) {
      throw new Error(`files must include a "." for the file extension`)
    }
  }
  let endOfNameIndex = path.indexOf('/', searchStartIndex)
  if (endOfNameIndex === -1) {
    endOfNameIndex = path.length
  }
  return {
    isFile,
    name: path.slice(0, endOfNameIndex),
    valuePath: path
      .slice(endOfNameIndex + 1)
      .split('/')
      .filter((part) => part.length > 0),
  }
}

function resolveVariableReferences(value: Json, resolvedVariables: Record<string, Json>): Json {
  if (typeof value === 'string') {
    // Replace variable references like {{ @variableName }} with their resolved values
    return value.replace(/\{\{\s*(@[^}]+)\s*\}\}/g, (match, variableName) => {
      const trimmedVarName = variableName.trim()
      if (!(trimmedVarName in resolvedVariables)) {
        throw new VariableResolutionError(trimmedVarName)
      }
      const resolvedValue = resolvedVariables[trimmedVarName]!
      return jsonToOutputString(resolvedValue)
    })
  }

  if (Array.isArray(value)) {
    return value.map((item) => resolveVariableReferences(item, resolvedVariables))
  }

  if (value !== null && typeof value === 'object') {
    const resolved: Record<string, Json> = {}
    for (const [key, val] of Object.entries(value)) {
      resolved[key] = resolveVariableReferences(val, resolvedVariables)
    }
    return resolved
  }

  return value
}

function inputJsonToJson(input: Json): Json {
  if (typeof input != 'string') {
    return input
  }
  try {
    return JSON.parse(input, (_, value) => (typeof value === 'string' ? JSON.stringify(value) : value))
  } catch {
    return input
  }
}

function jsonToOutputString(json: Json): string {
  if (json === null) {
    return 'null'
  }
  if (Array.isArray(json)) {
    return `[${json.map(jsonToOutputString).join(', ')}]`
  }
  switch (typeof json) {
    case 'boolean':
    case 'number':
    case 'string':
      return json.toString()
    case 'object':
      return `{ ${Object.entries(json)
        .map(([key, value]) => `"${key}": ${jsonToOutputString(value)}`)
        .join(', ')} }`
  }
}
