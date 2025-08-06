'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Copy, Eye, EyeOff, Key, RefreshCw, User, Shield, Bell, Palette, Github } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface UserProfile {
  id: string
  name: string | null
  email: string
  image: string | null
  isAdmin: boolean
  apiKey: string
  emailVerified: boolean
  createdAt: string
  updatedAt: string
}

interface NotificationSettings {
  emailNotifications: boolean
  pushNotifications: boolean
  recipeApprovals: boolean
  newDependents: boolean
  securityAlerts: boolean
}

interface DisplaySettings {
  theme: 'light' | 'dark' | 'system'
  compactMode: boolean
}

export function UserSettings() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)
  const [regeneratingKey, setRegeneratingKey] = useState(false)

  // Form states
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [notifications, setNotifications] = useState<NotificationSettings>({
    emailNotifications: true,
    pushNotifications: false,
    recipeApprovals: true,
    newDependents: true,
    securityAlerts: true,
  })
  const [display, setDisplay] = useState<DisplaySettings>({
    theme: 'system',
    compactMode: false,
  })

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/users/profile')
      if (!response.ok) throw new Error('Failed to fetch profile')
      const data = await response.json()
      setProfile(data)
      setDisplayName(data.name || '')
      // Load saved settings from localStorage or API
      loadSettings()
    } catch (error) {
      console.error('Error fetching profile:', error)
      toast({
        title: 'Error',
        description: 'Failed to load profile settings',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    if (session?.user) {
      fetchProfile()
    }
  }, [session, fetchProfile])

  const loadSettings = () => {
    // Load from localStorage or API
    const savedNotifications = localStorage.getItem('notificationSettings')
    const savedDisplay = localStorage.getItem('displaySettings')

    if (savedNotifications) {
      setNotifications(JSON.parse(savedNotifications))
    }
    if (savedDisplay) {
      setDisplay(JSON.parse(savedDisplay))
    }
  }

  const saveProfile = async () => {
    try {
      setSaving(true)
      const response = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: displayName || null,
          bio,
        }),
      })

      if (!response.ok) throw new Error('Failed to save profile')

      toast({
        title: 'Success',
        description: 'Profile updated successfully',
      })

      fetchProfile() // Refresh profile data
    } catch (error) {
      console.error('Error saving profile:', error)
      toast({
        title: 'Error',
        description: 'Failed to save profile',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const saveNotifications = () => {
    localStorage.setItem('notificationSettings', JSON.stringify(notifications))
    toast({
      title: 'Success',
      description: 'Notification preferences saved',
    })
  }

  const saveDisplay = () => {
    localStorage.setItem('displaySettings', JSON.stringify(display))
    // Apply theme changes
    if (display.theme !== 'system') {
      document.documentElement.classList.toggle('dark', display.theme === 'dark')
    } else {
      // System theme logic
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      document.documentElement.classList.toggle('dark', systemDark)
    }

    toast({
      title: 'Success',
      description: 'Display preferences saved',
    })
  }

  const copyApiKey = async () => {
    if (profile?.apiKey) {
      await navigator.clipboard.writeText(profile.apiKey)
      toast({
        title: 'Success',
        description: 'API key copied to clipboard',
      })
    }
  }

  const regenerateApiKey = async () => {
    try {
      setRegeneratingKey(true)
      const response = await fetch('/api/users/api-key/regenerate', {
        method: 'POST',
      })

      if (!response.ok) throw new Error('Failed to regenerate API key')

      const data = await response.json()
      setProfile((prev) => (prev ? { ...prev, apiKey: data.apiKey } : null))

      toast({
        title: 'Success',
        description: 'API key regenerated successfully',
      })
    } catch (error) {
      console.error('Error regenerating API key:', error)
      toast({
        title: 'Error',
        description: 'Failed to regenerate API key',
        variant: 'destructive',
      })
    } finally {
      setRegeneratingKey(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading settings...</p>
        </div>
      </div>
    )
  }

  if (!session || !profile) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <p>Please sign in to access settings</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account and preferences</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="api" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            API Access
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your profile information and GitHub account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={profile.image || ''} alt={profile.name || 'User'} />
                  <AvatarFallback className="text-xl">
                    {profile.name?.charAt(0) || profile.email.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Github className="h-3 w-3" />
                      GitHub
                    </Badge>
                    {profile.isAdmin && (
                      <Badge variant="default" className="flex items-center gap-1">
                        <Shield className="h-3 w-3" />
                        Admin
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">Connected via GitHub OAuth</p>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Enter your display name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" value={profile.email} disabled className="bg-muted" />
                  <p className="text-xs text-muted-foreground">Email cannot be changed (managed by GitHub)</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us about yourself..."
                  rows={3}
                />
              </div>

              <div className="flex items-center justify-between pt-4">
                <div className="text-sm text-muted-foreground">
                  Member since {new Date(profile.createdAt).toLocaleDateString()}
                </div>
                <Button onClick={saveProfile} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>API Access</CardTitle>
              <CardDescription>Manage your API key for uploading recipes and accessing the API</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="apiKey">API Key</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="apiKey"
                      type={showApiKey ? 'text' : 'password'}
                      value={profile.apiKey}
                      readOnly
                      className="font-mono"
                    />
                    <Button variant="outline" size="icon" onClick={() => setShowApiKey(!showApiKey)}>
                      {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button variant="outline" size="icon" onClick={copyApiKey}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Usage Example</h4>
                  <pre className="text-sm overflow-x-auto">
                    {`curl -X POST https://market.pmndrs.com/api/recipes \\
  -H "x-api-key: ${showApiKey ? profile.apiKey : '••••••••••••••••'}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "my-recipe",
    "type": "ARTIFACT",
    "version": "1.0.0",
    "edits": {...}
  }'`}
                  </pre>
                </div>

                <div className="flex gap-2">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" className="flex items-center gap-2">
                        <RefreshCw className="h-4 w-4" />
                        Regenerate Key
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Regenerate API Key</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will generate a new API key and invalidate the current one. You&apos;ll need to update
                          any scripts or applications using the old key.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={regenerateApiKey} disabled={regeneratingKey}>
                          {regeneratingKey ? 'Regenerating...' : 'Regenerate'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
