'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { signIn } from '@/lib/auth-client'
import { Github } from 'lucide-react'

export default function SignInPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleGitHubSignIn = async () => {
    setLoading(true)
    setError('')

    try {
      await signIn.social({
        provider: 'github',
        callbackURL: '/dashboard'
      })
    } catch {
      setError('Failed to sign in with GitHub. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-16 max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>Sign In</CardTitle>
          <CardDescription>
            Sign in to your pmndrs Market account with GitHub
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {error && (
              <div className="text-sm text-red-600 p-3 bg-red-50 dark:bg-red-900/20 rounded-md">
                {error}
              </div>
            )}
            <Button 
              onClick={handleGitHubSignIn} 
              className="w-full" 
              disabled={loading}
              variant="outline"
            >
              <Github className="mr-2 h-4 w-4" />
              {loading ? 'Signing in...' : 'Continue with GitHub'}
            </Button>
          </div>
          <div className="mt-6 text-center text-sm text-muted-foreground">
            By signing in, you agree to our terms of service and privacy policy.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}