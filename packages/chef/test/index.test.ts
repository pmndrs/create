import { describe, it, expect } from 'vitest'
import { Recipe, buildProject, applyRecipeEdits, applyRecipeEditOperation, Json } from '../src/index.js'

describe('@pmndrs/create', () => {
  describe('buildProject', () => {
    it('should build project from single recipe', () => {
      const recipes: Recipe[] = [
        {
          name: 'simple-recipe',
          edits: {
            'index.js': 'console.log("Hello World")',
            'package.json': '{ "name": "test-project" }',
          },
        },
      ]

      const result = buildProject(recipes)

      expect(result).toEqual({
        'index.js': 'console.log("Hello World")',
        'package.json': '{ "name": "test-project" }',
      })
    })

    it('should build project from multiple recipes', () => {
      const recipes: Recipe[] = [
        {
          name: 'base-recipe',
          edits: {
            'index.js': 'console.log("Base")',
            'config.json': '{ "theme": "light" }',
          },
        },
        {
          name: 'feature-recipe',
          edits: {
            'feature.js': 'export const feature = true',
            'README.md': '# My Project',
          },
        },
      ]

      const result = buildProject(recipes)

      expect(result).toEqual({
        'index.js': 'console.log("Base")',
        'config.json': '{ "theme": "light" }',
        'feature.js': 'export const feature = true',
        'README.md': '# My Project',
      })
    })

    it('should handle empty recipes array', () => {
      const result = buildProject([])
      expect(result).toEqual({})
    })

    it('should handle recipes without edits', () => {
      const recipes: Recipe[] = [
        {
          name: 'empty-recipe',
          version: '1.0.0',
        },
      ]

      const result = buildProject(recipes)
      expect(result).toEqual({})
    })
  })

  describe('applyRecipeEdits', () => {
    it('should apply edits to files and variables', () => {
      const files: Record<string, string> = {}
      const variables: Record<string, Json> = {}
      const edits = {
        'index.js': 'console.log("test")',
        '@version': '1.0.0',
        'src/utils.js': 'export const util = () => {}',
      }

      applyRecipeEdits(files, variables, edits)

      // Note: applyRecipeEdits modifies files and variables in place
      expect(files).toEqual({
        'index.js': 'console.log("test")',
        'src/utils.js': 'export const util = () => {}',
      })
      expect(variables).toEqual({
        '@version': '1.0.0',
      })
    })

    it('should handle empty edits object', () => {
      const files: Record<string, string> = {}
      const variables: Record<string, Json> = {}
      const edits = {}

      expect(() => applyRecipeEdits(files, variables, edits)).not.toThrow()
    })
  })

  describe('applyRecipeEditOperation', () => {
    it('should handle string operations', () => {
      const files: Record<string, string> = {}
      const variables: Record<string, Json> = {}

      expect(() => applyRecipeEditOperation(files, variables, 'index.js', 'console.log("test")')).not.toThrow()
    })

    it('should handle RecipeEditOperation objects', () => {
      const files: Record<string, string> = {}
      const variables: Record<string, Json> = {}
      const operation = {
        set: 'test-value',
        description: 'Set test value',
      }

      expect(() => applyRecipeEditOperation(files, variables, '@testVar', operation)).not.toThrow()
    })

    it('should handle file paths with subpaths', () => {
      const files: Record<string, string> = {}
      const variables: Record<string, Json> = {}

      expect(() =>
        applyRecipeEditOperation(files, variables, 'package.json/dependencies/react', '"18.0.0"'),
      ).not.toThrow()
    })

    it('should handle variable paths', () => {
      const files: Record<string, string> = {}
      const variables: Record<string, Json> = {}

      expect(() => applyRecipeEditOperation(files, variables, '@messages', { set: "['Hello']" })).not.toThrow()
    })
  })

  describe('Integration tests', () => {
    it('should handle complex recipe with variables and file operations', () => {
      const recipe: Recipe = {
        name: 'complex-recipe',
        version: '1.0.0',
        edits: {
          'index.js': 'console.log(...{{ @messages }})',
          '@messages': { set: ["'Hello'", "'World'"] },
          'package.json': '{"name": "my-project", "dependencies": {{ @deps }}}',
          '@deps': { set: { vite: '"latest"', react: '"^18.0.0"' } },
          'src/component.tsx': 'const Component = () => <div>Hello</div>',
        },
      }

      const result = buildProject([recipe])

      expect(result).toEqual({
        'index.js': "console.log(...['Hello', 'World'])",
        'package.json': '{"name": "my-project", "dependencies": { "vite": "latest", "react": "^18.0.0" }}',
        'src/component.tsx': 'const Component = () => <div>Hello</div>',
      })
    })

    it('should handle recipe requirements resolution with value modification', () => {
      const baseRecipe: Recipe = {
        name: 'base-config',
        version: '1.0.0',
        edits: {
          'package.json': '{"name": "base-project", "dependencies": {{ @deps }}}',
          '@deps': {
            set: '{ "react": "^18.0.0" }',
          },
        },
      }

      const extendedRecipe: Recipe = {
        name: 'extended-config',
        requirements: {
          'base-config': '^1.0.0',
        },
        edits: {
          // Modify the config variable from base recipe
          '@configFeatures': { set: ['"basic"', '"advanced"', '"premium"'] },
          '@configTheme': '"dark"',
          // Add more dependencies to the existing deps
          '@deps/react-router': '"^6.0.0"',
          '@deps/styled-components': '"^5.0.0"',
          // Add new files that use the modified variables
          'theme.js': 'export const theme = {{ @configTheme }}',
          'features.js': 'export const features = {{ @configFeatures }}',
        },
      }

      const resolveRequirements = (name: string, versionQuery: string): Recipe => {
        if (name === 'base-config') {
          return baseRecipe
        }
        throw new Error(`Unknown requirement: ${name}`)
      }

      const result = buildProject([extendedRecipe], resolveRequirements)

      expect(result).toEqual({
        'package.json':
          '{"name": "base-project", "dependencies": { "react": "^18.0.0", "react-router": "^6.0.0", "styled-components": "^5.0.0" }}',
        'theme.js': 'export const theme = "dark"',
        'features.js': 'export const features = ["basic", "advanced", "premium"]',
      })
    })
  })
})

