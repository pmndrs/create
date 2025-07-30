import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Recipe, buildProject, applyRecipeEdits, applyRecipeEditOperation, Json, ChefOptions } from '../src/index.js'

// Helper function to decode Uint8Array results to strings for testing
function decodeResult(result: Record<string, Uint8Array>): Record<string, string> {
  const decoded: Record<string, string> = {}
  for (const [key, value] of Object.entries(result)) {
    decoded[key] = new TextDecoder().decode(value)
  }
  return decoded
}

describe('@pmndrs/create', () => {
  describe('buildProject', () => {
    it('should build project from single recipe', async () => {
      const recipes: Recipe[] = [
        {
          name: 'simple-recipe',
          edits: {
            'index.js': 'console.log("Hello World")',
            'package.json': '{ "name": "test-project" }',
          },
        },
      ]

      const result = await buildProject(recipes)

      expect(decodeResult(result)).toEqual({
        'index.js': 'console.log("Hello World")',
        'package.json': '{ "name": "test-project" }',
      })
    })

    it('should build project from multiple recipes', async () => {
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

      const result = await buildProject(recipes)

      expect(decodeResult(result)).toEqual({
        'index.js': 'console.log("Base")',
        'config.json': '{ "theme": "light" }',
        'feature.js': 'export const feature = true',
        'README.md': '# My Project',
      })
    })

    it('should handle empty recipes array', async () => {
      const result = await buildProject([])
      expect(decodeResult(result)).toEqual({})
    })

    it('should handle recipes without edits', async () => {
      const recipes: Recipe[] = [
        {
          name: 'empty-recipe',
          version: '1.0.0',
        },
      ]

      const result = await buildProject(recipes)
      expect(decodeResult(result)).toEqual({})
    })
  })

  describe('applyRecipeEdits', () => {
    it('should apply edits to files and variables', async () => {
      const files: Record<string, string> = {}
      const variables: Record<string, Json> = {}
      const edits = {
        'index.js': 'console.log("test")',
        '@version': '1.0.0',
        'src/utils.js': 'export const util = () => {}',
      }

      await applyRecipeEdits(files, variables, edits)

      // Note: applyRecipeEdits modifies files and variables in place
      expect(files).toEqual({
        'index.js': 'console.log("test")',
        'src/utils.js': 'export const util = () => {}',
      })
      expect(variables).toEqual({
        '@version': '1.0.0',
      })
    })

    it('should handle empty edits object', async () => {
      const files: Record<string, string> = {}
      const variables: Record<string, Json> = {}
      const edits = {}

      await expect(() => applyRecipeEdits(files, variables, edits)).not.toThrow()
    })
  })

  describe('applyRecipeEditOperation', () => {
    it('should handle string operations', async () => {
      const files: Record<string, string> = {}
      const variables: Record<string, Json> = {}

      await expect(() => applyRecipeEditOperation(files, variables, 'index.js', 'console.log("test")')).not.toThrow()
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

      applyRecipeEditOperation(files, variables, 'package.json/dependencies/react-three\\/fiber', '"18.0.0"')

      expect(files).to.deep.equal({
        'package.json': { dependencies: { 'react-three/fiber': '"18.0.0"' } },
      })
    })

    it('should handle variable paths', () => {
      const files: Record<string, string> = {}
      const variables: Record<string, Json> = {}

      expect(() => applyRecipeEditOperation(files, variables, '@messages', { set: "['Hello']" })).not.toThrow()
    })
  })

  describe('Integration tests', () => {
    it('should handle complex recipe with variables and file operations', async () => {
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

      const result = await buildProject([recipe])

      expect(decodeResult(result)).toEqual({
        'index.js': "console.log(...['Hello', 'World'])",
        'package.json': '{"name": "my-project", "dependencies": { "vite": "latest", "react": "^18.0.0" }}',
        'src/component.tsx': 'const Component = () => <div>Hello</div>',
      })
    })

    it('should handle recipe requirements resolution with value modification', async () => {
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

      const resolveRequirements = (name: string, _versionQuery: string): Recipe => {
        if (name === 'base-config') {
          return baseRecipe
        }
        throw new Error(`Unknown requirement: ${name}`)
      }

      const result = await buildProject([extendedRecipe], resolveRequirements)

      expect(decodeResult(result)).toEqual({
        'package.json':
          '{"name": "base-project", "dependencies": { "react": "^18.0.0", "react-router": "^6.0.0", "styled-components": "^5.0.0" }}',
        'theme.js': 'export const theme = "dark"',
        'features.js': 'export const features = ["basic", "advanced", "premium"]',
      })
    })
  })
})

