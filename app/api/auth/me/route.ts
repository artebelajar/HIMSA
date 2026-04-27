import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { successResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/api-utils'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    
    // Get user dari header atau query
    const userId = request.headers.get('x-user-id') || 
                   new URL(request.url).searchParams.get('userId')

    if (!userId) {
      return unauthorizedResponse()
    }

    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (!profile) {
      return unauthorizedResponse()
    }

    return successResponse({
      id: profile.id,
      email: profile.email,
      name: profile.name,
      role: profile.role,
      divisions: profile.divisions,
      currentDivision: profile.current_division,
      avatar: profile.avatar_url,
    })
  } catch (error) {
    return serverErrorResponse(error)
  }
}