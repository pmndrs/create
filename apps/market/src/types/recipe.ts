import { Prisma } from '@prisma/client'

// Common Prisma include patterns
export const RecipeCardInclude = {
  user: { select: { name: true, email: true } },
  versions: { 
    select: { id: true, version: true, approved: true },
    take: 1,
    orderBy: { createdAt: 'desc' } as const
  },
  tags: { include: { tag: true } }
} as const

export const RecipeDetailInclude = {
  user: { select: { name: true, email: true } },
  versions: { orderBy: { createdAt: 'desc' } as const },
  tags: { include: { tag: true } }
} as const

// Export types based on the include patterns
export type RecipeCard = Prisma.RecipeGetPayload<{ include: typeof RecipeCardInclude }>

export type RecipeCardWithExample = RecipeCard & {
  primaryExample?: {
    name: string
    versions: Array<{
      version: string
      approved: boolean
    }>
  }
}

export type RecipeDetail = Prisma.RecipeGetPayload<{ include: typeof RecipeDetailInclude }>

export type RecipeVersion = Prisma.RecipeVersionGetPayload<Record<string, never>>

export type RecipeVersionWithRequirements = Prisma.RecipeVersionGetPayload<{
  include: {
    requirements: {
      include: {
        requiredRecipe: {
          select: { name: true }
        }
      }
    }
  }
}>

export type Tag = Prisma.TagGetPayload<Record<string, never>>

export type RecipeTag = Prisma.RecipeTagGetPayload<{ include: { tag: true } }>


// Legacy aliases for backward compatibility
export type Recipe = RecipeDetail
export type RecipeWithPrimaryExample = RecipeDetail & {
  primaryExample?: RecipeDetail
  similarExamples?: RecipeDetail[]
}