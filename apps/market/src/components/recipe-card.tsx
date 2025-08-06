'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ImageOff } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { RecipeCard as RecipeCardType, RecipeCardWithExample } from '@/types/recipe'

type RecipeCardProps = {
  recipe: RecipeCardType | RecipeCardWithExample
}

export function RecipeCard({ recipe }: RecipeCardProps) {
  const [imageError, setImageError] = useState(false)
  //TODO: use the latest approved version or the latest version if non is approved
  const latestVersion = recipe.versions[0]
  const href = latestVersion ? `/recipe/${recipe.name}/${latestVersion.version}` : `/recipe/${recipe.name}`

  // Determine thumbnail URL
  let thumbnailUrl: string | null = null
  if (recipe.type === 'EXAMPLE' && latestVersion?.approved) {
    thumbnailUrl = `https://pub-c0acfa24fbf34cd1888cde168be070d7.r2.dev/${recipe.name}/${latestVersion.version}/thumbnail.webp`
  } else if (
    recipe.type === 'ARTIFACT' &&
    'primaryExample' in recipe &&
    recipe.primaryExample?.versions?.[0]?.approved
  ) {
    // For artifacts, use the thumbnail of the primary example
    thumbnailUrl = `https://pub-c0acfa24fbf34cd1888cde168be070d7.r2.dev/${recipe.primaryExample.name}/${recipe.primaryExample.versions[0].version}/thumbnail.webp`
  }

  return (
    <Link href={href}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full overflow-hidden">
        <div className="aspect-video bg-muted relative">
          {thumbnailUrl && !imageError ? (
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
              <p className="text-sm text-center px-4">
                {recipe.type === 'EXAMPLE' ? 'Not approved yet' : 'No approved primary example'}
              </p>
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
