import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { successResponse, errorResponse, serverErrorResponse } from '@/lib/api-utils'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type') || 'all'
    const limit = parseInt(searchParams.get('limit') || '30')

    const today = new Date().toISOString().split('T')[0]
    
    let scheduleQuery = supabase
      .from('dakwah_schedule')
      .select('*')
      .gte('schedule_date', today)
      .order('schedule_date', { ascending: true })
      .order('type', { ascending: true })
      .limit(limit)

    if (type !== 'all') {
      scheduleQuery = scheduleQuery.eq('type', type)
    }

    const { data: schedule, error: scheduleError } = await scheduleQuery
    if (scheduleError) return errorResponse(scheduleError.message, 'DB_ERROR', 500)

    const { data: disabled, error: disabledError } = await supabase
      .from('dakwah_disabled')
      .select('*')
    if (disabledError) return errorResponse(disabledError.message, 'DB_ERROR', 500)

    const { data: kelasMembers, error: membersError } = await supabase
      .from('kelas_members')
      .select('user_id, kelas_id, nomor_absen')
    if (membersError) return errorResponse(membersError.message, 'DB_ERROR', 500)

    if (!kelasMembers || kelasMembers.length === 0) {
      return successResponse({
        schedule: schedule || [],
        disabled: disabled || [],
        eligible: { imam: [], muadzin: [], kultum: [] },
        allSantri: { imam: [], muadzin: [], kultum: [] },
        disabledIds: { imam: [], muadzin: [], kultum: [] },
        today,
      })
    }

    const userIds = [...new Set(kelasMembers.map(m => m.user_id))]
    const { data: users } = await supabase
      .from('users')
      .select('id, name, avatar_url')
      .in('id', userIds)

    const kelasIds = [...new Set(kelasMembers.map(m => m.kelas_id))]
    const { data: kelas } = await supabase
      .from('kelas')
      .select('id, name')
      .in('id', kelasIds)

    const enrichedMembers = kelasMembers.map(member => {
      const user = users?.find(u => u.id === member.user_id)
      const kelasData = kelas?.find(k => k.id === member.kelas_id)
      return {
        user_id: member.user_id,
        kelas_id: member.kelas_id,
        nomor_absen: member.nomor_absen,
        users: user || { id: '', name: '', avatar_url: null },
        kelas: kelasData || { id: '', name: '' },
      }
    })

    const disabledImamIds = disabled?.filter(d => d.type === 'imam').map(d => d.santri_id) || []
    const disabledMuadzinIds = disabled?.filter(d => d.type === 'muadzin').map(d => d.santri_id) || []
    const disabledKultumIds = disabled?.filter(d => d.type === 'kultum').map(d => d.santri_id) || []

    const allImam = enrichedMembers
      .filter(m => {
        const kelasName = m.kelas?.name || ''
        return (kelasName === '11' || kelasName === '12')
      })
      .sort((a, b) => {
        const kelasA = parseInt(a.kelas?.name || '0')
        const kelasB = parseInt(b.kelas?.name || '0')
        if (kelasA !== kelasB) return kelasA - kelasB
        return (a.nomor_absen || 999) - (b.nomor_absen || 999)
      })

    const allMuadzin = enrichedMembers
      .filter(m => (m.kelas?.name || '') === '10')
      .sort((a, b) => (a.nomor_absen || 999) - (b.nomor_absen || 999))

    const allKultum = enrichedMembers
      .sort((a, b) => {
        const kelasA = parseInt(a.kelas?.name || '0')
        const kelasB = parseInt(b.kelas?.name || '0')
        if (kelasA !== kelasB) return kelasB - kelasA
        return (a.nomor_absen || 999) - (b.nomor_absen || 999)
      })

    const eligibleImam = allImam.filter(m => !disabledImamIds.includes(m.user_id))
    const eligibleMuadzin = allMuadzin.filter(m => !disabledMuadzinIds.includes(m.user_id))
    const eligibleKultum = allKultum.filter(m => !disabledKultumIds.includes(m.user_id))

    return successResponse({
      schedule: schedule || [],
      disabled: disabled || [],
      eligible: { imam: eligibleImam, muadzin: eligibleMuadzin, kultum: eligibleKultum },
      allSantri: { imam: allImam, muadzin: allMuadzin, kultum: allKultum },
      disabledIds: { imam: disabledImamIds, muadzin: disabledMuadzinIds, kultum: disabledKultumIds },
      today,
    })
  } catch (error) {
    console.error('GET error:', error)
    return serverErrorResponse(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const body = await request.json()
    const { action } = body

    if (action === 'generate') {
      const { type } = body
      await generateScheduleForType(supabase, type)
      return successResponse(null, `Jadwal ${type} berhasil dibuat`)
    }

    if (action === 'disable') {
      const { santri_id, type } = body
      const { data, error } = await supabase
        .from('dakwah_disabled')
        .insert([{ santri_id, type }])
        .select()
        .single()

      if (error) {
        if (error.code === '23505') return errorResponse('Santri sudah dinonaktifkan', 'ALREADY_DISABLED', 400)
        return errorResponse(error.message, 'DISABLE_ERROR', 500)
      }
      return successResponse(data, 'Santri dinonaktifkan')
    }

    if (action === 'enable') {
      const { santri_id, type } = body
      const { error } = await supabase
        .from('dakwah_disabled')
        .delete()
        .eq('santri_id', santri_id)
        .eq('type', type)

      if (error) return errorResponse(error.message, 'ENABLE_ERROR', 500)
      return successResponse(null, 'Santri diaktifkan kembali')
    }

    return errorResponse('Invalid action', 'INVALID_ACTION', 400)
  } catch (error) {
    console.error('POST error:', error)
    return serverErrorResponse(error)
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const body = await request.json()
    const { action } = body

    // ==========================================
    // ACTION: Toggle Complete
    // ==========================================
    if (action === 'toggle_complete') {
      const { schedule_id, completed } = body

      // Update status
      const { data, error } = await supabase
        .from('dakwah_schedule')
        .update({ is_active: !completed })
        .eq('id', schedule_id)
        .select()
        .single()

      if (error) return errorResponse(error.message, 'UPDATE_ERROR', 500)

      // Untuk Muadzin: cukup update status, tidak perlu rotasi
      if (data.type === 'muadzin') {
        return successResponse(data, 'Status updated')
      }

      // Untuk Imam & Kultum: rotasi jika selesai
      const type = data.type
      const today = new Date().toISOString().split('T')[0]

      if (!completed) {
        const { data: allSchedules } = await supabase
          .from('dakwah_schedule')
          .select('*')
          .eq('type', type)
          .gte('schedule_date', today)
          .order('schedule_date', { ascending: true })

        if (allSchedules && allSchedules.length > 0) {
          const activeSchedules = allSchedules.filter(s => s.is_active)
          
          if (activeSchedules.length === 0) {
            await generateScheduleForType(supabase, type)
            return successResponse(data, 'Semua selesai! Jadwal baru dibuat otomatis')
          }
        }
      }

      return successResponse(data, 'Status updated')
    }

    // ==========================================
    // ACTION: Toggle Adzan (Muadzin)
    // ==========================================
    if (action === 'toggle_adzan') {
      const { schedule_id, waktu } = body

      const { data, error } = await supabase
        .from('dakwah_schedule')
        .select(waktu)
        .eq('id', schedule_id)
        .single()

      if (error) return errorResponse(error.message, 'DB_ERROR', 500)

      const currentValue = data[waktu]
      
      const { data: updated, error: updateError } = await supabase
        .from('dakwah_schedule')
        .update({ [waktu]: !currentValue })
        .eq('id', schedule_id)
        .select()
        .single()

      if (updateError) return errorResponse(updateError.message, 'UPDATE_ERROR', 500)

      return successResponse(updated, `Adzan ${waktu} ${!currentValue ? 'sudah' : 'belum'}`)
    }

    return errorResponse('Invalid action', 'INVALID_ACTION', 400)
  } catch (error) {
    console.error('PUT error:', error)
    return serverErrorResponse(error)
  }
}

