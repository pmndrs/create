'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, Code, Play, Package } from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'
import { RecipeWithPrimaryExample, RecipeVersionWithRequirements } from '@/types/recipe'
import { Tags } from '@/components/tags'

interface RecipeVersionDetailProps {
  recipe: RecipeWithPrimaryExample
  version: RecipeVersionWithRequirements
}

/**
 * Recipe Version Detail Component
 * Displays detailed information for a specific version of a recipe
 */
export function RecipeVersionDetail({ recipe, version }: RecipeVersionDetailProps) {
  const versionStatus = version.approved
    ? { label: 'Approved', variant: 'success' as const }
    : { label: 'Pending', variant: 'secondary' as const }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {recipe.type === 'EXAMPLE' && version.approved && (
        <iframe
          src={`https://pub-54e2a7dbf936490fae36efbdea022cba.r2.dev/${recipe.name}/${version.version}/index.html`}
          className="w-full h-[60vh] max-h-[60vh] border-0"
          title="Example preview"
        />
      )}

      {/* Header Section */}
      <div className="bg-muted/50 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold">{recipe.name}</h1>
            <p className="text-xl text-muted-foreground mt-1">v{version.version}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={versionStatus.variant}>{versionStatus.label}</Badge>
            <Badge variant="outline">{recipe.type}</Badge>
          </div>
        </div>

        {recipe.description && <p className="text-lg text-muted-foreground mb-4">{recipe.description}</p>}

        <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
          <span>by {recipe.user.name || recipe.user.email}</span>
          <span>•</span>
          <span>Version released {format(new Date(version.createdAt), 'MMM d, yyyy')}</span>
        </div>

        {/* Tags */}
        <Tags tags={recipe.tags} className="mt-4" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dependencies */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="h-5 w-5" />
              Dependencies
            </CardTitle>
          </CardHeader>
          <CardContent>
            {version.requirements && version.requirements.length > 0 ? (
              <div className="space-y-2">
                {version.requirements.map((req, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Link href={`/recipe/${req.requiredRecipe.name}`} className="font-medium hover:underline">
                        {req.requiredRecipe.name}
                      </Link>
                      <Badge variant="outline" size="sm">
                        {req.versionRange}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No dependencies</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Similar Examples (for example recipes) */}
      {recipe.type === 'EXAMPLE' && recipe.similarExamples && recipe.similarExamples.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Similar Examples</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recipe.similarExamples.map((example) => (
                <Link key={example.id} href={`/recipe/${example.name}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      <h4 className="font-semibold">{example.name}</h4>
                      {example.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{example.description}</p>
                      )}
                      <div className="flex gap-1 mt-2">
                        {example.tags.slice(0, 2).map((rt) => (
                          <Badge key={rt.tag.id} variant="outline" size="sm">
                            {rt.tag.name}
                          </Badge>
                        ))}
                        {example.tags.length > 2 && (
                          <Badge variant="outline" size="sm">
                            +{example.tags.length - 2}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Primary Example Link (for artifact recipes) */}
      {recipe.type === 'ARTIFACT' && recipe.primaryExample && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Example Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <Link href={`/recipe/${recipe.primaryExample.name}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">{recipe.primaryExample.name}</h4>
                      <p className="text-sm text-muted-foreground">See how to use this recipe in practice</p>
                    </div>
                    <Badge variant="outline">Example</Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
