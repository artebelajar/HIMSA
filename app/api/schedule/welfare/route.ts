import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createServerClient } from '@/lib/supabase-server'
import { successResponse, errorResponse, serverErrorResponse } from '@/lib/api-utils'

// ... ganti semua createServerClient() menjadi await createServerClient()

// Schema untuk update jadwal harian
const updateDailySchema = z.object({
  schedule_date: z.string(),
  santri_id: z.string().uuid(),
  santri_name: z.string(),
})

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const searchParams = request.nextUrl.searchParams
    const fromDate = searchParams.get('from') || new Date().toISOString().split('T')[0]
    const limit = parseInt(searchParams.get('limit') || '30')

    const { data, error } = await supabase
      .from('welfare_daily_schedule')
      .select('*')
      .gte('schedule_date', fromDate)
      .order('schedule_date', { ascending: true })
      .limit(limit)

    if (error) return errorResponse(error.message, 'DB_ERROR', 500)

    return successResponse(data || [])
  } catch (error) {
    return serverErrorResponse(error)
  }
}

// Update jadwal untuk satu hari
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const body = await request.json()
    const validation = updateDailySchema.safeParse(body)
    
    if (!validation.success) {
      return errorResponse('Invalid data', 'VALIDATION_ERROR', 400)
    }

    const { schedule_date, santri_id, santri_name } = validation.data

    const { data, error } = await supabase
      .from('welfare_daily_schedule')
      .upsert({
        schedule_date,
        santri_id,
        santri_name,
      }, { onConflict: 'schedule_date' })
      .select()
      .single()

    if (error) return errorResponse(error.message, 'UPDATE_ERROR', 500)

    return successResponse(data, 'Schedule updated')
  } catch (error) {
    return serverErrorResponse(error)
  }
}

// Update status completed
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const body = await request.json()
    const { schedule_date, time_slot, completed } = body

    const updateField = time_slot === '04:00' ? 'completed_04' : 
                        time_slot === '10:00' ? 'completed_10' : 'completed_16'

    const { data, error } = await supabase
      .from('welfare_daily_schedule')
      .update({ [updateField]: completed })
      .eq('schedule_date', schedule_date)
      .select()
      .single()

    if (error) return errorResponse(error.message, 'UPDATE_ERROR', 500)

    return successResponse(data, 'Status updated')
  } catch (error) {
    return serverErrorResponse(error)
  }
}

// Generate/Rotate jadwal (looping)
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    
    // 1. Get all santri
    const { data: santriList } = await supabase
      .from('users')
      .select('id, name')
      .eq('role', 'santri')
      .order('name', { ascending: true })

    if (!santriList || santriList.length === 0) {
      return errorResponse('No santri found', 'NO_SANTRI', 400)
    }

    // 2. Get existing schedule (yang belum lewat)
    const today = new Date().toISOString().split('T')[0]
    
    const { data: existingSchedule } = await supabase
      .from('welfare_daily_schedule')
      .select('*')
      .gte('schedule_date', today)
      .order('schedule_date', { ascending: true })

    // 3. Tentukan starting point
    let startDate = new Date()
    let santriQueue: { id: string, name: string }[] = [...santriList]
    let lastSantriId: string | null = null

    if (existingSchedule && existingSchedule.length > 0) {
      // Ambil jadwal terakhir
      const lastSchedule = existingSchedule[existingSchedule.length - 1]
      startDate = new Date(lastSchedule.schedule_date)
      startDate.setDate(startDate.getDate() + 1)
      lastSantriId = lastSchedule.santri_id

      // Rotasi santri: mulai dari santri setelah yang terakhir
      const lastIndex = santriList.findIndex(s => s.id === lastSantriId)
      if (lastIndex !== -1) {
        santriQueue = [
          ...santriList.slice(lastIndex + 1),
          ...santriList.slice(0, lastIndex + 1)
        ]
      }
    }

    // 4. Hapus jadwal lama yang belum dikerjakan? (opsional - kita akan upsert)
    
    // 5. Generate jadwal baru (jumlah = jumlah santri)
    const newEntries: any[] = []
    let currentDate = new Date(startDate)
    let santriIndex = 0

    for (let i = 0; i < santriList.length; i++) {
      // Skip hari Minggu
      while (currentDate.getDay() === 0) {
        currentDate.setDate(currentDate.getDate() + 1)
      }

      const santri = santriQueue[santriIndex % santriQueue.length]
      
      newEntries.push({
        schedule_date: currentDate.toISOString().split('T')[0],
        santri_id: santri.id,
        santri_name: santri.name,
        completed_04: false,
        completed_10: false,
        completed_16: false,
      })

      currentDate.setDate(currentDate.getDate() + 1)
      santriIndex++
    }

    // 6. Simpan ke database (upsert)
    const { data, error } = await supabase
      .from('welfare_daily_schedule')
      .upsert(newEntries, { onConflict: 'schedule_date' })
      .select()
      .order('schedule_date', { ascending: true })

    if (error) return errorResponse(error.message, 'GENERATE_ERROR', 500)

    return successResponse({
      generated: newEntries.length,
      santri_count: santriList.length,
      schedule: data,
    }, 'Schedule rotated successfully')
  } catch (error) {
    return serverErrorResponse(error)
  }
}

// Delete old schedule (optional)
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const searchParams = request.nextUrl.searchParams
    const beforeDate = searchParams.get('before') || new Date().toISOString().split('T')[0]

    const { error } = await supabase
      .from('welfare_daily_schedule')
      .delete()
      .lt('schedule_date', beforeDate)

    if (error) return errorResponse(error.message, 'DELETE_ERROR', 500)

    return successResponse(null, 'Old schedules deleted')
  } catch (error) {
    return serverErrorResponse(error)
  }
}