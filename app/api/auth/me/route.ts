import { NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase'
import { successResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/api-utils'
import { getCache, setCache, CACHE_TTL } from '@/lib/redis'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return unauthorizedResponse()
    }

    // Try cache first
    const cached = await getCache(`user:${user.id}`)
    if (cached) {
      return successResponse(cached)
    }

    const supabase = createServerClient()
    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return unauthorizedResponse()
    }

    const userData = {
      id: profile.id,
      email: profile.email,
      name: profile.name,
      role: profile.role,
      divisions: profile.divisions,
      currentDivision: profile.current_division,
      avatar: profile.avatar_url,
    }

    await setCache(`user:${user.id}`, userData, {
      ttl: CACHE_TTL.USER,
      tags: [`user:${user.id}`],
    })

    return successResponse(userData)
  } catch (error) {
    return serverErrorResponse(error)
  }
}