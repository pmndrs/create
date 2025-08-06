'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { X } from 'lucide-react'

const RECIPE_CATEGORIES = [
  'artifact',
  'example',
  'library',
  'tool',
  'template',
  'extension',
  'hosting'
]

const RECIPE_TYPES = [
  { value: 'all', label: 'All Types' },
  { value: 'ARTIFACT', label: 'Artifacts' },
  { value: 'EXAMPLE', label: 'Examples' }
]

export function RecipeFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [category, setCategory] = useState(searchParams.get('category') || 'all')
  const [type, setType] = useState(searchParams.get('type') || 'all')
  const [dependencies, setDependencies] = useState(
    searchParams.get('dependencies')?.split(',').filter(Boolean) || []
  )
  const [newDependency, setNewDependency] = useState('')
  const [tags, setTags] = useState(
    searchParams.get('tags')?.split(',').filter(Boolean) || []
  )
  const [availableTags, setAvailableTags] = useState<Array<{id: string, name: string, _count: {recipes: number}}>>([])

  useEffect(() => {
    fetch('/api/tags')
      .then(res => res.json())
      .then(data => setAvailableTags(data))
      .catch(console.error)
  }, [])

  const updateFilters = () => {
    const params = new URLSearchParams()
    
    if (search) params.set('search', search)
    if (category !== 'all') params.set('category', category)
    if (type !== 'all') params.set('type', type)
    if (dependencies.length > 0) params.set('dependencies', dependencies.join(','))
    if (tags.length > 0) params.set('tags', tags.join(','))
    
    router.push(`/?${params.toString()}`)
  }

  const addDependency = () => {
    if (newDependency && !dependencies.includes(newDependency)) {
      setDependencies([...dependencies, newDependency])
      setNewDependency('')
    }
  }

  const removeDependency = (dep: string) => {
    setDependencies(dependencies.filter(d => d !== dep))
  }

  const toggleTag = (tagName: string) => {
    if (tags.includes(tagName)) {
      setTags(tags.filter(t => t !== tagName))
    } else {
      setTags([...tags, tagName])
    }
  }

  const clearFilters = () => {
    setSearch('')
    setCategory('all')
    setType('all')
    setDependencies([])
    setTags([])
    router.push('/')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Filters</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Search</label>
          <Input
            placeholder="Search recipes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && updateFilters()}
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Type</label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RECIPE_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Category</label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {RECIPE_CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Dependencies</label>
          <div className="flex gap-2 mb-2">
            <Input
              placeholder="Add dependency..."
              value={newDependency}
              onChange={(e) => setNewDependency(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addDependency()}
            />
            <Button size="sm" onClick={addDependency}>Add</Button>
          </div>
          <div className="flex flex-wrap gap-1">
            {dependencies.map((dep) => (
              <Badge key={dep} variant="secondary" className="flex items-center gap-1">
                {dep}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => removeDependency(dep)}
                />
              </Badge>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Tags</label>
          <div className="flex flex-wrap gap-1">
            {availableTags.map((tag) => (
              <Badge 
                key={tag.id} 
                variant={tags.includes(tag.name) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => toggleTag(tag.name)}
              >
                {tag.name} ({tag._count.recipes})
              </Badge>
            ))}
          </div>
        </div>

        <div className="flex gap-2 pt-4">
          <Button onClick={updateFilters} className="flex-1">
            Apply Filters
          </Button>
          <Button variant="outline" onClick={clearFilters}>
            Clear
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}