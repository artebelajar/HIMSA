import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { successResponse } from '@/lib/api-utils'

export async function GET(request: NextRequest) {
  const supabase = createAdminClient()
  const now = new Date()
  const hour = now.getHours()
  const today = now.toISOString().split('T')[0]
  
  const mealTimes = [4, 10, 16]
  
  if (mealTimes.includes(hour)) {
    const { data: schedule } = await supabase
      .from('welfare_daily_schedule')
      .select('*')
      .eq('schedule_date', today)
      .eq('is_active', true)
      .maybeSingle()

    if (schedule) {
      // Kirim push notification ke user
      // (perlu implementasi web-push)
      console.log('Notifikasi dikirim ke:', schedule.santri_name)
    }
  }

  return successResponse({ ok: true })
}