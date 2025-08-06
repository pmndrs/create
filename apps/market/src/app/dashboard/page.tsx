import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { UserRecipeVersions } from '@/components/user-recipe-versions'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (!session) {
    redirect('/auth/signin')
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">User Recipes</h1>
        <p className="text-muted-foreground">
          Manage your recipe versions
        </p>
      </div>
      
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Recipe Versions</h2>
        
        <Suspense fallback={<div>Loading recipe versions...</div>}>
          <UserRecipeVersions userId={session.user.id} />
        </Suspense>
      </div>
    </div>
  )
}