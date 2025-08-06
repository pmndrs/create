#!/usr/bin/env tsx

import { readFileSync } from 'fs'
import { resolve } from 'path'

const args = process.argv.slice(2)

if (args.length < 3) {
  console.error('Usage: tsx scripts/compare-recipes.ts <original-file> <recipe-name> <version> [--include-unapproved]')
  process.exit(1)
}

const [originalPath, recipeName, version, ...flags] = args
const includeUnapproved = flags.includes('--include-unapproved')

async function compareRecipes() {
  try {
    // Read original file
    const original = JSON.parse(readFileSync(resolve(originalPath), 'utf8'))
    
    // Fetch from API
    const encodedName = encodeURIComponent(recipeName)
    const encodedVersion = encodeURIComponent(version)
    const queryParams = includeUnapproved ? '?includeUnapproved=true' : ''
    const url = `http://localhost:3000/api/recipe/${encodedName}/${encodedVersion}${queryParams}`
    
    const response = await fetch(url)
    if (!response.ok) {
      const error = await response.json()
      console.error('Failed to fetch recipe:', error.error)
      process.exit(1)
    }
    
    const fetched = await response.json()
    
    // Compare
    console.log('\n🔍 Comparing recipes...\n')
    
    // Find differences
    const originalKeys = Object.keys(original).sort()
    const fetchedKeys = Object.keys(fetched).sort()
    
    console.log('Original fields:', originalKeys)
    console.log('Fetched fields:', fetchedKeys)
    
    // Missing fields
    const missing = originalKeys.filter(k => !fetchedKeys.includes(k))
    if (missing.length > 0) {
      console.log('\n❌ Missing fields:', missing)
    }
    
    // Extra fields
    const extra = fetchedKeys.filter(k => !originalKeys.includes(k))
    if (extra.length > 0) {
      console.log('\n➕ Extra fields:', extra)
    }
    
    // Check values for common fields
    console.log('\n📊 Field comparison:')
    for (const key of originalKeys) {
      if (fetchedKeys.includes(key)) {
        const originalValue = JSON.stringify(original[key])
        const fetchedValue = JSON.stringify(fetched[key])
        
        if (originalValue === fetchedValue) {
          console.log(`✅ ${key}: identical`)
        } else {
          console.log(`⚠️  ${key}: different`)
          if (originalValue.length < 100 && fetchedValue.length < 100) {
            console.log(`   Original: ${originalValue}`)
            console.log(`   Fetched:  ${fetchedValue}`)
          }
        }
      }
    }
    
    // Deep comparison
    const isIdentical = JSON.stringify(original) === JSON.stringify(fetched)
    console.log(`\n${isIdentical ? '✅' : '❌'} Overall: ${isIdentical ? 'IDENTICAL' : 'DIFFERENT'}`)
    
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

compareRecipes()