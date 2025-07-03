'use client'

import type { Package } from '@/lib/packages'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { GithubIcon, BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PackageCardProps {
  package: Package
  isSelected: boolean
  onToggle: () => void
}

export function PackageCard({ package: pkg, isSelected, onToggle }: PackageCardProps) {
  return (
    <Card
      className={cn(
        'cursor-pointer flex flex-col border border-white/20 bg-black/40 backdrop-blur-sm transition-all duration-300 overflow-hidden hover:shadow-[0_0_15px_rgba(255,255,255,0.1)]',
        isSelected ? 'ring-1 ring-white/70' : 'hover:border-white/40',
      )}
      onClick={onToggle}
    >
      <CardHeader className="pb-2 overflow-hidden">
        <CardTitle className="flex items-center gap-2 ">
          <div
            className={cn('shrink-0 w-3 h-3 rounded-full transition-colors', isSelected ? 'bg-white' : 'bg-white/30')}
          />
          <span className="text-xl grow truncate overflow-hidden text-ellipsis shrink basis-0 min-w-0">{pkg.name}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        <CardDescription className="text-white/70">{pkg.description}</CardDescription>
      </CardContent>
      <div className="grow"></div>
      <CardFooter className="flex gap-2 pt-0">
        <a href={pkg.docsUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            className="border-white/20 hover:bg-white/10"
            aria-label={`View ${pkg.name} documentation`}
          >
            <BookOpen className="h-4 w-4 mr-2" />
            Docs
          </Button>
        </a>
        {pkg.githubUrl != null && (
          <a href={pkg.githubUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="sm"
              className="border-white/20 hover:bg-white/10"
              aria-label={`View ${pkg.name} on GitHub`}
            >
              <GithubIcon className="h-4 w-4 mr-2" />
              GitHub
            </Button>
          </a>
        )}
      </CardFooter>
    </Card>
  )
}
