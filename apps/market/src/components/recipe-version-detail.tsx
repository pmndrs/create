'use client'

import { useRef } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Package, Maximize2, ExternalLink, History, PanelTop } from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'
import { RecipeWithPrimaryExample, RecipeVersionWithRequirements } from '@/types/recipe'
import { Tags } from '@/components/tags'
import { RecipeCard } from './recipe-card'

interface RecipeVersionDetailProps {
  recipe: RecipeWithPrimaryExample
  version: RecipeVersionWithRequirements
}

/**
 * Recipe Version Detail Component
 * Displays detailed information for a specific version of a recipe
 */
export function RecipeVersionDetail({ recipe, version }: RecipeVersionDetailProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const versionStatus = version.approved
    ? { label: 'Approved', variant: 'success' as const }
    : { label: 'Pending', variant: 'secondary' as const }

  const iframeUrl = `https://pub-54e2a7dbf936490fae36efbdea022cba.r2.dev/${recipe.name}/${version.version}/index.html`

  const handleFullscreen = () => {
    if (iframeRef.current) {
      iframeRef.current.requestFullscreen()
    }
  }

  const _exampleRecipes = recipe.dependentVersions?.map((dependency) => dependency.version.recipe) ?? []
  const dedupedExampleRecipes = _exampleRecipes.filter(
    (recipe, i) => _exampleRecipes?.findIndex((e) => e.name === recipe.name) === i,
  )

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {recipe.type === 'EXAMPLE' && version.approved && (
        <div className="relative">
          <div className="absolute bottom-2 right-2 z-10 flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="bg-background/50 backdrop-blur-sm hover:bg-background/70 cursor-pointer"
              onClick={handleFullscreen}
              title="Enter fullscreen"
            >
              <Maximize2 className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="bg-background/50 backdrop-blur-sm hover:bg-background/70 cursor-pointer"
              onClick={() => window.open(iframeUrl, '_blank')}
              title="Open in new tab"
            >
              <ExternalLink className="h-3 w-3" />
            </Button>
          </div>
          <iframe
            ref={iframeRef}
            src={iframeUrl}
            className="w-full h-[60vh] max-h-[60vh] border-0 bg-white"
            title="Example preview"
          />
        </div>
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

        {/* Examples (for artifact recipes) */}
        {recipe.type === 'ARTIFACT' && dedupedExampleRecipes.length > 0 && (
          <div className="flex flex-col mt-4 pt-4 gap-4 border-t">
            <span className="text-xl text-muted-foreground">Examples</span>
            <div className="flex flex-row overflow-x-auto">
              {dedupedExampleRecipes.slice(0, 5).map((recipe) => (
                <div key={recipe.id} className="max-w-[300px]">
                  <RecipeCard recipe={recipe} />
                </div>
              ))}
            </div>
          </div>
        )}
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

        {/* Versions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <History className="h-5 w-5" />
              Versions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {recipe.versions.map((v) => (
                <div key={v.id} className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-2">
                    {v.version === version.version ? (
                      <span className="font-medium">v{v.version}</span>
                    ) : (
                      <Link href={`/recipe/${recipe.name}/${v.version}`} className="font-medium hover:underline">
                        v{v.version}
                      </Link>
                    )}
                    {v.version === version.version && (
                      <Badge variant="secondary" size="sm">
                        Current
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {v.approved ? (
                      <Badge variant="default" size="sm" className="bg-green-600">
                        Approved
                      </Badge>
                    ) : (
                      <Badge variant="secondary" size="sm">
                        Pending
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(v.createdAt), 'MMM d, yyyy')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
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
    </div>
  )
}
