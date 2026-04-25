import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { requireAdmin } from '@/lib/auth'
import { successResponse, errorResponse, serverErrorResponse, unauthorizedResponse } from '@/lib/api-utils'

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin().catch(() => null)
    if (!admin) {
      return unauthorizedResponse()
    }

    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    const search = searchParams.get('search') || ''
    const role = searchParams.get('role') || ''
    const division = searchParams.get('division') || ''

    const supabase = createAdminClient()
    
    let query = supabase
      .from('users')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1)

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`)
    }
    if (role) {
      query = query.eq('role', role)
    }
    if (division) {
      query = query.contains('divisions', [division])
    }

    const { data, error, count } = await query

    if (error) {
      return errorResponse(error.message, 'DB_ERROR', 500)
    }

    return successResponse({
      users: data,
      pagination: {
        page,
        limit,
        total: count || 0,
        hasMore: (page * limit) < (count || 0),
      },
    })
  } catch (error) {
    return serverErrorResponse(error)
  }
}