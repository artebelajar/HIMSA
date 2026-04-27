import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { successResponse, errorResponse, serverErrorResponse } from '@/lib/api-utils'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const searchParams = request.nextUrl.searchParams
    const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1))
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()))

    const lastDayOfMonth = new Date(year, month, 0).getDate()
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDayOfMonth).padStart(2, '0')}`

    const { data: schedule, error: scheduleError } = await supabase
      .from('welfare_daily_schedule')
      .select('*')
      .gte('schedule_date', startDate)
      .lte('schedule_date', endDate)
      .order('schedule_date', { ascending: true })

    if (scheduleError) return errorResponse(scheduleError.message, 'DB_ERROR', 500)

    const { data: kelasMembers, error: membersError } = await supabase
      .from('kelas_members')
      .select('user_id, kelas_id, nomor_absen')
      .order('created_at', { ascending: true })

    if (membersError) return errorResponse(membersError.message, 'DB_ERROR', 500)

    if (!kelasMembers || kelasMembers.length === 0) {
      return successResponse({ schedule: schedule || [], santriList: [], today: new Date().toISOString().split('T')[0] })
    }

    const userIds = [...new Set(kelasMembers.map(m => m.user_id))]
    const { data: users } = await supabase.from('users').select('id, name, email, avatar_url').in('id', userIds)

    const kelasIds = [...new Set(kelasMembers.map(m => m.kelas_id))]
    const { data: kelas } = await supabase.from('kelas').select('id, name').in('id', kelasIds)

    const santriList = kelasMembers.map(member => {
      const user = users?.find(u => u.id === member.user_id)
      const kelasData = kelas?.find(k => k.id === member.kelas_id)
      return { user_id: member.user_id, kelas_id: member.kelas_id, nomor_absen: member.nomor_absen, users: user || { id: '', name: 'Unknown', email: '', avatar_url: null }, kelas: kelasData || { id: '', name: '' } }
    })

    const sortedSantri = santriList.sort((a, b) => {
      const kelasA = parseInt(a.kelas?.name || '0')
      const kelasB = parseInt(b.kelas?.name || '0')
      if (kelasA !== kelasB) return kelasB - kelasA
      return (a.nomor_absen || 999) - (b.nomor_absen || 999)
    })

    return successResponse({ schedule: schedule || [], santriList: sortedSantri || [], today: new Date().toISOString().split('T')[0], month, year })
  } catch (error) {
    return serverErrorResponse(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const body = await request.json()
    const { action } = body

    if (action === 'generate') {
      const { data: kelasMembers } = await supabase.from('kelas_members').select('user_id, kelas_id, nomor_absen')
      if (!kelasMembers || kelasMembers.length === 0) return errorResponse('Tidak ada anggota di kelas', 'NO_MEMBERS', 400)

      const userIds = [...new Set(kelasMembers.map(m => m.user_id))]
      const { data: users } = await supabase.from('users').select('id, name').in('id', userIds)

      const kelasIds = [...new Set(kelasMembers.map(m => m.kelas_id))]
      const { data: kelas } = await supabase.from('kelas').select('id, name').in('id', kelasIds)

      const santriList = kelasMembers.map(member => {
        const user = users?.find(u => u.id === member.user_id)
        const kelasData = kelas?.find(k => k.id === member.kelas_id)
        return { user_id: member.user_id, kelas_id: member.kelas_id, nomor_absen: member.nomor_absen, users: user || { id: '', name: 'Unknown' }, kelas: kelasData || { id: '', name: '' } }
      })

      const sortedSantri = santriList.sort((a, b) => {
        const kelasA = parseInt(a.kelas?.name || '0')
        const kelasB = parseInt(b.kelas?.name || '0')
        if (kelasA !== kelasB) return kelasB - kelasA
        return (a.nomor_absen || 999) - (b.nomor_absen || 999)
      })

      const today = new Date().toISOString().split('T')[0]

      // Hapus jadwal lama
      await supabase.from('welfare_daily_schedule').delete().gte('schedule_date', today)

      const entries: any[] = []
      let currentDate = new Date(today)
      let orderIndex = 0

      for (const santri of sortedSantri) {
        while (currentDate.getDay() === 0) { currentDate.setDate(currentDate.getDate() + 1) }
        entries.push({
          schedule_date: currentDate.toISOString().split('T')[0],
          santri_id: santri.user_id, santri_name: santri.users.name,
          kelas_id: santri.kelas_id, order_index: orderIndex,
          is_active: true, completed_04: false, completed_10: false, completed_16: false,
        })
        currentDate.setDate(currentDate.getDate() + 1)
        orderIndex++
      }

      const { data, error } = await supabase.from('welfare_daily_schedule').insert(entries).select()
      if (error) return errorResponse(error.message, 'CREATE_ERROR', 500)

      return successResponse({ generated: entries.length }, `${entries.length} jadwal baru ditambahkan`)
    }

    return errorResponse('Invalid action', 'INVALID_ACTION', 400)
  } catch (error) {
    return serverErrorResponse(error)
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const body = await request.json()
    const { action } = body

    // Toggle waktu masak
    if (!action || action === 'toggle_waktu') {
      const { schedule_id, time_slot, completed } = body
      const updateField = time_slot === '04:00' ? 'completed_04' : time_slot === '10:00' ? 'completed_10' : 'completed_16'

      const { data, error } = await supabase
        .from('welfare_daily_schedule')
        .update({ [updateField]: completed })
        .eq('id', schedule_id)
        .select()
        .single()

      if (error) return errorResponse(error.message, 'UPDATE_ERROR', 500)
      return successResponse(data, 'Status updated')
    }

    // Toggle complete (pindah ke bawah)
    if (action === 'toggle_complete') {
      const { schedule_id, completed } = body

      const { data, error } = await supabase
        .from('welfare_daily_schedule')
        .update({ is_active: !completed })
        .eq('id', schedule_id)
        .select()
        .single()

      if (error) return errorResponse(error.message, 'UPDATE_ERROR', 500)

      return successResponse(data, 'Status updated')
    }

    return errorResponse('Invalid action', 'INVALID_ACTION', 400)
  } catch (error) {
    return serverErrorResponse(error)
  }
}