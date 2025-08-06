import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

export async function GET() {
  try {
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

    // Get all unapproved recipe versions
    const unapprovedVersions = await prisma.recipeVersion.findMany({
      where: { approved: false },
      include: {
        recipe: {
          include: {
            user: {
              select: { name: true, email: true },
            },
            tags: {
              include: { tag: true },
            },
          },
        },
        requirements: true,
      },
      orderBy: { createdAt: 'asc' }, // Oldest first for FIFO approval
    })

    // Add approval eligibility information for each version
    const versionsWithEligibility = unapprovedVersions.map((version) => {
      //TODO:  find unapprovedRequirements by checking if any version of each requirement has an approved version matching the version query
      const unapprovedRequirements = [] //

      return {
        id: version.id,
        version: version.version,
        buildError: version.buildError,
        createdAt: version.createdAt,
        recipe: {
          id: version.recipe.id,
          name: version.recipe.name,
          description: version.recipe.description,
          type: version.recipe.type,
          user: version.recipe.user,
          tags: version.recipe.tags,
        },
        canApprove: unapprovedRequirements.length === 0,
        unapprovedRequirements: version.requirements.map((req) => req.requiredRecipeId),
      }
    })

    return NextResponse.json({
      versions: versionsWithEligibility,
    })
  } catch (error) {
    console.error('Get unapproved recipes error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
