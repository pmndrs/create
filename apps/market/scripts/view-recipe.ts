#!/usr/bin/env tsx

// Parse command line arguments
const args = process.argv.slice(2)

if (args.length < 2) {
  console.error('Usage: tsx scripts/view-recipe.ts <recipe-name> <version> [--include-unapproved]')
  console.error('Example: tsx scripts/view-recipe.ts my-recipe 1.0.0')
  console.error('Example: tsx scripts/view-recipe.ts my-recipe latest')
  console.error('Example: tsx scripts/view-recipe.ts my-recipe "^1.0.0"')
  console.error('Example: tsx scripts/view-recipe.ts my-recipe latest --include-unapproved')
  process.exit(1)
}

const [recipeName, version, ...flags] = args
const includeUnapproved = flags.includes('--include-unapproved')

async function viewRecipe() {
  try {
    const encodedName = encodeURIComponent(recipeName)
    const encodedVersion = encodeURIComponent(version)
    const queryParams = includeUnapproved ? '?includeUnapproved=true' : ''
    const url = `http://localhost:3000/api/recipe/${encodedName}/${encodedVersion}${queryParams}`
    
    console.log(`Fetching recipe: ${recipeName} v${version}`)
    if (includeUnapproved) {
      console.log('Including unapproved versions')
    }
    console.log(`URL: ${url}`)

    const response = await fetch(url)
    const result = await response.json()

    if (!response.ok) {
      console.error('Failed to fetch recipe:', result.error)
      if (result.availableVersions) {
        console.log('Available versions:', result.availableVersions.join(', '))
      }
      process.exit(1)
    }

    console.log('\n✅ Recipe found!')
    console.log('━'.repeat(50))
    console.log('Name:', result.name)
    console.log('Version:', result.version)
    console.log('Type:', response.headers.get('X-Recipe-Type') || 'N/A')
    console.log('\nRecipe JSON:')
    console.log(JSON.stringify(result, null, 2))
    console.log('━'.repeat(50))

    // Show response headers
    console.log('\nResponse Headers:')
    console.log('X-Recipe-Name:', response.headers.get('X-Recipe-Name'))
    console.log('X-Recipe-Version:', response.headers.get('X-Recipe-Version'))
    console.log('X-Recipe-Type:', response.headers.get('X-Recipe-Type'))

  } catch (error) {
    console.error('Error fetching recipe:', error)
    process.exit(1)
  }
}

viewRecipe()