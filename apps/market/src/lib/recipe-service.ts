import { prisma } from '@/lib/prisma'
import { Recipe } from '@pmndrs/chef'
import * as semver from 'semver'

/**
 * Gets a complete recipe with all its details from the database
 * @param recipeName - The name of the recipe
 * @param versionQuery - Version query (semver range, "latest", or exact version)
 * @param includeUnapproved - Whether to include unapproved versions
 * @returns The complete recipe data or null if not found
 */
export async function getRecipe(recipeName: string, versionQuery: string, includeUnapproved = false): Promise<Recipe> {
  // Find the recipe by name and get versions based on approval filter
  const recipe = await prisma.recipe.findFirstOrThrow({
    where: {
      name: recipeName,
    },
    include: {
      versions: {
        where: includeUnapproved ? {} : { approved: true },
        include: {
          requirements: {
            include: {
              requiredRecipe: {
                select: { name: true },
              },
            },
          },
        },
        orderBy: [
          // Sort by version using string comparison (works for semver like 0.0.1, 1.0.0)
          { version: 'desc' as const },
        ],
      },
    },
  })

  // Find the best matching version using semver
  let matchingVersion = null

  // If version query is "latest", return the first version (highest due to DESC order)
  if (versionQuery === 'latest') {
    matchingVersion = recipe.versions[0]
  } else {
    // Try to find a version that satisfies the semver range
    for (const version of recipe.versions) {
      if (semver.satisfies(version.version, versionQuery)) {
        matchingVersion = version
        break
      }
    }
  }

  if (!matchingVersion) {
    throw new Error(`no matching version for version query "${versionQuery}" of recipe "${recipeName}"`)
  }

  // Rebuild requirements object from the version requirements
  const requirements: Record<string, string> = {}
  if (matchingVersion.requirements && matchingVersion.requirements.length > 0) {
    for (const req of matchingVersion.requirements) {
      requirements[req.requiredRecipe.name] = req.versionRange
    }
  }

  // Return the complete recipe data
  return {
    name: recipe.name,
    description: recipe.description ?? undefined,
    version: matchingVersion.version,
    edits: matchingVersion.edits as Recipe['edits'],
    requirements
  }
}
