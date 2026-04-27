import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { successResponse, errorResponse } from '@/lib/api-utils'

export async function POST(request: NextRequest) {
  try {
    // Ini akan dipanggil oleh cron job atau scheduler
    const supabase = createAdminClient()
    const body = await request.json()
    const { time } = body // '04:00', '10:00', '16:00'

    const today = new Date().toISOString().split('T')[0]
    
    const { data: schedule } = await supabase
      .from('welfare_daily_schedule')
      .select('*')
      .eq('schedule_date', today)
      .eq('is_active', true)
      .single()

    if (schedule) {
      // Kirim notifikasi ke user yang bertugas
      // Ini bisa diintegrasikan dengan Firebase Cloud Messaging
      return successResponse({ message: 'Notifikasi dikirim', santri: schedule.santri_name })
    }

    return successResponse({ message: 'Tidak ada jadwal' })
  } catch (error) {
    return errorResponse('Gagal mengirim notifikasi', 'NOTIFY_ERROR')
  }
}