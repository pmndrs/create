import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { BuildService } from '@/lib/build-service'
import { getRecipe } from '@/lib/recipe-service'
import type { RecipeEditOperation } from '@pmndrs/chef'

export async function POST(request: NextRequest, { params }: { params: Promise<{ name: string; version: string }> }) {
  try {
    const { name, version } = await params
    const recipeName = decodeURIComponent(name)
    const recipeVersion = decodeURIComponent(version)

    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    if (!user?.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Find the recipe by name and specific version
    const recipe = await prisma.recipe.findFirst({
      where: { name: recipeName },
      include: {
        versions: {
          where: {
            version: recipeVersion,
            approved: false,
          },
          include: {
            requirements: true,
          },
          take: 1,
        },
      },
    })

    if (!recipe) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 })
    }

    if (recipe.versions.length === 0) {
      return NextResponse.json(
        {
          error: 'Version not found or already approved',
        },
        { status: 404 },
      )
    }

    const versionRecord = recipe.versions[0]

    // For EXAMPLE recipes, start the build process instead of just approving
    if (recipe.type === 'EXAMPLE') {
      // Get the full recipe data for the build service
      const fullRecipe = await getRecipe(recipeName, version, true)
      if (fullRecipe) {
        // Trigger the build process (runs in background)
        try {
          await BuildService.buildRecipeVersion(fullRecipe)

          // Update recipe version with success
          await prisma.recipeVersion.update({
            where: { id: versionRecord.id },
            data: {
              approved: true, // Approve on successful build
            },
          })

          // Note: Only recipe versions can be approved, not recipes themselves
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          console.error(error)
          await prisma.recipeVersion.update({
            where: { id: versionRecord.id },
            data: {
              buildError: errorMessage,
            },
          })
        }
      }

      return NextResponse.json({
        success: true,
        message: `Version ${recipeVersion} build started. Recipe will be approved after successful build.`,
      })
    } else {
      // For ARTIFACT recipes, approve immediately
      await prisma.recipeVersion.update({
        where: { id: versionRecord.id },
        data: {
          approved: true,
        },
      })

      return NextResponse.json({
        success: true,
        message: `Version ${recipeVersion} approved`,
      })
    }
  } catch (error) {
    console.error('Recipe approval error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
