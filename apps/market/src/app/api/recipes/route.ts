import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { Prisma } from '@prisma/client'

const recipeSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  type: z.enum(['ARTIFACT', 'EXAMPLE']),
  version: z.string(),
  edits: z.record(z.unknown()),
  tags: z.array(z.string().min(3).max(20)).optional(),
  dependencies: z
    .array(
      z.object({
        name: z.string(),
        versionRange: z.string(),
      }),
    )
    .optional(),
  requirements: z.record(z.string()).optional(), // For recipe files: { "recipeName": "^1.0.0" }
})

export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get('x-api-key')

    if (!apiKey) {
      return NextResponse.json({ error: 'API key required' }, { status: 401 })
    }

    // Find user by API key
    const user = await prisma.user.findUnique({
      where: { apiKey },
    })

    if (!user) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = recipeSchema.parse(body)

    // Check if recipe with same name + type already exists
    const existingRecipe = await prisma.recipe.findUnique({
      where: {
        name: validatedData.name,
      },
    })

    let recipe
    if (existingRecipe) {
      // Update existing recipe with new version
      recipe = existingRecipe
    } else {
      // Create new recipe
      recipe = await prisma.recipe.create({
        data: {
          name: validatedData.name,
          description: validatedData.description,
          type: validatedData.type,
          userId: user.id,
        },
      })

      // Add tags if provided
      if (validatedData.tags && validatedData.tags.length > 0) {
        for (const tagName of validatedData.tags) {
          // Get or create tag
          await prisma.tag.upsert({
            where: { name: tagName },
            create: { name: tagName },
            update: {
              recipes: { create: { recipeId: recipe.id } },
            },
          })
        }
      }
    }

    // Check if this version already exists
    const existingVersion = await prisma.recipeVersion.findUnique({
      where: {
        recipeId_version: {
          recipeId: recipe.id,
          version: validatedData.version,
        },
      },
    })

    if (existingVersion) {
      return NextResponse.json({ error: 'Version already exists' }, { status: 409 })
    }

    // Create new version
    const version = await prisma.recipeVersion.create({
      data: {
        recipeId: recipe.id,
        version: validatedData.version,
        edits: validatedData.edits as Prisma.JsonObject,
        approved: false,
        requirements: {
          create: Object.entries(validatedData.requirements ?? {}).map(([name, versionRange]) => ({
            requiredRecipe: {
              connect: { name },
            },
            versionRange,
            versionRecipeId: recipe.id,
          })),
        },
      },
    })

    return NextResponse.json({
      success: true,
      recipe: {
        id: recipe.id,
        name: recipe.name,
        type: recipe.type,
      },
      version: {
        id: version.id,
        version: version.version,
        approved: version.approved,
        buildError: version.buildError,
      },
    })
  } catch (error) {
    console.error('Recipe upload error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 })
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
