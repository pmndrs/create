'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Copy, Key, Eye, EyeOff } from 'lucide-react'

interface UserApiKeyProps {
  initialApiKey: string
}

export function UserApiKey({ initialApiKey }: UserApiKeyProps) {
  const [apiKey, setApiKey] = useState(initialApiKey)
  const [showApiKey, setShowApiKey] = useState(false)
  const [regenerating, setRegenerating] = useState(false)

  const regenerateApiKey = async () => {
    setRegenerating(true)
    try {
      const response = await fetch('/api/users/api-key/regenerate', {
        method: 'POST'
      })
      
      if (response.ok) {
        const data = await response.json()
        setApiKey(data.apiKey)
      }
    } catch (error) {
      console.error('Error regenerating API key:', error)
    } finally {
      setRegenerating(false)
    }
  }

  const copyApiKey = () => {
    navigator.clipboard.writeText(apiKey)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          API Key
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            type={showApiKey ? 'text' : 'password'}
            value={apiKey}
            readOnly
            className="font-mono"
          />
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowApiKey(!showApiKey)}
          >
            {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={copyApiKey}
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex items-center justify-between">
          <Badge variant="outline">Keep this secret</Badge>
          <Button 
            variant="outline" 
            onClick={regenerateApiKey}
            disabled={regenerating}
            size="sm"
          >
            {regenerating ? 'Regenerating...' : 'Regenerate'}
          </Button>
        </div>
        
        <div className="text-sm text-muted-foreground space-y-2">
          <p>Use this API key to upload recipes:</p>
          <pre className="bg-muted p-2 rounded text-xs overflow-x-auto">
{`curl -X POST ${window.location.origin}/api/recipes \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ${showApiKey ? apiKey : '••••••••••••••••••••••••••••••••••••••••'}" \\
  -d @recipe.json`}
          </pre>
        </div>
      </CardContent>
    </Card>
  )
}