describe('Error handling', () => {
  it('should not throw error for missing variables', async () => {
    const recipe: Recipe = {
      edits: {
        'index.js': 'console.log({{ @missingVariable }})',
      },
    }

    expect(decodeResult(await buildProject([recipe]))).toEqual({ 'index.js': 'console.log()' })
  })

  it('should throw error for circular variable referencing', async () => {
    const recipe: Recipe = {
      name: 'circular-vars-recipe',
      edits: {
        '@varA': 'Value A depends on {{ @varB }}',
        '@varB': 'Value B depends on {{ @varC }}',
        '@varC': 'Value C depends on {{ @varA }}',
      },
    }

    await expect(async () => await buildProject([recipe])).rejects.toThrow('Circular dependency detected for: @varA, @varB, @varC')
  })

  it('should throw error for self-referencing variable', async () => {
    const recipe: Recipe = {
      name: 'self-ref-recipe',
      edits: {
        '@selfRef': 'I reference myself: {{ @selfRef }}',
      },
    }

    await expect(async () => await buildProject([recipe])).rejects.toThrow('Circular dependency detected for: @selfRef')
  })

  it('should throw error when pushing to undefined variable', async () => {
    const recipe: Recipe = {
      name: 'push-undefined-recipe',
      edits: {
        'test.json': '{{@undefinedVar}}',
        '@undefinedVar': { push: 'item' },
      },
    }

    expect(decodeResult(await buildProject([recipe]))).toEqual({
      'test.json': '[item]',
    })
  })

  it('should throw error when pushing to non-array variable', async () => {
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

    await expect(async () => await buildProject(recipes)).rejects.toThrow('Cannot push to non-array value "I am a string" at path "@stringVar"')
  })

  it('should throw error when pushing to object variable', async () => {
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

    await expect(async () => await buildProject(recipes)).rejects.toThrow('Cannot push to non-array value {"key":"value"} at path "@objectVar"')
  })

  it('should throw error when pushAll to non-array variable', async () => {
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

    await expect(async () => await buildProject(recipes)).rejects.toThrow('Cannot pushAll to non-array value "42" at path "@numberVar"')
  })

  it('should throw writing to subpaths of non-object variables', async () => {
    const recipe: Recipe = {
      name: 'subpath-non-object-recipe',
      edits: {
        '@stringVar': 'I am a string',
        '@stringVar/nested/path': 'This should not work',
      },
    }

    await expect(async () => await buildProject([recipe])).rejects.toThrow(
      'unable to access path "@stringVar/nested/path". Found non-object value "I am a string".',
    )
  })

  it('should handle writing to subpaths of undefined variables', async () => {
    const recipe: Recipe = {
      name: 'subpath-null-recipe',
      edits: {
        'test.json': '{{ @undefinedVar }}',
        '@undefinedVar/nested': 123,
      },
    }

    const result = await buildProject([recipe])
    expect(decodeResult(result)).toEqual({
      'test.json': '{ "nested": 123 }',
    })
  })

  it('should handle writing to subpaths of array variables', async () => {
    const recipe: Recipe = {
      name: 'subpath-array-recipe',
      edits: {
        'test.json': ['item1', 'item2'],
        'test.json/0': 'newItem',
      },
    }

    const result = await buildProject([recipe])
    expect(decodeResult(result)).toEqual({
      'test.json': `[newItem, item2]`,
    })
  })

  it('should handle accessing nested values from undefined file paths', async () => {
    const recipe: Recipe = {
      name: 'nested-undefined-file-recipe',
      edits: {
        'package.json/dependencies/react': '"18.0.0"',
      },
    }

    const result = await buildProject([recipe])
    expect(decodeResult(result)).toEqual({
      'package.json': '{ "dependencies": { "react": "18.0.0" } }',
    })
  })

  it('should handle complex circular dependency chains', async () => {
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

    await expect(async () => await buildProject([recipe])).rejects.toThrow('Circular dependency detected for: @a, @b, @c, @d, @e')
  })

  it('should handle requirement resolution errors', async () => {
    const recipe: Recipe = {
      name: 'recipe-with-requirements',
      requirements: {
        'missing-recipe': '^1.0.0',
      },
      edits: {
        'index.js': 'console.log("test")',
      },
    }

    await expect(async () => await buildProject([recipe])).rejects.toThrow(
      'Recipe "missing-recipe" requires a resolveRequirements function to resolve dependencies',
    )
  })

  it('should handle failed requirement resolution', async () => {
    const recipe: Recipe = {
      name: 'recipe-with-bad-requirements',
      requirements: {
        'unknown-recipe': '^1.0.0',
      },
      edits: {
        'index.js': 'console.log("test")',
      },
    }

    const resolveRequirements = (name: string, _versionQuery: string): Recipe => {
      throw new Error(`Recipe not found: ${name}`)
    }

    await expect(async () => await buildProject([recipe], resolveRequirements)).rejects.toThrow('Recipe not found: unknown-recipe')
  })

  it('should handle variable references in nested object structures', async () => {
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

    expect(decodeResult(await buildProject([recipe]))).toEqual({
      'config.js': 'export default { "database": { "host": "localhost", "port":  } }',
    })
  })

  it('should handle multiple variable references in same string', async () => {
    const recipe: Recipe = {
      name: 'multi-var-ref-recipe',
      edits: {
        '@host': 'localhost',
        '@port': { set: 3000 },
        'config.js': 'const url = "http://{{ @host }}:{{ @port }}/{{ @missing }}"',
      },
    }

    expect(decodeResult(await buildProject([recipe]))).toEqual({
      'config.js': 'const url = "http://localhost:3000/"',
    })
  })

  it('should execute recipes and recipe edits in correct order', async () => {
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

    const result = await buildProject(recipes)

    expect(decodeResult(result)).toEqual({
      'log.txt': 'Step { "x": 1, "y": 2 }: Third recipe\n',
    })
  })
})

