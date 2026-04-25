import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createServerClient } from '@/lib/supabase'
import { requireAuth, canEditSecurity } from '@/lib/auth'
import { successResponse, errorResponse, validationErrorResponse, serverErrorResponse, unauthorizedResponse, forbiddenResponse } from '@/lib/api-utils'
import { getCache, setCache, CACHE_TTL, invalidateCache } from '@/lib/redis'

const updateSecuritySchema = z.object({
  schedule_date: z.string(),
  group_number: z.number().int().min(1).max(7),
  members: z.array(z.string()).length(3),
})

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const fromDate = searchParams.get('from') || new Date().toISOString().split('T')[0]
    const toDate = searchParams.get('to') || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    const cacheKey = `security:${fromDate}:${toDate}`
    
    const cached = await getCache(cacheKey)
    if (cached) {
      return successResponse(cached)
    }

    const supabase = await createServerClient()
    
    const { data, error } = await supabase
      .from('security_shifts')
      .select('*')
      .gte('schedule_date', fromDate)
      .lte('schedule_date', toDate)
      .order('schedule_date', { ascending: true })
      .order('group_number', { ascending: true })

    if (error) {
      return errorResponse(error.message, 'DB_ERROR', 500)
    }

    await setCache(cacheKey, data, {
      ttl: CACHE_TTL.SCHEDULE,
      tags: ['security-schedule'],
    })

    return successResponse(data)
  } catch (error) {
    return serverErrorResponse(error)
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth().catch(() => null)
    if (!user) {
      return unauthorizedResponse()
    }

    if (!canEditSecurity(user)) {
      return forbiddenResponse('Only Admin or Keamanan division can edit security schedule')
    }

    const body = await request.json()
    const validation = updateSecuritySchema.safeParse(body)
    
    if (!validation.success) {
      return validationErrorResponse(validation.error)
    }

    const { schedule_date, group_number, members } = validation.data

    const supabase = await createServerClient()
    
    const { data, error } = await supabase
      .from('security_shifts')
      .upsert({
        schedule_date,
        group_number,
        members,
        created_by: user.id,
      }, {
        onConflict: 'schedule_date,group_number',
      })
      .select()
      .single()

    if (error) {
      return errorResponse(error.message, 'UPDATE_ERROR', 500)
    }

    await invalidateCache('security-schedule')

    return successResponse(data, 'Security schedule updated')
  } catch (error) {
    return serverErrorResponse(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth().catch(() => null)
    if (!user) {
      return unauthorizedResponse()
    }

    if (!canEditSecurity(user)) {
      return forbiddenResponse('Only Admin or Keamanan division can create security schedule')
    }

    const body = await request.json()
    
    const supabase = createServerClient()
    
    const { data, error } = await supabase
      .from('security_shifts')
      .insert([{ ...body, created_by: user.id }])
      .select()
      .single()

    if (error) {
      return errorResponse(error.message, 'CREATE_ERROR', 500)
    }

    await invalidateCache('security-schedule')

    return successResponse(data, 'Security shift created', 201)
  } catch (error) {
    return serverErrorResponse(error)
  }
}