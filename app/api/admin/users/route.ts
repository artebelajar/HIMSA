import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase'
import { successResponse, errorResponse, validationErrorResponse, serverErrorResponse } from '@/lib/api-utils'
import { getDivisionNames } from '@/lib/divisions'

const updateUserSchema = z.object({
  userId: z.string().uuid(),
  divisions: z.array(z.string()),
  role: z.enum(['user', 'admin', 'division', 'santri']),
})

export async function GET(request: NextRequest) {
  try {
    // Gunakan Admin Client - BYPASS AUTH
    const supabase = createAdminClient()
    
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''

    let query = supabase
      .from('users')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1)

    if (search) {
      query = query.ilike('name', `%${search}%`)
    }

    const { data, error, count } = await query

    if (error) return errorResponse(error.message, 'DB_ERROR', 500)

    return successResponse({
      users: data || [],
      total: count || 0,
      page,
      limit,
    })
  } catch (error) {
    return serverErrorResponse(error)
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Gunakan Admin Client - BYPASS AUTH
    const supabase = createAdminClient()

    const body = await request.json()
    
    // Dapatkan semua divisi yang valid dari database
    const validDivisions = await getDivisionNames()
    
    // Update schema dengan validasi dinamis
    const dynamicSchema = z.object({
      userId: z.string().uuid(),
      divisions: z.array(z.string().refine(val => validDivisions.includes(val), {
        message: 'Divisi tidak valid',
      })),
      role: z.enum(['user', 'admin', 'division', 'santri']),
    })
    
    const validation = dynamicSchema.safeParse(body)
    
    if (!validation.success) {
      return validationErrorResponse(validation.error)
    }

    const { userId, divisions, role } = validation.data

    const updates: any = { 
      divisions,
      role,
      current_division: divisions.length > 0 ? divisions[0] : null,
      updated_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      console.error('Update error:', error)
      return errorResponse(error.message, 'UPDATE_ERROR', 500)
    }

    return successResponse(data, 'User updated successfully')
  } catch (error) {
    return serverErrorResponse(error)
  }
}