describe('New Operations', () => {
  describe('base64 operations', () => {
    it('should handle base64 operation for binary files', async () => {
      const recipe: Recipe = {
        name: 'base64-recipe',
        edits: {
          'image.png': {
            base64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
          },
        },
      }

      const result = await buildProject([recipe])

      expect(result['image.png']).toBeInstanceOf(Uint8Array)
      expect(result['image.png']?.length).toBeGreaterThan(0)
    })

    it('should throw error when using base64 on variables', async () => {
      const files: Record<string, Json> = {}
      const variables: Record<string, Json> = {}

      await expect(() => applyRecipeEditOperation(files, variables, '@variable', { base64: 'test' })).rejects.toThrow(
        'Cannot set base64 data on variable "@variable". Use file paths for binary data.',
      )
    })

    it('should throw error when binaryFiles parameter is missing', async () => {
      const files: Record<string, Json> = {}
      const variables: Record<string, Json> = {}

      await expect(() => applyRecipeEditOperation(files, variables, 'test.bin', { base64: 'test' })).rejects.toThrow(
        'binaryFiles parameter is required when using base64 operations',
      )
    })
  })

  describe('lines operations', () => {
    it('should handle lines operation', async () => {
      const recipe: Recipe = {
        name: 'lines-recipe',
        edits: {
          'script.sh': {
            lines: ['#!/bin/bash', 'echo "Hello"', 'echo "World"'],
          },
        },
      }

      const result = await buildProject([recipe])

      expect(decodeResult(result)['script.sh']).toBe('#!/bin/bash\necho "Hello"\necho "World"')
    })

    it('should handle empty lines array', async () => {
      const recipe: Recipe = {
        name: 'empty-lines-recipe',
        edits: {
          'empty.txt': {
            lines: [],
          },
        },
      }

      const result = await buildProject([recipe])

      expect(decodeResult(result)['empty.txt']).toBe('')
    })
  })

  describe('appendLines operations', () => {
    it('should append lines to existing content', async () => {
      const recipes: Recipe[] = [
        {
          name: 'base-content',
          edits: {
            'log.txt': 'Initial content',
          },
        },
        {
          name: 'append-lines-recipe',
          edits: {
            'log.txt': {
              appendLines: ['Line 1', 'Line 2', 'Line 3'],
            },
          },
        },
      ]

      const result = await buildProject(recipes)

      expect(decodeResult(result)['log.txt']).toBe('Initial content\nLine 1\nLine 2\nLine 3')
    })

    it('should handle appendLines on empty content', async () => {
      const recipe: Recipe = {
        name: 'append-lines-empty-recipe',
        edits: {
          'new.txt': {
            appendLines: ['First line', 'Second line'],
          },
        },
      }

      const result = await buildProject([recipe])

      expect(decodeResult(result)['new.txt']).toBe('First line\nSecond line')
    })

    it('should handle empty appendLines array', async () => {
      const recipes: Recipe[] = [
        {
          name: 'base-content',
          edits: {
            'content.txt': 'Existing content',
          },
        },
        {
          name: 'append-empty-lines-recipe',
          edits: {
            'content.txt': {
              appendLines: [],
            },
          },
        },
      ]

      const result = await buildProject(recipes)

      expect(decodeResult(result)['content.txt']).toBe('Existing content\n')
    })
  })

  describe('prependLines operations', () => {
    it('should prepend lines to existing content', async () => {
      const recipes: Recipe[] = [
        {
          name: 'base-content',
          edits: {
            'config.txt': 'Original content',
          },
        },
        {
          name: 'prepend-lines-recipe',
          edits: {
            'config.txt': {
              prependLines: ['Header line 1', 'Header line 2'],
            },
          },
        },
      ]

      const result = await buildProject(recipes)

      expect(decodeResult(result)['config.txt']).toBe('Header line 1\nHeader line 2\nOriginal content')
    })

    it('should handle prependLines on empty content', async () => {
      const recipe: Recipe = {
        name: 'prepend-lines-empty-recipe',
        edits: {
          'header.txt': {
            prependLines: ['First header', 'Second header'],
          },
        },
      }

      const result = await buildProject([recipe])

      expect(decodeResult(result)['header.txt']).toBe('First header\nSecond header')
    })

    it('should handle empty prependLines array', async () => {
      const recipes: Recipe[] = [
        {
          name: 'base-content',
          edits: {
            'file.txt': 'Main content',
          },
        },
        {
          name: 'prepend-empty-lines-recipe',
          edits: {
            'file.txt': {
              prependLines: [],
            },
          },
        },
      ]

      const result = await buildProject(recipes)

      expect(decodeResult(result)['file.txt']).toBe('\nMain content')
    })
  })

  describe('combined operations', () => {
    it('should handle multiple line operations in sequence', async () => {
      const recipes: Recipe[] = [
        {
          name: 'base-content',
          edits: {
            'combined.txt': {
              lines: ['Line 1', 'Line 2'],
            },
          },
        },
        {
          name: 'prepend-content',
          edits: {
            'combined.txt': {
              prependLines: ['Header'],
            },
          },
        },
        {
          name: 'append-content',
          edits: {
            'combined.txt': {
              appendLines: ['Footer'],
            },
          },
        },
      ]

      const result = await buildProject(recipes)

      expect(decodeResult(result)['combined.txt']).toBe('Header\nLine 1\nLine 2\nFooter')
    })

    it('should handle lines operation with variables', async () => {
      const recipe: Recipe = {
        name: 'lines-with-vars-recipe',
        edits: {
          '@name': 'World',
          'greeting.txt': {
            lines: ['Hello {{ @name }}!', 'Welcome to our app.'],
          },
        },
      }

      const result = await buildProject([recipe])

      expect(decodeResult(result)['greeting.txt']).toBe('Hello World!\nWelcome to our app.')
    })
  })
})

