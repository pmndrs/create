'use client'

import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { RecipeTag } from '@/types/recipe'

interface TagsProps {
  tags: RecipeTag[]
  className?: string
  clickable?: boolean
}

export function Tags({ tags, className = '', clickable = true }: TagsProps) {
  if (!tags || tags.length === 0) {
    return null
  }

  return (
    <div className={`flex flex-wrap gap-1 ${className}`}>
      {tags.map((recipeTag) => {
        const badgeElement = (
          <Badge 
            variant="secondary" 
            className={clickable ? "cursor-pointer hover:bg-secondary/80" : ""}
          >
            {recipeTag.tag.name}
          </Badge>
        )
        
        return clickable ? (
          <Link
            key={recipeTag.tagId}
            href={`/?tags=${encodeURIComponent(recipeTag.tag.name)}`}
          >
            {badgeElement}
          </Link>
        ) : (
          <span key={recipeTag.tagId}>
            {badgeElement}
          </span>
        )
      })}
    </div>
  )
}