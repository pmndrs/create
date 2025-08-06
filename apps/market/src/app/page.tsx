import { Suspense } from 'react'
import { RecipeBrowser } from '@/components/recipe-browser'

interface HomePageProps {
  searchParams: Promise<{
    search?: string
    type?: string
    requirements?: string
    tags?: string
  }>
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams
  
  return (
    <div className="container mx-auto px-4 py-8">
      <Suspense fallback={<div>Loading recipes...</div>}>
        <RecipeBrowser searchParams={params} />
      </Suspense>
    </div>
  )
}
