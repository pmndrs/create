import { prisma } from '@/lib/prisma'
import { RecipeCard } from './recipe-card'
import { RecipeType } from '@prisma/client'

interface RecipeBrowserProps {
  searchParams?: {
    search?: string
    type?: string
    requirements?: string
    tags?: string
  }
}

export async function RecipeBrowser({ searchParams }: RecipeBrowserProps) {
  const { search, type, requirements, tags } = searchParams || {}
  
  const where: Record<string, unknown> = {}

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } }
    ]
  }


  if (type && type !== 'all') {
    where.type = type as RecipeType
  }

  if (requirements) {
    const reqList = requirements.split(',').filter(Boolean)
    if (reqList.length > 0) {
      where.requirements = {
        some: {
          requirement: {
            name: {
              in: reqList
            }
          }
        }
      }
    }
  }

  if (tags) {
    const tagList = tags.split(',').filter(Boolean)
    if (tagList.length > 0) {
      where.tags = {
        some: {
          tag: {
            name: {
              in: tagList
            }
          }
        }
      }
    }
  }

  const recipes = await prisma.recipe.findMany({
    where,
    include: {
      user: {
        select: { name: true, email: true }
      },
      versions: {
        select: { id: true, version: true, approved: true },
        orderBy: { createdAt: 'desc' },
        take: 1
      },
      tags: {
        include: { tag: true }
      }
    },
    orderBy: { updatedAt: 'desc' }
  })

  if (recipes.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium mb-2">No recipes found</h3>
        <p className="text-muted-foreground">
          Try adjusting your filters or search terms.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {recipes.map((recipe) => (
        <RecipeCard key={recipe.id} recipe={recipe} />
      ))}
    </div>
  )
}