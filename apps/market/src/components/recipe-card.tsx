'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ImageOff } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { RecipeCard as RecipeCardType, RecipeCardWithExample } from '@/types/recipe'
import { cn } from '@/lib/utils'

type RecipeCardProps = {
  recipe: RecipeCardType | RecipeCardWithExample
}

export function RecipeCard({ recipe }: RecipeCardProps) {
  const [imageError, setImageError] = useState(false)
  //TODO: use the latest approved version or the latest version if non is approved
  const latestVersion = recipe.versions[0]
  const href = latestVersion ? `/recipe/${recipe.name}/${latestVersion.version}` : `/recipe/${recipe.name}`

  // Get example thumbnails for artifact recipes
  let exampleThumbnails: string[] = []
  if (recipe.type === 'ARTIFACT' && 'dependentVersions' in recipe && recipe.dependentVersions) {
    // Get unique approved examples (already filtered by query, dedupe by recipe name)
    const uniqueExamples = recipe.dependentVersions
      .reduce((acc, dep) => {
        if (!acc.find((e) => e.recipe.name === dep.version.recipe.name)) {
          acc.push(dep.version)
        }
        return acc
      }, [] as (typeof recipe.dependentVersions)[0]['version'][])
      .slice(0, 4) // Get first 4 examples

    // Since we don't have version info for thumbnails, use 'latest' or a default
    exampleThumbnails = uniqueExamples.map(
      (example) =>
        `https://pub-c0acfa24fbf34cd1888cde168be070d7.r2.dev/${example.recipe.name}/${example.version}/thumbnail.webp`,
    )
  }

  // For example recipes, use own thumbnail
  const thumbnailUrl =
    recipe.type === 'EXAMPLE' && latestVersion?.approved
      ? `https://pub-c0acfa24fbf34cd1888cde168be070d7.r2.dev/${recipe.name}/${latestVersion.version}/thumbnail.webp`
      : null

  return (
    <Link href={href}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full overflow-hidden">
        <div className="aspect-video bg-muted relative">
          {recipe.type === 'EXAMPLE' ? (
            // Example recipe - show single thumbnail
            thumbnailUrl && !imageError ? (
              <img
                src={thumbnailUrl}
                alt={`${recipe.name} preview`}
                className="w-full h-full object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                <ImageOff className="h-12 w-12 mb-2" />
                <p className="text-sm text-center px-4">Not approved yet</p>
              </div>
            )
          ) : // Artifact recipe - show grid of example thumbnails
          exampleThumbnails.length > 0 ? (
            <div
              className={cn(
                exampleThumbnails.length === 2 && 'grid-cols-2',
                exampleThumbnails.length === 3 && 'grid-cols-3',
                exampleThumbnails.length === 4 && 'grid-cols-2 grid-rows-2',
                'grid gap-0.5 w-full h-full',
              )}
            >
              {exampleThumbnails.map((thumb, index) => (
                <div key={index} className="relative overflow-hidden">
                  <img
                    src={thumb}
                    alt={`Example ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Hide failed images
                      ;(e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
              <ImageOff className="h-12 w-12 mb-2" />
              <p className="text-sm text-center px-4">No examples yet</p>
            </div>
          )}
        </div>
        <CardContent className="p-3">
          <div className="space-y-2">
            {/* Title */}
            <h3 className="font-medium text-sm line-clamp-2 leading-snug">{recipe.name}</h3>

            {/* Author and meta info */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{recipe.user.name || recipe.user.email}</span>
              <span>•</span>
              <span>{formatDistanceToNow(recipe.updatedAt, { addSuffix: true })}</span>
            </div>

            {/* Type badge and version */}
            <div className="flex items-center gap-2">
              <Badge variant={recipe.type === 'ARTIFACT' ? 'default' : 'secondary'} className="text-xs h-5">
                {recipe.type}
              </Badge>
              {latestVersion && <span className="text-xs text-muted-foreground">v{latestVersion.version}</span>}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
