import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'

interface RecipeRedirectProps {
  params: Promise<{ name: string }>
}

export default async function RecipeRedirect({ params }: RecipeRedirectProps) {
  const { name } = await params
  
  // Find the recipe and get the latest approved version
  const recipe = await prisma.recipe.findFirst({
    where: { 
      name: decodeURIComponent(name)
    },
    include: {
      versions: {
        where: { approved: true },
        orderBy: { createdAt: 'desc' },
        take: 1
      }
    }
  })

  if (!recipe) {
    notFound()
  }

  // If no approved versions, get the latest version regardless of approval
  if (recipe.versions.length === 0) {
    const latestVersion = await prisma.recipeVersion.findFirst({
      where: { recipeId: recipe.id },
      orderBy: { createdAt: 'desc' }
    })

    if (!latestVersion) {
      notFound()
    }

    redirect(`/recipe/${encodeURIComponent(name)}/${encodeURIComponent(latestVersion.version)}`)
  }

  // Redirect to the latest approved version
  redirect(`/recipe/${encodeURIComponent(name)}/${encodeURIComponent(recipe.versions[0].version)}`)
}