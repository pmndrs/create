'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { format } from 'date-fns'
import { AlertCircle } from 'lucide-react'

interface UnapprovedVersion {
  id: string
  version: string
  buildError: string | null
  createdAt: string
  recipe: {
    id: string
    name: string
    description: string | null
    type: 'ARTIFACT' | 'EXAMPLE'
    user: {
      name: string | null
      email: string
    }
    tags: Array<{
      tag: {
        id: string
        name: string
      }
    }>
  }
  canApprove: boolean
  unapprovedRequirements: string[]
}

export function AdminPanel() {
  const [activeTab, setActiveTab] = useState('versions')
  const [versions, setVersions] = useState<UnapprovedVersion[]>([])
  const [loading, setLoading] = useState(true)
  const [approving, setApproving] = useState<string | null>(null)

  useEffect(() => {
    fetchUnapprovedVersions()
  }, [])

  const fetchUnapprovedVersions = async () => {
    try {
      const response = await fetch('/api/admin/unapproved')
      if (!response.ok) throw new Error('Failed to fetch versions')
      const data = await response.json()
      setVersions(data.versions)
    } catch (error) {
      console.error('Error fetching unapproved versions:', error)
    } finally {
      setLoading(false)
    }
  }

  const approveVersion = async (recipeName: string, version: string) => {
    const versionKey = `${recipeName}@${version}`
    setApproving(versionKey)
    try {
      const url = `/api/recipe/${encodeURIComponent(recipeName)}/${encodeURIComponent(version)}/approve`

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to approve version')
      }

      const result = await response.json()
      console.log('Approval result:', result)

      // Refresh the list
      await fetchUnapprovedVersions()
    } catch (error) {
      console.error('Error approving version:', error)
      alert(error instanceof Error ? error.message : 'Failed to approve version')
    } finally {
      setApproving(null)
    }
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="versions">
            Unapproved Versions
            {versions.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {versions.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
        </TabsList>

        <TabsContent value="versions" className="mt-6">
          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : versions.length === 0 ? (
            <p className="text-muted-foreground">No unapproved versions</p>
          ) : (
            <div className="space-y-4">
              {versions.map((version) => (
                <Card key={version.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold">
                        {version.recipe.name} v{version.version}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        by {version.recipe.user.name || version.recipe.user.email} • Created{' '}
                        {format(new Date(version.createdAt), 'MMM d, yyyy')}
                      </p>
                      
                      <div className="flex gap-2 mt-2">
                        <Badge>{version.recipe.type}</Badge>
                        {version.recipe.tags.map((rt) => (
                          <Badge key={rt.tag.id} variant="outline">
                            {rt.tag.name}
                          </Badge>
                        ))}
                      </div>

                      {version.recipe.description && (
                        <p className="text-sm text-muted-foreground mt-2">
                          {version.recipe.description}
                        </p>
                      )}

                      {version.buildError && (
                        <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-md">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-500 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-red-800 dark:text-red-200">
                                Build Error:
                              </p>
                              <p className="text-sm text-red-700 dark:text-red-300">
                                {version.buildError}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {!version.canApprove && (
                        <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-md">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-500 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                                Cannot approve - unapproved requirements:
                              </p>
                              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                                {version.unapprovedRequirements.join(', ')}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(`/recipe/${version.recipe.name}/${version.version}`, '_blank')}
                      >
                        View Details
                      </Button>
                      <Button
                        size="sm"
                        disabled={!version.canApprove || approving === `${version.recipe.name}@${version.version}`}
                        onClick={() => approveVersion(version.recipe.name, version.version)}
                      >
                        {approving === `${version.recipe.name}@${version.version}` ? 'Approving...' : 'Approve Version'}
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="users" className="mt-6">
          <p className="text-muted-foreground">User management coming soon</p>
        </TabsContent>
      </Tabs>
    </div>
  )
}
