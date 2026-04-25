import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@/lib/supabase'
import { successResponse, serverErrorResponse } from '@/lib/api-utils'
import { getCurrentUser } from '@/lib/auth'
import { invalidateCache } from '@/lib/redis'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (user) {
      await invalidateCache(`user:${user.id}`)
    }

    const supabase = createServerClient()
    await supabase.auth.signOut()

    const cookieStore = await cookies()
    cookieStore.delete('auth-token')

    return successResponse(null, 'Logout successful')
  } catch (error) {
    return serverErrorResponse(error)
  }
}