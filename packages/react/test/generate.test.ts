import { describe, it, expect } from 'vitest'
import { generate, type GenerateOptions } from '../src/index.js'

describe('basic generation tests', () => {
  it('should generate a project without throwing errors', () => {
    const options: GenerateOptions = {
      name: 'test-project'
    }
    
    expect(() => generate(options)).not.toThrow()
  })

  it('should return a result with files', () => {
    const options: GenerateOptions = {
      name: 'test-project'
    }
    
    const result = generate(options)
    expect(result).toBeDefined()
    expect(typeof result).toBe('object')
    expect(Object.keys(result).length).toBeGreaterThan(0)
  })

  it('should generate project with drei library without errors', () => {
    const options: GenerateOptions = {
      name: 'drei-project',
      drei: true
    }
    
    expect(() => generate(options)).not.toThrow()
  })

  it('should generate project with multiple libraries without errors', () => {
    const options: GenerateOptions = {
      name: 'multi-lib-project',
      drei: true,
      leva: true,
      rapier: true
    }
    
    expect(() => generate(options)).not.toThrow()
  })

  it('should generate project with triplex extension without errors', () => {
    const options: GenerateOptions = {
      name: 'triplex-project',
      triplex: true
    }
    
    expect(() => generate(options)).not.toThrow()
  })

  it('should generate project with github pages hosting without errors', () => {
    const options: GenerateOptions = {
      name: 'github-project',
      githubPages: true
    }
    
    expect(() => generate(options)).not.toThrow()
  })

  it('should generate project with XR library without errors', () => {
    const options: GenerateOptions = {
      name: 'xr-project',
      xr: true
    }
    
    expect(() => generate(options)).not.toThrow()
  })

  it('should generate comprehensive project without errors', () => {
    const options: GenerateOptions = {
      name: 'comprehensive-project',
      drei: true,
      leva: true,
      rapier: true,
      triplex: true,
      xr: true,
      githubPages: true,
      viverse: true,
      packageManager: 'pnpm'
    }
    
    expect(() => generate(options)).not.toThrow()
  })
})