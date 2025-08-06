import { notFound } from 'next/navigation'
import { RecipeVersionDetail } from '@/components/recipe-version-detail'
import { prisma } from '@/lib/prisma'

interface RecipePageProps {
  params: Promise<{ name: string; version: string }>
}

export default async function RecipePage({ params }: RecipePageProps) {
  const { name, version } = await params

  const recipe = await prisma.recipe.findFirst({
    where: {
      name: decodeURIComponent(name),
    },
    include: {
      user: {
        select: { name: true, email: true },
      },
      tags: {
        include: { tag: true },
      },
      dependentVersions: {
        distinct: 'versionRecipeId',
        where: {
          version: {
            recipe: {
              type: 'EXAMPLE',
            },
          },
        },
        take: 5,
        orderBy: { version: { createdAt: 'desc' } },
        include: {
          version: {
            include: { recipe: { include: { tags: { include: { tag: true } }, user: true, versions: true } } },
          },
        },
      },
      versions: {
        where: {
          version: decodeURIComponent(version),
        },
        include: {
          requirements: {
            include: {
              requiredRecipe: true,
            },
          },
        },
      },
    },
  })

  if (!recipe || recipe.versions.length === 0) {
    notFound()
  }

  const recipeVersion = recipe.versions[0]

  return (
    <div className="container mx-auto px-4 py-8">
      <RecipeVersionDetail recipe={recipe} version={recipeVersion} />
    </div>
  )
}
