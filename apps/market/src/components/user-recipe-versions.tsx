import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Package } from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'

interface UserRecipeVersionsProps {
  userId: string
}

export async function UserRecipeVersions({ userId }: UserRecipeVersionsProps) {
  // Server-side fetch of user's recipe versions
  const recipeVersions = await prisma.recipeVersion.findMany({
    where: {
      recipe: {
        userId: userId
      }
    },
    include: {
      requirements: {
        include: {
          requiredRecipe: {
            select: { name: true }
          }
        }
      },
      recipe: {
        include: {
          user: {
            select: { name: true, email: true }
          },
          tags: {
            include: { tag: true }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  if (recipeVersions.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No recipes yet</h3>
          <p className="text-muted-foreground mb-4">
            Start by uploading your first recipe using the API
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {recipeVersions.map((version) => (
        <Card key={version.id}>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Link 
                    href={`/recipe/${version.recipe.name}/${version.version}`}
                    className="text-lg font-semibold hover:underline"
                  >
                    {version.recipe.name}
                  </Link>
                  <Badge variant="outline" size="sm">v{version.version}</Badge>
                  <Badge>{version.recipe.type}</Badge>
                </div>
                
                {version.recipe.description && (
                  <p className="text-muted-foreground mb-2">{version.recipe.description}</p>
                )}
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                  <span>Version created {format(new Date(version.createdAt), 'MMM d, yyyy')}</span>
                </div>

                {/* Dependencies */}
                {version.requirements && version.requirements.length > 0 && (
                  <div className="mb-2">
                    <p className="text-sm text-muted-foreground mb-1">Dependencies:</p>
                    <div className="flex gap-1 flex-wrap">
                      {version.requirements.map((req, index) => (
                        <Badge key={index} variant="secondary" size="sm">
                          {req.requiredRecipe.name} {req.versionRange}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tags */}
                {version.recipe.tags?.length > 0 && (
                  <div className="flex gap-1 mt-2">
                    {version.recipe.tags.map((rt) => (
                      <Badge key={rt.tag.id} variant="outline" size="sm">
                        {rt.tag.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="flex flex-col items-end gap-2">
                {version.approved ? (
                  <Badge variant="default" className="bg-green-600">Approved</Badge>
                ) : (
                  <Badge variant="secondary">Pending</Badge>
                )}
                
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    asChild
                  >
                    <Link href={`/recipe/${version.recipe.name}/${version.version}`}>View Version</Link>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}