import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { UserRecipeVersions } from '@/components/user-recipe-versions'
import { UserApiKey } from '@/components/user-api-key'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (!session) {
    redirect('/auth/signin')
  }

  // Server-side fetch of user's API key
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { apiKey: true }
  })

  if (!user) {
    redirect('/auth/signin')
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Manage your recipes and API key
        </p>
      </div>
      
      <Tabs defaultValue="recipes" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="recipes">My Recipe Versions</TabsTrigger>
          <TabsTrigger value="api">API Key</TabsTrigger>
        </TabsList>
        
        <TabsContent value="recipes" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Recipe Versions</h2>
          </div>
          
          <Suspense fallback={<div>Loading recipe versions...</div>}>
            <UserRecipeVersions userId={session.user.id} />
          </Suspense>
        </TabsContent>
        
        <TabsContent value="api" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">API Access</h2>
          </div>
          
          <UserApiKey initialApiKey={user.apiKey} />
        </TabsContent>
      </Tabs>
    </div>
  )
}