describe('URL Operations', () => {
  // Mock fetch for testing
  const mockFetch = vi.fn()
  
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch)
  })
  
  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('URL operator with allowUrl disabled', () => {
    it('should throw error when URL operator is used without allowUrl option', async () => {
      const recipe: Recipe = {
        name: 'url-recipe',
        edits: {
          'data.txt': {
            url: 'https://example.com/data.txt',
          },
        },
      }

      await expect(async () => await buildProject([recipe])).rejects.toThrow(
        `URL operator is not enabled. Set 'allowUrl: true' in ChefOptions to enable URL fetching.`
      )
    })

    it('should throw error when URL operator is used with allowUrl explicitly false', async () => {
      const recipe: Recipe = {
        name: 'url-recipe',
        edits: {
          'config.json': {
            url: 'https://api.example.com/config',
          },
        },
      }

      const options: ChefOptions = { allowUrl: false }

      await expect(async () => await buildProject([recipe], undefined, options)).rejects.toThrow(
        `URL operator is not enabled. Set 'allowUrl: true' in ChefOptions to enable URL fetching.`
      )
    })
  })

  describe('URL operator with allowUrl enabled', () => {
    it('should fetch text content from URL', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: {
          get: (name: string) => name === 'content-type' ? 'text/plain' : null,
        },
        text: () => Promise.resolve('Hello from URL!'),
      })

      const recipe: Recipe = {
        name: 'url-text-recipe',
        edits: {
          'content.txt': {
            url: 'https://example.com/content.txt',
          },
        },
      }

      const options: ChefOptions = { allowUrl: true }
      const result = await buildProject([recipe], undefined, options)

      expect(mockFetch).toHaveBeenCalledWith('https://example.com/content.txt')
      expect(decodeResult(result)['content.txt']).toBe('Hello from URL!')
    })

    it('should fetch JSON content from URL', async () => {
      const jsonData = { message: 'Hello', count: 42 }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: {
          get: (name: string) => name === 'content-type' ? 'application/json' : null,
        },
        text: () => Promise.resolve(JSON.stringify(jsonData)),
      })

      const recipe: Recipe = {
        name: 'url-json-recipe',
        edits: {
          'data.json': {
            url: 'https://api.example.com/data',
          },
        },
      }

      const options: ChefOptions = { allowUrl: true }
      const result = await buildProject([recipe], undefined, options)

      expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/data')
      expect(decodeResult(result)['data.json']).toBe('{"message":"Hello","count":42}')
    })

    it('should fetch binary content from URL', async () => {
      const binaryData = new Uint8Array([0x89, 0x50, 0x4E, 0x47]) // PNG header
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: {
          get: (name: string) => name === 'content-type' ? 'image/png' : null,
        },
        arrayBuffer: () => Promise.resolve(binaryData.buffer),
      })

      const recipe: Recipe = {
        name: 'url-binary-recipe',
        edits: {
          'image.png': {
            url: 'https://example.com/image.png',
          },
        },
      }

      const options: ChefOptions = { allowUrl: true }
      const result = await buildProject([recipe], undefined, options)

      expect(mockFetch).toHaveBeenCalledWith('https://example.com/image.png')
      expect(result['image.png']).toBeInstanceOf(Uint8Array)
      expect(Array.from(result['image.png']!)).toEqual([0x89, 0x50, 0x4E, 0x47])
    })

    it('should handle various text-based content types', async () => {
      const testCases = [
        { contentType: 'text/html', content: '<h1>Hello</h1>' },
        { contentType: 'text/css', content: 'body { margin: 0; }' },
        { contentType: 'text/javascript', content: 'console.log("test");' },
        { contentType: 'application/javascript', content: 'const x = 1;' },
        { contentType: 'application/xml', content: '<root>data</root>' },
        { contentType: 'text/xml', content: '<?xml version="1.0"?><data/>' },
      ]

      for (const { contentType, content } of testCases) {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          statusText: 'OK',
          headers: {
            get: (name: string) => name === 'content-type' ? contentType : null,
          },
          text: () => Promise.resolve(content),
        })

        const recipe: Recipe = {
          name: 'content-type-recipe',
          edits: {
            'file.txt': {
              url: 'https://example.com/file',
            },
          },
        }

        const options: ChefOptions = { allowUrl: true }
        const result = await buildProject([recipe], undefined, options)

        expect(decodeResult(result)['file.txt']).toBe(content)
      }
    })

    it('should throw error for failed HTTP requests', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      })

      const recipe: Recipe = {
        name: 'url-error-recipe',
        edits: {
          'missing.txt': {
            url: 'https://example.com/missing.txt',
          },
        },
      }

      const options: ChefOptions = { allowUrl: true }

      await expect(async () => await buildProject([recipe], undefined, options)).rejects.toThrow(
        'Failed to fetch URL "https://example.com/missing.txt": 404 Not Found'
      )
    })

    it('should throw error for server errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      })

      const recipe: Recipe = {
        name: 'server-error-recipe',
        edits: {
          'data.txt': {
            url: 'https://example.com/error',
          },
        },
      }

      const options: ChefOptions = { allowUrl: true }

      await expect(async () => await buildProject([recipe], undefined, options)).rejects.toThrow(
        'Failed to fetch URL "https://example.com/error": 500 Internal Server Error'
      )
    })

    it('should throw error when binaryFiles parameter is missing for binary content', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: {
          get: (name: string) => name === 'content-type' ? 'image/jpeg' : null,
        },
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(100)),
      })

      const files: Record<string, Json> = {}
      const variables: Record<string, Json> = {}
      const options: ChefOptions = { allowUrl: true }

      await expect(() => 
        applyRecipeEditOperation(files, variables, 'image.jpg', { url: 'https://example.com/image.jpg' }, undefined, options)
      ).rejects.toThrow('binaryFiles parameter is required when fetching binary content from URL')
    })

    it('should handle missing content-type header', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: {
          get: () => null, // No content-type header
        },
        arrayBuffer: () => Promise.resolve(new Uint8Array([1, 2, 3]).buffer),
      })

      const recipe: Recipe = {
        name: 'no-content-type-recipe',
        edits: {
          'unknown.bin': {
            url: 'https://example.com/unknown',
          },
        },
      }

      const options: ChefOptions = { allowUrl: true }
      const result = await buildProject([recipe], undefined, options)

      expect(result['unknown.bin']).toBeInstanceOf(Uint8Array)
      expect(Array.from(result['unknown.bin']!)).toEqual([1, 2, 3])
    })

    it('should combine URL operation with other operations', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: {
          get: (name: string) => name === 'content-type' ? 'text/plain' : null,
        },
        text: () => Promise.resolve('Base content'),
      })

      const recipes: Recipe[] = [
        {
          name: 'url-then-modify-recipe',
          edits: {
            'content.txt': {
              url: 'https://example.com/base.txt',
            },
          },
        },
        {
          name: 'modify-recipe',
          edits: {
            'content.txt': {
              append: '\nAdditional content',
            },
          },
        },
      ]

      const options: ChefOptions = { allowUrl: true }
      const result = await buildProject(recipes, undefined, options)

      expect(decodeResult(result)['content.txt']).toBe('Base content\nAdditional content')
    })

    it('should work with variables in URL fetching', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: {
          get: (name: string) => name === 'content-type' ? 'application/json' : null,
        },
        text: () => Promise.resolve('{"apiData": "success"}'),
      })

      const recipe: Recipe = {
        name: 'url-with-vars-recipe',
        edits: {
          '@apiUrl': 'https://api.example.com/data',
          'config.json': {
            url: 'https://api.example.com/data',
          },
          '@result': 'URL content loaded',
          'status.txt': 'Status: {{ @result }}',
        },
      }

      const options: ChefOptions = { allowUrl: true }
      const result = await buildProject([recipe], undefined, options)

      expect(decodeResult(result)['config.json']).toBe('{"apiData": "success"}')
      expect(decodeResult(result)['status.txt']).toBe('Status: URL content loaded')
    })
  })
})
