export interface CustomUser {
  id: string
  email: string
  emailVerified: boolean
  name: string
  image?: string | null
  isAdmin: boolean
  createdAt: Date
  updatedAt: Date
}

export interface CustomSession {
  user: CustomUser
  session: {
    id: string
    userId: string
    expiresAt: Date
    token: string
    ipAddress?: string
    userAgent?: string
    createdAt: Date
    updatedAt: Date
  }
}