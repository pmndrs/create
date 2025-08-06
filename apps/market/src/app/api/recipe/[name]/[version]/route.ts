import { NextRequest, NextResponse } from 'next/server'
import { getRecipe } from '@/lib/recipe-service'

export async function GET(request: NextRequest, { params }: { params: Promise<{ name: string; version: string }> }) {
  try {
    const { name, version } = await params
    const recipeName = decodeURIComponent(name)
    const versionQuery = decodeURIComponent(version)

    // Check if we should include unapproved versions
    const searchParams = request.nextUrl.searchParams
    const includeUnapproved = searchParams.get('includeUnapproved') === 'true'

    // Get the full recipe using the service
    const recipeData = await getRecipe(recipeName, versionQuery, includeUnapproved)

    if (!recipeData) {
      const errorMessage = includeUnapproved
        ? 'Recipe or version not found'
        : 'Recipe not found or no approved versions available'
      return NextResponse.json({ error: errorMessage }, { status: 404 })
    }

    // Build the recipe JSON response (excluding internal metadata)
    const recipeJson = {
      name: recipeData.name,
      description: recipeData.description,
      version: recipeData.version,
      ...(recipeData.edits && { edits: recipeData.edits }),
      ...(recipeData.requirements && { requirements: recipeData.requirements }),
    }

    // Return the complete recipe JSON
    return NextResponse.json(recipeJson, {
      headers: {
        'Content-Type': 'application/json',
      },
    })
  } catch (error) {
    console.error('Error fetching recipe version:', error)

    // Handle semver parsing errors
    if (error instanceof Error && error.message.includes('Invalid Version')) {
      return NextResponse.json(
        {
          error: 'Invalid version query. Use semver format (e.g., ^1.0.0, ~2.1.0, >=1.5.0) or "latest"',
          example: '/api/recipes/my-recipe/^1.0.0',
        },
        { status: 400 },
      )
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
