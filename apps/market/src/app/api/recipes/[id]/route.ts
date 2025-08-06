import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params

    const recipe = await prisma.recipe.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        versions: {
          orderBy: { createdAt: 'desc' },
        },
        tags: {
          include: { tag: true },
        },
      },
    })

    if (!recipe) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 })
    }


    // For example recipes, find similar examples
    let similarExamples: Array<{
      id: string
      name: string
      type: string
      user: { name: string | null }
      versions: Array<{ id: string; version: string; approved: boolean }>
    }> = []
    if (recipe.type === 'EXAMPLE') {
      // Get the latest approved version's requirements
      const latestVersion = recipe.versions.find((v) => v.approved)
      let requirementNames: string[] = []

      if (latestVersion) {
        const versionWithReqs = await prisma.recipeVersion.findUnique({
          where: { id: latestVersion.id },
          include: { requirements: true },
        })
        requirementNames = versionWithReqs?.requirements.map((r) => r.requiredRecipeId) || []
      }

      similarExamples = await prisma.recipe.findMany({
        where: {
          id: { not: recipe.id },
          type: 'EXAMPLE',
          versions: {
            some: {
              requirements: {
                some: {
                  requiredRecipeId: {
                    in: requirementNames,
                  },
                },
              },
            },
          },
        },
        take: 5,
        include: {
          user: {
            select: { name: true },
          },
          versions: {
            where: { approved: true },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      })
    }

    return NextResponse.json({
      ...recipe,
      similarExamples,
    })
  } catch (error) {
    console.error('Recipe fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch recipe' }, { status: 500 })
  }
}
