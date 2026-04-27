import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase'
import { successResponse, errorResponse, validationErrorResponse, serverErrorResponse } from '@/lib/api-utils'

const createAgendaSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  agenda_date: z.string(),
  time_slot: z.string(),
  visibility: z.enum(['public', 'private']).default('private'),
  user_id: z.string().uuid(),
  user_name: z.string(),
  user_role: z.string(),
  user_division: z.string().nullable().optional(),
})

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const searchParams = request.nextUrl.searchParams
    const fromDate = searchParams.get('from') || new Date().toISOString().split('T')[0]
    const toDate = searchParams.get('to')

    let query = supabase
      .from('agendas')
      .select('*')
      .gte('agenda_date', fromDate)
      .order('agenda_date', { ascending: true })
      .order('time_slot', { ascending: true })

    if (toDate) {
      query = query.lte('agenda_date', toDate)
    }

    const { data, error } = await query

    if (error) return errorResponse(error.message, 'DB_ERROR', 500)

    return successResponse(data || [])
  } catch (error) {
    return serverErrorResponse(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const body = await request.json()
    
    const validation = createAgendaSchema.safeParse(body)
    
    if (!validation.success) {
      console.error('Validation error:', validation.error)
      return validationErrorResponse(validation.error)
    }

    const { title, agenda_date, time_slot, visibility, user_id, user_name, user_role, user_division } = validation.data

    // User/santri hanya bisa buat private agenda
    let finalVisibility = visibility
    if (user_role === 'user' || user_role === 'santri') {
      finalVisibility = 'private'
    }

    console.log('Creating agenda:', { title, agenda_date, time_slot, visibility: finalVisibility, user_name })

    const { data, error } = await supabase
      .from('agendas')
      .insert([{
        title,
        agenda_date,
        time_slot,
        visibility: finalVisibility,
        created_by: user_id,
        created_by_name: user_name,
        created_by_role: user_role,
        created_by_division: user_division || null,
      }])
      .select()
      .single()

    if (error) {
      console.error('Insert error:', error)
      return errorResponse(error.message, 'CREATE_ERROR', 500)
    }

    return successResponse(data, 'Agenda created', 201)
  } catch (error) {
    console.error('Server error:', error)
    return serverErrorResponse(error)
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    
    const searchParams = request.nextUrl.searchParams
    const agendaId = searchParams.get('id')
    const userId = searchParams.get('userId')
    const userRole = searchParams.get('userRole')

    if (!agendaId) {
      return errorResponse('Agenda ID required', 'MISSING_ID', 400)
    }

    // Get agenda detail
    const { data: agenda } = await supabase
      .from('agendas')
      .select('*')
      .eq('id', agendaId)
      .single()

    if (!agenda) {
      return errorResponse('Agenda not found', 'NOT_FOUND', 404)
    }

    // Check permission
    const canDelete = 
      (agenda.visibility === 'private' && agenda.created_by === userId) ||
      userRole === 'admin' ||
      userRole === 'division'

    if (!canDelete) {
      return errorResponse('Cannot delete this agenda', 'FORBIDDEN', 403)
    }

    const { error } = await supabase
      .from('agendas')
      .delete()
      .eq('id', agendaId)

    if (error) return errorResponse(error.message, 'DELETE_ERROR', 500)

    return successResponse(null, 'Agenda deleted')
  } catch (error) {
    return serverErrorResponse(error)
  }
}