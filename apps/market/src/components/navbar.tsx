'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import * as React from 'react'
import { useSession, signOut } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { User, Settings, LogOut, Search, Shield } from 'lucide-react'

interface UserWithAdmin {
  id: string
  email: string
  emailVerified: boolean
  name: string
  image?: string | null
  isAdmin?: boolean
  createdAt: Date
  updatedAt: Date
}

export function Navbar() {
  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState('')

  // Initialize search from params only on client side
  useEffect(() => {
    setSearch(searchParams.get('search') || '')
  }, [searchParams])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams(searchParams.toString())
    if (search.trim()) {
      params.set('search', search.trim())
    } else {
      params.delete('search')
    }
    router.push(`/?${params.toString()}`)
  }

  return (
    <nav className="border-b">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold">
          <svg xmlns="http://www.w3.org/2000/svg" width="70" height="50" fill="none" viewBox="0 0 194 50">
            <path fill="black" d="M17.5 35h15v15h-15V35zm0-17.5h15v15h-15v-15zM0 17.5h15v15H0v-15z"></path>
            <path
              fill="black"
              d="M35 0H17.5v15H35v17.5h15V0H35zM77.51 12.546V38h4.425V20.475h.236l7.035 17.45h3.306l7.035-17.413h.236V38h4.425V12.546h-5.643L91.01 30.99h-.299l-7.557-18.444h-5.642zm37.014 25.84c2.996 0 4.785-1.405 5.606-3.009h.149V38h4.325V25.223c0-5.046-4.114-6.563-7.756-6.563-4.014 0-7.097 1.79-8.091 5.27l4.201.597c.448-1.305 1.715-2.424 3.915-2.424 2.088 0 3.232 1.07 3.232 2.946v.075c0 1.292-1.355 1.354-4.723 1.715-3.704.398-7.246 1.504-7.246 5.804 0 3.754 2.746 5.742 6.388 5.742zm1.168-3.307c-1.876 0-3.219-.857-3.219-2.51 0-1.728 1.504-2.449 3.518-2.735 1.181-.161 3.542-.46 4.126-.932v2.25c0 2.125-1.715 3.927-4.425 3.927zM129.128 38h4.499V26.777c0-2.424 1.828-4.14 4.301-4.14.758 0 1.703.137 2.088.262v-4.14a10.817 10.817 0 00-1.616-.123c-2.187 0-4.014 1.243-4.71 3.455h-.199v-3.182h-4.363V38zm13.877 0h4.499v-6.413l1.641-1.753L154.987 38h5.381l-7.83-10.85 7.395-8.24h-5.257l-6.861 7.668h-.311V12.546h-4.499V38zm27.592.373c4.45 0 7.508-2.175 8.303-5.494l-4.201-.472c-.609 1.616-2.1 2.46-4.039 2.46-2.909 0-4.835-1.913-4.873-5.182h13.299v-1.38c0-6.699-4.027-9.645-8.725-9.645-5.468 0-9.036 4.015-9.036 9.906 0 5.991 3.518 9.807 9.272 9.807zm-4.797-11.72c.137-2.437 1.939-4.487 4.623-4.487 2.586 0 4.326 1.889 4.351 4.486H165.8zm26.626-7.744h-3.766v-4.574h-4.499v4.574h-2.71v3.48h2.71v10.615c-.025 3.592 2.585 5.356 5.966 5.257 1.28-.037 2.162-.286 2.647-.447l-.758-3.518a5.616 5.616 0 01-1.318.174c-1.131 0-2.038-.398-2.038-2.212v-9.869h3.766v-3.48z"
            ></path>
          </svg>
        </Link>

        <form onSubmit={handleSearch} className="flex-1 max-w-md mx-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="search"
              placeholder="Search recipes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </form>

        <div className="flex items-center gap-4">
          {session ? (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={session.user.image || ''} alt={session.user.name || ''} />
                      <AvatarFallback>
                        {session.user.name?.charAt(0) || session.user.email?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard">
                      <User className="mr-2 h-4 w-4" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  {(session.user as UserWithAdmin).isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/admin">
                          <Shield className="mr-2 h-4 w-4" />
                          Admin Panel
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut()}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/auth/signin">
                <Button>Sign In with GitHub</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
