import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { RecipeType, Prisma } from '@prisma/client'

const recipeUploadSchema = z.object({
  type: z.enum(['ARTIFACT', 'EXAMPLE']),
  content: z.object({
    name: z.string().min(1).max(100),
    description: z.string().optional(),
    version: z.string().regex(/^\d+\.\d+\.\d+$/), // semver format
    requirements: z.record(z.string()).optional(),
    edits: z.record(z.any()).optional(),
  }),
  tags: z.array(z.string().min(3).max(20)).optional(),
})

export async function POST(request: NextRequest) {
  try {
    // Get API key from header
    const apiKey = request.headers.get('x-api-key')
    if (!apiKey) {
      return NextResponse.json({ error: 'API key is required' }, { status: 401 })
    }

    // Find user by API key
    const user = await prisma.user.findUnique({
      where: { apiKey },
    })

    if (!user) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = recipeUploadSchema.parse(body)

    // Check if recipe with same name and type already exists
    const existingRecipe = await prisma.recipe.findUnique({
      where: {
        name: validatedData.content.name,
      },
    })

    let recipe

    if (existingRecipe) {
      // Check if user owns the recipe
      if (existingRecipe.userId !== user.id) {
        return NextResponse.json({ error: 'Recipe with this name and type already exists' }, { status: 409 })
      }

      // Check if version already exists
      const existingVersion = await prisma.recipeVersion.findUnique({
        where: {
          recipeId_version: {
            recipeId: existingRecipe.id,
            version: validatedData.content.version,
          },
        },
      })

      if (existingVersion) {
        return NextResponse.json({ error: 'Version already exists for this recipe' }, { status: 409 })
      }

      recipe = existingRecipe
    } else {
      // Create new recipe
      recipe = await prisma.recipe.create({
        data: {
          name: validatedData.content.name,
          description: validatedData.content.description,
          type: validatedData.type as RecipeType,
          userId: user.id,
        },
      })
    }

    // Create recipe version
    const recipeVersion = await prisma.recipeVersion.create({
      data: {
        recipeId: recipe.id,
        version: validatedData.content.version,
        edits: (validatedData.content.edits ?? {}) as Prisma.JsonObject,
        approved: false,
        requirements: {
          create: Object.entries(validatedData.content.requirements ?? {}).map(([name, versionRange]) => ({
            requiredRecipe: {
              connect: { name },
            },
            versionRange,
          })),
        },
      },
    })

    // Handle tags if provided
    if (validatedData.tags && validatedData.tags.length > 0) {
      for (const tagName of validatedData.tags) {
        // Create tag if it doesn't exist
        const tag = await prisma.tag.upsert({
          where: { name: tagName },
          update: {},
          create: { name: tagName },
        })

        // Create recipe-tag relationship
        await prisma.recipeTag.upsert({
          where: {
            recipeId_tagId: {
              recipeId: recipe.id,
              tagId: tag.id,
            },
          },
          update: {},
          create: {
            recipeId: recipe.id,
            tagId: tag.id,
          },
        })
      }
    }

    return NextResponse.json({
      recipe: {
        id: recipe.id,
        name: recipe.name,
        type: recipe.type,
      },
      version: {
        id: recipeVersion.id,
        version: recipeVersion.version,
        approved: recipeVersion.approved,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 })
    }

    console.error('Recipe upload error:', error)
    return NextResponse.json({ error: 'Failed to upload recipe' }, { status: 500 })
  }
}
