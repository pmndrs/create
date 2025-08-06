import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'
import { nanoid } from 'nanoid'

export async function POST() {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Generate new API key
    const newApiKey = `pmndrs_${nanoid(32)}`

    // Update user's API key
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { apiKey: newApiKey },
      select: { apiKey: true }
    })

    return NextResponse.json({
      apiKey: updatedUser.apiKey
    })

  } catch (error) {
    console.error('API key regeneration error:', error)
    return NextResponse.json(
      { error: 'Failed to regenerate API key' },
      { status: 500 }
    )
  }
}