describe('Error handling', () => {
  it('should not throw error for missing variables', () => {
    const recipe: Recipe = {
      edits: {
        'index.js': 'console.log({{ @missingVariable }})',
      },
    }

    expect(buildProject([recipe])).to.deep.equal({ 'index.js': 'console.log()' })
  })

  it('should throw error for circular variable referencing', () => {
    const recipe: Recipe = {
      name: 'circular-vars-recipe',
      edits: {
        '@varA': 'Value A depends on {{ @varB }}',
        '@varB': 'Value B depends on {{ @varC }}',
        '@varC': 'Value C depends on {{ @varA }}',
      },
    }

    expect(() => buildProject([recipe])).toThrow('Circular dependency detected for: @varA, @varB, @varC')
  })

  it('should throw error for self-referencing variable', () => {
    const recipe: Recipe = {
      name: 'self-ref-recipe',
      edits: {
        '@selfRef': 'I reference myself: {{ @selfRef }}',
      },
    }

    expect(() => buildProject([recipe])).toThrow('Circular dependency detected for: @selfRef')
  })

  it('should throw error when pushing to undefined variable', () => {
    const recipe: Recipe = {
      name: 'push-undefined-recipe',
      edits: {
        'test.json': '{{@undefinedVar}}',
        '@undefinedVar': { push: 'item' },
      },
    }

    expect(buildProject([recipe])).to.deep.equal({
      'test.json': '[item]',
    })
  })

  it('should throw error when pushing to non-array variable', () => {
    const recipes: Recipe[] = [
      {
        name: 'setup-string-var',
        edits: {
          '@stringVar': 'I am a string',
        },
      },
      {
        name: 'push-to-string-var',
        edits: {
          '@stringVar': { push: 'item' },
        },
      },
    ]

    expect(() => buildProject(recipes)).toThrow('Cannot push to non-array value "I am a string" at path "@stringVar"')
  })

  it('should throw error when pushing to object variable', () => {
    const recipes: Recipe[] = [
      {
        name: 'setup-object-var',
        edits: {
          '@objectVar': { set: { key: 'value' } },
        },
      },
      {
        name: 'push-to-object-var',
        edits: {
          '@objectVar': { push: 'item' },
        },
      },
    ]

    expect(() => buildProject(recipes)).toThrow('Cannot push to non-array value {"key":"value"} at path "@objectVar"')
  })

  it('should throw error when pushAll to non-array variable', () => {
    const recipes: Recipe[] = [
      {
        name: 'setup-number-var',
        edits: {
          '@numberVar': { set: 42 },
        },
      },
      {
        name: 'pushall-to-number-var',
        edits: {
          '@numberVar': { pushAll: ['item1', 'item2'] },
        },
      },
    ]

    expect(() => buildProject(recipes)).toThrow('Cannot pushAll to non-array value "42" at path "@numberVar"')
  })

  it('should throw writing to subpaths of non-object variables', () => {
    const recipe: Recipe = {
      name: 'subpath-non-object-recipe',
      edits: {
        '@stringVar': 'I am a string',
        '@stringVar/nested/path': 'This should not work',
      },
    }

    expect(() => buildProject([recipe])).toThrow(
      'unable to access path "@stringVar/nested/path". Found non-object value "I am a string".',
    )
  })

  it('should handle writing to subpaths of undefined variables', () => {
    const recipe: Recipe = {
      name: 'subpath-null-recipe',
      edits: {
        'test.json': '{{ @undefinedVar }}',
        '@undefinedVar/nested': 123,
      },
    }

    const result = buildProject([recipe])
    expect(result).toEqual({
      'test.json': '{ "nested": 123 }',
    })
  })

  it('should handle writing to subpaths of array variables', () => {
    const recipe: Recipe = {
      name: 'subpath-array-recipe',
      edits: {
        'test.json': ['item1', 'item2'],
        'test.json/0': 'newItem',
      },
    }

    const result = buildProject([recipe])
    expect(result).toEqual({
      'test.json': `[newItem, item2]`,
    })
  })

  it('should handle accessing nested values from undefined file paths', () => {
    const recipe: Recipe = {
      name: 'nested-undefined-file-recipe',
      edits: {
        'package.json/dependencies/react': '"18.0.0"',
      },
    }

    const result = buildProject([recipe])
    expect(result).toEqual({
      'package.json': '{ "dependencies": { "react": "18.0.0" } }',
    })
  })

  it('should handle complex circular dependency chains', () => {
    const recipe: Recipe = {
      name: 'complex-circular-recipe',
      edits: {
        '@a': '{{ @b }} and {{ @c }}',
        '@b': '{{ @d }}',
        '@c': '{{ @e }}',
        '@d': '{{ @e }}',
        '@e': '{{ @a }}',
      },
    }

    expect(() => buildProject([recipe])).toThrow('Circular dependency detected for: @a, @b, @c, @d, @e')
  })

  it('should handle requirement resolution errors', () => {
    const recipe: Recipe = {
      name: 'recipe-with-requirements',
      requirements: {
        'missing-recipe': '^1.0.0',
      },
      edits: {
        'index.js': 'console.log("test")',
      },
    }

    expect(() => buildProject([recipe])).toThrow(
      'Recipe "missing-recipe" requires a resolveRequirements function to resolve dependencies',
    )
  })

  it('should handle failed requirement resolution', () => {
    const recipe: Recipe = {
      name: 'recipe-with-bad-requirements',
      requirements: {
        'unknown-recipe': '^1.0.0',
      },
      edits: {
        'index.js': 'console.log("test")',
      },
    }

    const resolveRequirements = (name: string, versionQuery: string): Recipe => {
      throw new Error(`Recipe not found: ${name}`)
    }

    expect(() => buildProject([recipe], resolveRequirements)).toThrow('Recipe not found: unknown-recipe')
  })

  it('should handle variable references in nested object structures', () => {
    const recipe: Recipe = {
      name: 'nested-var-ref-recipe',
      edits: {
        '@config': {
          set: {
            database: {
              host: '{{ @dbHost }}',
              port: '{{ @dbPort }}',
            },
          },
        },
        '@dbHost': '"localhost"',
        // Missing @dbPort variable
        'config.js': 'export default {{ @config }}',
      },
    }

    expect(buildProject([recipe])).to.deep.equal({
      'config.js': 'export default { "database": { "host": "localhost", "port":  } }',
    })
  })

  it('should handle multiple variable references in same string', () => {
    const recipe: Recipe = {
      name: 'multi-var-ref-recipe',
      edits: {
        '@host': 'localhost',
        '@port': { set: 3000 },
        'config.js': 'const url = "http://{{ @host }}:{{ @port }}/{{ @missing }}"',
      },
    }

    expect(buildProject([recipe])).to.deep.equal({
      'config.js': 'const url = "http://localhost:3000/"',
    })
  })

  it('should execute recipes and recipe edits in correct order', () => {
    const recipes: Recipe[] = [
      {
        name: 'first-recipe',
        edits: {
          'log.txt': 'Step {{ @counter }}: First recipe\n',
          '@counter': { set: 2 },
        },
      },
      {
        name: 'second-recipe',
        edits: {
          '@counter': { set: { x: 0 } },
          '@counter/x': 1,
          'log.txt': 'Step {{ @counter }}: Second recipe continued\n',
        },
      },
      {
        name: 'third-recipe',
        edits: {
          '@counter/y': 2,
          'log.txt': 'Step {{ @counter }}: Third recipe\n',
        },
      },
    ]

    const result = buildProject(recipes)

    expect(result).toEqual({
      'log.txt': 'Step { "x": 1, "y": 2 }: Third recipe\n',
    })
  })
})