// ==========================================
// HELPER FUNCTION
// ==========================================
async function generateScheduleForType(supabase: any, type: string) {
  const today = new Date().toISOString().split('T')[0]

  const { data: kelasMembers } = await supabase
    .from('kelas_members')
    .select('user_id, kelas_id, nomor_absen')

  if (!kelasMembers || kelasMembers.length === 0) return

  const userIds = [...new Set(kelasMembers.map(m => m.user_id))]
  const { data: users } = await supabase
    .from('users')
    .select('id, name')
    .in('id', userIds)

  const kelasIds = [...new Set(kelasMembers.map(m => m.kelas_id))]
  const { data: kelas } = await supabase
    .from('kelas')
    .select('id, name')
    .in('id', kelasIds)

  const { data: disabled } = await supabase
    .from('dakwah_disabled')
    .select('*')
    .eq('type', type)

  const disabledIds = disabled?.map(d => d.santri_id) || []

  const enrichedMembers = kelasMembers.map(member => {
    const user = users?.find(u => u.id === member.user_id)
    const kelasData = kelas?.find(k => k.id === member.kelas_id)
    return {
      user_id: member.user_id,
      kelas_id: member.kelas_id,
      nomor_absen: member.nomor_absen,
      users: user || { id: '', name: 'Unknown' },
      kelas: kelasData || { id: '', name: '' },
    }
  })

  // Hapus jadwal lama
  await supabase.from('dakwah_schedule').delete().eq('type', type).gte('schedule_date', today)

  const entries: any[] = []
  let currentDate = new Date(today)

  if (type === 'imam') {
    const eligible = enrichedMembers
      .filter(m => {
        const k = m.kelas?.name || ''
        return (k === '11' || k === '12') && !disabledIds.includes(m.user_id)
      })
      .sort((a, b) => {
        const ka = parseInt(a.kelas?.name || '0')
        const kb = parseInt(b.kelas?.name || '0')
        if (ka !== kb) return ka - kb
        return (a.nomor_absen || 999) - (b.nomor_absen || 999)
      })

    for (let i = 0; i < Math.min(eligible.length, 30); i++) {
      const s = eligible[i % eligible.length]
      entries.push({
        type, schedule_date: currentDate.toISOString().split('T')[0],
        santri_id: s.user_id, santri_name: s.users.name,
        kelas_id: s.kelas_id, kelas_name: s.kelas?.name || '',
        nomor_absen: s.nomor_absen, is_active: true,
      })
      currentDate.setDate(currentDate.getDate() + 1)
    }
  }

  if (type === 'muadzin') {
    const eligible = enrichedMembers
      .filter(m => (m.kelas?.name || '') === '10' && !disabledIds.includes(m.user_id))
      .sort((a, b) => (a.nomor_absen || 999) - (b.nomor_absen || 999))

    for (let i = 0; i < Math.min(eligible.length, 30); i++) {
      const s = eligible[i % eligible.length]
      entries.push({
        type, schedule_date: currentDate.toISOString().split('T')[0],
        santri_id: s.user_id, santri_name: s.users.name,
        kelas_id: s.kelas_id, kelas_name: s.kelas?.name || '',
        nomor_absen: s.nomor_absen, is_active: true,
        subuh: false, dhuhur: false, ashar: false, maghrib: false, isya: false,
      })
      currentDate.setDate(currentDate.getDate() + 1)
    }
  }

  if (type === 'kultum') {
    const eligible = enrichedMembers
      .filter(m => !disabledIds.includes(m.user_id))
      .sort((a, b) => {
        const ka = parseInt(a.kelas?.name || '0')
        const kb = parseInt(b.kelas?.name || '0')
        if (ka !== kb) return kb - ka
        return (a.nomor_absen || 999) - (b.nomor_absen || 999)
      })

    let idx = 0
    for (let i = 0; i < Math.min(Math.ceil(eligible.length / 2), 30); i++) {
      const s1 = eligible[idx % eligible.length]
      entries.push({
        type, schedule_date: currentDate.toISOString().split('T')[0],
        santri_id: s1.user_id, santri_name: s1.users.name,
        kelas_id: s1.kelas_id, kelas_name: s1.kelas?.name || '',
        nomor_absen: s1.nomor_absen, waktu: 'subuh', is_active: true,
      })
      idx++

      const s2 = eligible[idx % eligible.length]
      entries.push({
        type, schedule_date: currentDate.toISOString().split('T')[0],
        santri_id: s2.user_id, santri_name: s2.users.name,
        kelas_id: s2.kelas_id, kelas_name: s2.kelas?.name || '',
        nomor_absen: s2.nomor_absen, waktu: 'dhuhur', is_active: true,
      })
      idx++
      currentDate.setDate(currentDate.getDate() + 1)
    }
  }

  if (entries.length > 0) {
    await supabase.from('dakwah_schedule').insert(entries)
  }
}