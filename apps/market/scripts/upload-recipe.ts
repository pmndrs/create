#!/usr/bin/env tsx

import { readFileSync } from 'fs'
import { resolve } from 'path'

// Parse command line arguments
const args = process.argv.slice(2)

if (args.length < 2) {
  console.error('Usage: tsx scripts/upload-recipe.ts <recipe-file> <type> [api-key] [tags...]')
  console.error('Example: tsx scripts/upload-recipe.ts ./my-recipe.json EXAMPLE react three fiber')
  console.error('Note: If api-key is not provided, TEST_API_KEY env var will be used')
  process.exit(1)
}

const [recipePath, type, ...rest] = args

// Check if third argument looks like an API key or a tag
const apiKey = rest.length > 0 && rest[0].length > 20 ? rest.shift() : process.env.TEST_API_KEY
const tags = rest

if (!apiKey) {
  console.error('No API key provided and TEST_API_KEY environment variable not set')
  process.exit(1)
}

if (type !== 'ARTIFACT' && type !== 'EXAMPLE') {
  console.error('Type must be either ARTIFACT or EXAMPLE')
  process.exit(1)
}

async function uploadRecipe() {
  try {
    // Read the recipe file
    const recipeContent = JSON.parse(readFileSync(resolve(recipePath), 'utf8'))

    // Prepare the upload payload
    const payload = {
      type,
      ...recipeContent,
    }

    console.log(`Uploading ${type} recipe: ${recipeContent.name} v${recipeContent.version}`)
    if (tags.length > 0) {
      console.log(`Tags: ${tags.join(', ')}`)
    }

    // Make the API request
    const response = await fetch('http://localhost:3000/api/recipes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey!,
      },
      body: JSON.stringify(payload),
    })

    const responseText = await response.text()
    let result
    try {
      result = JSON.parse(responseText)
    } catch (jsonError) {
      console.error('Server returned non-JSON response:')
      console.error('Status:', response.status, response.statusText)
      console.error('Response:', responseText)
      process.exit(1)
    }

    if (!response.ok) {
      console.error('Upload failed:', result.error)
      if (result.details) {
        console.error('Details:', JSON.stringify(result.details, null, 2))
      }
      process.exit(1)
    }

    console.log('✅ Recipe uploaded successfully!')
    console.log('Recipe ID:', result.recipe.id)
    console.log('Recipe Name:', result.recipe.name)
    console.log('Version ID:', result.version.id)
    console.log('Version:', result.version.version)
    console.log('Approved:', result.version.approved)
  } catch (error) {
    console.error('Error uploading recipe:', error)
    process.exit(1)
  }
}

uploadRecipe()
