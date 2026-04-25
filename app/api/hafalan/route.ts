import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase'
import { successResponse, errorResponse, validationErrorResponse, serverErrorResponse } from '@/lib/api-utils'

const updateHafalanSchema = z.object({
  content: z.string().min(1, 'Konten harus diisi'),
  language: z.enum(['arabic', 'english']).default('arabic'),
  user_id: z.string().uuid(),
  user_name: z.string(),
})

// Helper: Get week number
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const searchParams = request.nextUrl.searchParams
    const week = parseInt(searchParams.get('week') || String(getWeekNumber(new Date())))
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()))

    const { data, error } = await supabase
      .from('hafalan')
      .select('*')
      .eq('week_number', week)
      .eq('year', year)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) return errorResponse(error.message, 'DB_ERROR', 500)

    return successResponse(data || null)
  } catch (error) {
    return serverErrorResponse(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const body = await request.json()
    
    const validation = updateHafalanSchema.safeParse(body)
    if (!validation.success) {
      return validationErrorResponse(validation.error)
    }

    const { content, language, user_id, user_name } = validation.data
    const week = getWeekNumber(new Date())
    const year = new Date().getFullYear()

    const { data, error } = await supabase
      .from('hafalan')
      .upsert({
        content,
        language,
        week_number: week,
        year,
        created_by: user_id,
        created_by_name: user_name,
      }, {
        onConflict: 'week_number,year',
      })
      .select()
      .single()

    if (error) return errorResponse(error.message, 'CREATE_ERROR', 500)

    return successResponse(data, 'Hafalan berhasil disimpan')
  } catch (error) {
    return serverErrorResponse(error)
  }
}